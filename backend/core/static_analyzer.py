"""
static_analyzer.py
Runs Bandit (Python) and Semgrep (multi-language) on source code.
Normalizes results into the same vulnerability dict format as llm_scanner.py.
"""

import json
import logging
import os
import subprocess
import tempfile
from typing import List, Dict

logger = logging.getLogger(__name__)

# ── Severity mappings ──────────────────────────────────────
BANDIT_SEVERITY_MAP = {
    "HIGH":   "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW":    "LOW",
}
SEMGREP_SEVERITY_MAP = {
    "ERROR":   "HIGH",
    "WARNING": "MEDIUM",
    "INFO":    "LOW",
}

# ── CWE lookup for common Bandit rule IDs ─────────────────
BANDIT_CWE_MAP = {
    "B101": "CWE-703",  "B102": "CWE-78",   "B103": "CWE-732",
    "B104": "CWE-605",  "B105": "CWE-259",  "B106": "CWE-259",
    "B107": "CWE-259",  "B108": "CWE-377",  "B110": "CWE-391",
    "B112": "CWE-391",  "B201": "CWE-94",   "B301": "CWE-502",
    "B302": "CWE-502",  "B303": "CWE-327",  "B304": "CWE-327",
    "B305": "CWE-327",  "B306": "CWE-377",  "B307": "CWE-78",
    "B308": "CWE-79",   "B310": "CWE-601",  "B311": "CWE-338",
    "B312": "CWE-319",  "B313": "CWE-611",  "B314": "CWE-611",
    "B315": "CWE-611",  "B316": "CWE-611",  "B317": "CWE-611",
    "B318": "CWE-611",  "B319": "CWE-611",  "B320": "CWE-611",
    "B321": "CWE-319",  "B322": "CWE-78",   "B323": "CWE-295",
    "B324": "CWE-327",  "B325": "CWE-327",  "B401": "CWE-319",
    "B402": "CWE-319",  "B403": "CWE-502",  "B404": "CWE-78",
    "B405": "CWE-611",  "B406": "CWE-611",  "B407": "CWE-611",
    "B408": "CWE-611",  "B409": "CWE-611",  "B410": "CWE-611",
    "B411": "CWE-611",  "B412": "CWE-319",  "B413": "CWE-327",
    "B501": "CWE-295",  "B502": "CWE-326",  "B503": "CWE-326",
    "B504": "CWE-326",  "B505": "CWE-326",  "B506": "CWE-20",
    "B507": "CWE-295",  "B601": "CWE-78",   "B602": "CWE-78",
    "B603": "CWE-78",   "B604": "CWE-78",   "B605": "CWE-78",
    "B606": "CWE-78",   "B607": "CWE-78",   "B608": "CWE-89",
    "B609": "CWE-78",   "B610": "CWE-89",   "B611": "CWE-89",
    "B701": "CWE-94",   "B702": "CWE-94",   "B703": "CWE-79",
}


def _write_temp(content: str, suffix: str) -> str:
    """Write content to a temp file and return its path."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(content)
    return path


# ── BANDIT ────────────────────────────────────────────────
def run_bandit(code: str, file_path: str) -> List[Dict]:
    """Run Bandit on Python source and return normalized vulns."""
    if not file_path.endswith(".py"):
        return []

    tmp = _write_temp(code, ".py")
    try:
        result = subprocess.run(
            ["bandit", "-f", "json", "-ll", tmp],
            capture_output=True, text=True, timeout=30
        )
        output = result.stdout.strip()
        if not output:
            return []

        data = json.loads(output)
        vulns = []
        for i, issue in enumerate(data.get("results", []), 1):
            test_id = issue.get("test_id", "")
            vulns.append({
                "id":          i,
                "type":        issue.get("test_name", "Unknown").replace("_", " ").title(),
                "severity":    BANDIT_SEVERITY_MAP.get(issue.get("issue_severity", "LOW"), "LOW"),
                "source":      "Bandit",
                "file":        file_path,
                "line":        issue.get("line_number", 1),
                "description": issue.get("issue_text", ""),
                "fix":         f"See Bandit rule {test_id}. Refer to CWE for remediation guidance.",
                "fix_code":    None,
                "cwe":         BANDIT_CWE_MAP.get(test_id, "CWE-unknown"),
                "confidence":  {"HIGH": 0.9, "MEDIUM": 0.7, "LOW": 0.5}.get(
                                   issue.get("issue_confidence", "LOW"), 0.5),
            })
        return vulns

    except FileNotFoundError:
        logger.warning("Bandit not installed. Run: pip install bandit")
        return []
    except subprocess.TimeoutExpired:
        logger.warning(f"Bandit timed out on {file_path}")
        return []
    except json.JSONDecodeError:
        return []
    finally:
        os.unlink(tmp)


# ── SEMGREP ───────────────────────────────────────────────
SEMGREP_LANG_MAP = {
    "python":     "python",
    "javascript": "javascript",
    "typescript": "typescript",
    "java":       "java",
    "php":        "php",
    "go":         "go",
    "ruby":       "ruby",
    "c":          "c",
    "cpp":        "cpp",
    "csharp":     "csharp",
}


def run_semgrep(code: str, file_path: str, language: str = "python") -> List[Dict]:
    """Run Semgrep auto-config scan and return normalized vulns."""
    ext_map = {
        "python": ".py", "javascript": ".js", "typescript": ".ts",
        "java": ".java", "php": ".php", "go": ".go", "ruby": ".rb",
        "c": ".c", "cpp": ".cpp", "csharp": ".cs",
    }
    ext = ext_map.get(language, ".py")
    tmp = _write_temp(code, ext)

    try:
        result = subprocess.run(
            ["semgrep", "--config=auto", "--json", "--quiet", tmp],
            capture_output=True, text=True, timeout=60
        )
        output = result.stdout.strip()
        if not output:
            return []

        data = json.loads(output)
        vulns = []
        for i, finding in enumerate(data.get("results", []), 1):
            meta    = finding.get("extra", {}).get("metadata", {})
            message = finding.get("extra", {}).get("message", "")
            sev_raw = finding.get("extra", {}).get("severity", "WARNING")

            # Pull CWE from semgrep metadata if available
            cwe_list = meta.get("cwe", [])
            cwe = cwe_list[0] if cwe_list else "CWE-unknown"

            vulns.append({
                "id":          i,
                "type":        finding.get("check_id", "").split(".")[-1].replace("-", " ").title(),
                "severity":    SEMGREP_SEVERITY_MAP.get(sev_raw, "MEDIUM"),
                "source":      "Semgrep",
                "file":        file_path,
                "line":        finding.get("start", {}).get("line", 1),
                "description": message,
                "fix":         meta.get("fix-guidance", "Refer to the Semgrep rule documentation."),
                "fix_code":    finding.get("extra", {}).get("fix"),
                "cwe":         cwe,
                "confidence":  0.75,
            })
        return vulns

    except FileNotFoundError:
        logger.warning("Semgrep not installed. Run: pip install semgrep")
        return []
    except subprocess.TimeoutExpired:
        logger.warning(f"Semgrep timed out on {file_path}")
        return []
    except json.JSONDecodeError:
        return []
    finally:
        os.unlink(tmp)


# ── Deduplicator ──────────────────────────────────────────
def deduplicate(vulns: List[Dict]) -> List[Dict]:
    """
    Remove near-duplicate findings (same type + same line ± 2).
    LLM findings take priority over static tools when overlapping.
    """
    llm_vulns    = [v for v in vulns if v["source"] == "LLM"]
    static_vulns = [v for v in vulns if v["source"] != "LLM"]

    kept = list(llm_vulns)
    for sv in static_vulns:
        overlap = any(
            sv.get("type", "").lower() in kv.get("type", "").lower()
            and abs((sv.get("line") or 0) - (kv.get("line") or 0)) <= 3
            for kv in kept
        )
        if not overlap:
            kept.append(sv)

    # Assign sequential IDs
    for i, v in enumerate(kept, 1):
        v["id"] = i

    return kept
