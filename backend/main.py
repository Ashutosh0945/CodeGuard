"""
main.py
CodeGuard FastAPI backend.

Endpoints:
  POST /api/scan/repo     — scan a GitHub repository
  POST /api/scan/file     — scan a single uploaded file
  POST /api/ask           — ask Gemini about a specific vulnerability
  GET  /api/benchmark     — run benchmark (LLM vs Bandit vs Semgrep)
  GET  /api/health        — health check
  GET  /docs              — Swagger UI (auto-generated)
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from models import (
    RepoScanRequest, FileScanRequest, AskRequest,
    ScanResponse, FileResult, ScanSummary,
    Vulnerability, Severity, Source,
    BenchmarkResponse, AskResponse,
)
from core.github_fetcher import fetch_repo_files, get_repo_info
from core.llm_scanner import scan_with_llm, ask_about_vuln
from core.static_analyzer import run_bandit, run_semgrep, deduplicate
from core.benchmark import run_benchmark, format_benchmark_report, load_juliet_samples

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
logger = logging.getLogger(__name__)


# ── App setup ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🛡️  {settings.APP_NAME} v{settings.APP_VERSION} starting…")
    logger.info(f"Groq model: llama-3.1-70b-versatile")
    yield
    logger.info("Shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="LLM-Powered Code Vulnerability Scanner — Gemini AI + Semgrep + Bandit",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────
def _build_summary(all_vulns: List[dict]) -> ScanSummary:
    summary = ScanSummary()
    summary.total = len(all_vulns)
    for v in all_vulns:
        sev = v.get("severity", "LOW")
        if sev == "CRITICAL":  summary.critical += 1
        elif sev == "HIGH":    summary.high += 1
        elif sev == "MEDIUM":  summary.medium += 1
        else:                  summary.low += 1
        # By source
        src = v.get("source", "Unknown")
        summary.by_source[src] = summary.by_source.get(src, 0) + 1
        # By type
        vtype = v.get("type", "Unknown")
        summary.by_type[vtype] = summary.by_type.get(vtype, 0) + 1
    return summary


def _scan_single_file(path: str, content: str, language: str) -> FileResult:
    """Run all three tools on one file and return merged results."""
    llm_vulns     = scan_with_llm(path, content, language)
    bandit_vulns  = run_bandit(content, path)
    semgrep_vulns = run_semgrep(content, path, language)

    # Ensure source field is set
    for v in llm_vulns:    v["source"] = "LLM"
    for v in bandit_vulns: v["source"] = "Bandit"
    for v in semgrep_vulns:v["source"] = "Semgrep"

    all_vulns = deduplicate(llm_vulns + bandit_vulns + semgrep_vulns)

    # Sort by severity
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}
    all_vulns.sort(key=lambda v: sev_order.get(v.get("severity", "LOW"), 4))

    return FileResult(
        file=path,
        language=language,
        llm_vulns=[Vulnerability(**{**v, "source": Source.LLM})    for v in llm_vulns],
        bandit_vulns=[Vulnerability(**{**v, "source": Source.BANDIT}) for v in bandit_vulns],
        semgrep_vulns=[Vulnerability(**{**v, "source": Source.SEMGREP}) for v in semgrep_vulns],
        all_vulns=[Vulnerability(**v) for v in all_vulns],
    )


# ── Routes ────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status":  "ok",
        "version": settings.APP_VERSION,
        "model":   settings.CLAUDE_MODEL,
    }


@app.post("/api/scan/repo", response_model=ScanResponse)
async def scan_repo(req: RepoScanRequest):
    """
    Scan all code files in a GitHub repository.
    Runs Gemini AI + Bandit + Semgrep on each file.
    """
    if not settings.GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured.")
    if not req.repo_url.startswith("http"):
        raise HTTPException(400, "Invalid repo URL. Must start with https://")

    start = time.time()
    logger.info(f"Repo scan requested: {req.repo_url}")

    try:
        files = fetch_repo_files(
            repo_url=req.repo_url,
            branch=req.branch or "main",
            max_files=min(req.max_files or 20, settings.MAX_FILES_PER_SCAN),
            extensions=req.extensions,
        )
    except Exception as e:
        raise HTTPException(422, f"Failed to fetch repository: {e}")

    if not files:
        raise HTTPException(404, "No scannable files found in this repository.")

    results: List[FileResult] = []
    all_vulns_flat = []

    for f in files:
        logger.info(f"Scanning {f['path']}…")
        try:
            result = _scan_single_file(f["path"], f["content"], f["language"])
            results.append(result)
            all_vulns_flat.extend([v.dict() for v in result.all_vulns])
        except Exception as e:
            logger.error(f"Error scanning {f['path']}: {e}")
            continue

    duration = round(time.time() - start, 2)
    summary  = _build_summary(all_vulns_flat)

    return ScanResponse(
        repo_url=req.repo_url,
        files_scanned=len(results),
        total_files=len(files),
        results=results,
        all_vulnerabilities=[Vulnerability(**v) for v in all_vulns_flat],
        summary=summary,
        scan_duration_seconds=duration,
    )


@app.post("/api/scan/file", response_model=ScanResponse)
async def scan_file(req: FileScanRequest):
    """Scan a single file passed as text content."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured.")
    if not req.content.strip():
        raise HTTPException(400, "File content is empty.")

    start  = time.time()
    result = _scan_single_file(req.filename, req.content, req.language or "python")
    duration = round(time.time() - start, 2)

    all_vulns_flat = [v.dict() for v in result.all_vulns]
    return ScanResponse(
        filename=req.filename,
        files_scanned=1,
        total_files=1,
        results=[result],
        all_vulnerabilities=result.all_vulns,
        summary=_build_summary(all_vulns_flat),
        scan_duration_seconds=duration,
    )


@app.post("/api/scan/upload")
async def scan_upload(files: List[UploadFile] = File(...)):
    """Accept uploaded files and scan them."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured.")

    EXT_LANG = {
        "py":"python","js":"javascript","ts":"typescript","java":"java",
        "php":"php","go":"go","rb":"ruby","cpp":"cpp","c":"c","cs":"csharp",
    }
    all_results = []
    all_vulns   = []

    for upload in files[:5]:   # max 5 files per upload
        content_bytes = await upload.read()
        content = content_bytes.decode("utf-8", errors="ignore")
        ext = upload.filename.rsplit(".", 1)[-1].lower()
        lang = EXT_LANG.get(ext, "python")
        result = _scan_single_file(upload.filename, content, lang)
        all_results.append(result)
        all_vulns.extend([v.dict() for v in result.all_vulns])

    return ScanResponse(
        files_scanned=len(all_results),
        total_files=len(files),
        results=all_results,
        all_vulnerabilities=[Vulnerability(**v) for v in all_vulns],
        summary=_build_summary(all_vulns),
    )


@app.post("/api/ask", response_model=AskResponse)
async def ask_ai(req: AskRequest):
    """Ask Gemini a question about a specific detected vulnerability."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured.")
    try:
        answer = ask_about_vuln(
            question=req.question,
            vuln_type=req.vuln_type,
            cwe=req.cwe,
            file_path=req.file_path,
            description=req.description,
        )
        return AskResponse(answer=answer, vuln_type=req.vuln_type)
    except Exception as e:
        raise HTTPException(500, f"Gemini API error: {e}")


@app.get("/api/benchmark")
async def benchmark(juliet_dir: str = "./datasets/juliet", use_llm: bool = False):
    """
    Run benchmark evaluation: LLM vs Bandit vs Semgrep.
    Set use_llm=true to include Gemini (costs API credits).
    """
    test_cases = load_juliet_samples(juliet_dir, max_cases=50)
    if not test_cases:
        raise HTTPException(404, "No test cases found. Check juliet_dir path.")

    results = run_benchmark(test_cases, use_llm=use_llm)
    report  = format_benchmark_report(results, "Juliet Test Suite v1.3", len(test_cases))
    return report


@app.get("/api/repo-info")
async def repo_info(url: str):
    """Return basic metadata about a GitHub repository."""
    try:
        return get_repo_info(url)
    except Exception as e:
        raise HTTPException(422, str(e))


# ── Run ───────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
