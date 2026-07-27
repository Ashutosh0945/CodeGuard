import logging, time
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from models import RepoScanRequest, FileScanRequest, AskRequest, ScanResponse, FileResult, ScanSummary, Vulnerability, Severity, Source, AskResponse
from core.github_fetcher import fetch_repo_files, get_repo_info
from core.llm_scanner import scan_with_llm, ask_about_vuln
from core.static_analyzer import run_bandit, run_semgrep, deduplicate
from core.benchmark import run_benchmark, format_benchmark_report, load_juliet_samples

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"CodeGuard API v{settings.APP_VERSION} starting")
    logger.info("Groq model: llama-3.3-70b-versatile")
    yield
    logger.info("Shutting down.")

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["GET","POST","PUT","DELETE","OPTIONS"], allow_headers=["*"])

def _build_summary(all_vulns):
    from models import ScanSummary
    summary = ScanSummary()
    summary.total = len(all_vulns)
    for v in all_vulns:
        sev = v.get("severity","LOW")
        if sev=="CRITICAL": summary.critical+=1
        elif sev=="HIGH": summary.high+=1
        elif sev=="MEDIUM": summary.medium+=1
        else: summary.low+=1
        src=v.get("source","Unknown"); summary.by_source[src]=summary.by_source.get(src,0)+1
        vt=v.get("type","Unknown"); summary.by_type[vt]=summary.by_type.get(vt,0)+1
    return summary

def _scan_single_file(path, content, language):
    llm_vulns=scan_with_llm(path,content,language)
    bandit_vulns=run_bandit(content,path)
    semgrep_vulns=run_semgrep(content,path,language)
    for v in llm_vulns: v["source"]="LLM"
    for v in bandit_vulns: v["source"]="Bandit"
    for v in semgrep_vulns: v["source"]="Semgrep"
    all_vulns=deduplicate(llm_vulns+bandit_vulns+semgrep_vulns)
    sev_order={"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3,"INFO":4}
    all_vulns.sort(key=lambda v:sev_order.get(v.get("severity","LOW"),4))
    return FileResult(file=path,language=language,llm_vulns=[Vulnerability(**{**v,"source":Source.LLM}) for v in llm_vulns],bandit_vulns=[Vulnerability(**{**v,"source":Source.BANDIT}) for v in bandit_vulns],semgrep_vulns=[Vulnerability(**{**v,"source":Source.SEMGREP}) for v in semgrep_vulns],all_vulns=[Vulnerability(**v) for v in all_vulns])

@app.get("/api/health")
def health():
    return {"status":"ok","version":settings.APP_VERSION}

@app.post("/api/scan/repo", response_model=ScanResponse)
async def scan_repo(req: RepoScanRequest):
    if not settings.GROQ_API_KEY: raise HTTPException(500,"GROQ_API_KEY not configured.")
    start=time.time()
    try: files=fetch_repo_files(repo_url=req.repo_url,branch=req.branch or "main",max_files=min(req.max_files or 20,settings.MAX_FILES_PER_SCAN),extensions=req.extensions)
    except Exception as e: raise HTTPException(422,f"Failed to fetch repository: {e}")
    if not files: raise HTTPException(404,"No scannable files found.")
    results=[]; all_vulns_flat=[]
    for f in files:
        try:
            result=_scan_single_file(f["path"],f["content"],f["language"])
            results.append(result); all_vulns_flat.extend([v.dict() for v in result.all_vulns])
        except Exception as e: logger.error(f"Error scanning {f['path']}: {e}")
    duration=round(time.time()-start,2)
    return ScanResponse(repo_url=req.repo_url,files_scanned=len(results),total_files=len(files),results=results,all_vulnerabilities=[Vulnerability(**v) for v in all_vulns_flat],summary=_build_summary(all_vulns_flat),scan_duration_seconds=duration)

@app.post("/api/scan/file", response_model=ScanResponse)
async def scan_file(req: FileScanRequest):
    if not settings.GROQ_API_KEY: raise HTTPException(500,"GROQ_API_KEY not configured.")
    start=time.time()
    result=_scan_single_file(req.filename,req.content,req.language or "python")
    all_vulns_flat=[v.dict() for v in result.all_vulns]
    return ScanResponse(filename=req.filename,files_scanned=1,total_files=1,results=[result],all_vulnerabilities=result.all_vulns,summary=_build_summary(all_vulns_flat),scan_duration_seconds=round(time.time()-start,2))

@app.post("/api/scan/upload")
async def scan_upload(files: List[UploadFile]=File(...)):
    if not settings.GROQ_API_KEY: raise HTTPException(500,"GROQ_API_KEY not configured.")
    EXT_LANG={"py":"python","js":"javascript","ts":"typescript","java":"java","php":"php","go":"go","rb":"ruby","cpp":"cpp","c":"c","cs":"csharp"}
    all_results=[]; all_vulns=[]
    for upload in files[:5]:
        content_bytes=await upload.read()
        content=content_bytes.decode("utf-8",errors="ignore")
        ext=upload.filename.rsplit(".",1)[-1].lower()
        lang=EXT_LANG.get(ext,"python")
        result=_scan_single_file(upload.filename,content,lang)
        all_results.append(result); all_vulns.extend([v.dict() for v in result.all_vulns])
    return ScanResponse(files_scanned=len(all_results),total_files=len(files),results=all_results,all_vulnerabilities=[Vulnerability(**v) for v in all_vulns],summary=_build_summary(all_vulns))

@app.post("/api/ask", response_model=AskResponse)
async def ask_ai(req: AskRequest):
    if not settings.GROQ_API_KEY: raise HTTPException(500,"GROQ_API_KEY not configured.")
    try:
        answer=ask_about_vuln(question=req.question,vuln_type=req.vuln_type,cwe=req.cwe,file_path=req.file_path,description=req.description)
        return AskResponse(answer=answer,vuln_type=req.vuln_type)
    except Exception as e: raise HTTPException(500,f"Groq API error: {e}")

@app.get("/api/benchmark")
async def benchmark(juliet_dir: str="./datasets/juliet",use_llm: bool=False):
    test_cases=load_juliet_samples(juliet_dir,max_cases=50)
    if not test_cases: raise HTTPException(404,"No test cases found.")
    results=run_benchmark(test_cases,use_llm=use_llm)
    return format_benchmark_report(results,"Juliet Test Suite v1.3",len(test_cases))

@app.get("/api/repo-info")
async def repo_info(url: str):
    try: return get_repo_info(url)
    except Exception as e: raise HTTPException(422,str(e))

if __name__=="__main__":
    import uvicorn
    uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=True)




