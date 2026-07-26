from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from enum import Enum


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MEDIUM   = "MEDIUM"
    LOW      = "LOW"
    INFO     = "INFO"


class Source(str, Enum):
    LLM     = "LLM"
    BANDIT  = "Bandit"
    SEMGREP = "Semgrep"


# ── Requests ──────────────────────────────────────────────
class RepoScanRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = "main"
    max_files: Optional[int] = 20
    extensions: Optional[List[str]] = [".py", ".js", ".ts", ".java", ".php", ".go", ".rb"]


class FileScanRequest(BaseModel):
    filename: str
    content: str
    language: Optional[str] = "python"


class AskRequest(BaseModel):
    question: str
    vuln_type: str
    cwe: str
    file_path: str
    description: str


# ── Vulnerability ──────────────────────────────────────────
class Vulnerability(BaseModel):
    id: Optional[int] = None
    type: str
    severity: Severity
    source: Source
    file: str
    line: Optional[int] = None
    description: str
    fix: str
    fix_code: Optional[str] = None
    cwe: Optional[str] = None
    confidence: Optional[float] = None


# ── File Result ────────────────────────────────────────────
class FileResult(BaseModel):
    file: str
    language: str
    llm_vulns: List[Vulnerability] = []
    bandit_vulns: List[Vulnerability] = []
    semgrep_vulns: List[Vulnerability] = []
    all_vulns: List[Vulnerability] = []
    scan_time_ms: Optional[int] = None


# ── Scan Summary ───────────────────────────────────────────
class ScanSummary(BaseModel):
    total: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    by_source: dict = {}
    by_type: dict = {}


# ── Scan Response ──────────────────────────────────────────
class ScanResponse(BaseModel):
    repo_url: Optional[str] = None
    filename: Optional[str] = None
    files_scanned: int = 0
    total_files: int = 0
    results: List[FileResult] = []
    all_vulnerabilities: List[Vulnerability] = []
    summary: ScanSummary = ScanSummary()
    scan_duration_seconds: Optional[float] = None


# ── Benchmark ──────────────────────────────────────────────
class ToolMetrics(BaseModel):
    tool: str
    precision: float
    recall: float
    f1: float
    false_positives: int
    false_negatives: int
    total_detected: int
    speed_ms_per_file: float


class BenchmarkResponse(BaseModel):
    dataset: str
    total_test_cases: int
    results: List[ToolMetrics]
    best_tool: str
    notes: str


# ── AI Ask ────────────────────────────────────────────────
class AskResponse(BaseModel):
    answer: str
    vuln_type: str
