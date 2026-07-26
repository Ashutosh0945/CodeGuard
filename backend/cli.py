#!/usr/bin/env python3
"""
cli.py  —  CodeGuard Command-Line Interface

Usage:
  python cli.py --repo https://github.com/owner/repo
  python cli.py --file app.py
  python cli.py --file app.py --output report.json
  python cli.py --repo https://github.com/owner/repo --max-files 10 --no-llm
"""

import argparse
import json
import os
import sys
import time

# Colour codes (work on Linux/Mac/Windows Terminal)
RED     = "\033[91m"
ORANGE  = "\033[93m"
YELLOW  = "\033[33m"
GREEN   = "\033[92m"
CYAN    = "\033[96m"
BOLD    = "\033[1m"
RESET   = "\033[0m"
DIM     = "\033[2m"

SEV_COLOR = {
    "CRITICAL": RED,
    "HIGH":     ORANGE,
    "MEDIUM":   YELLOW,
    "LOW":      GREEN,
}

BANNER = f"""
{CYAN}{BOLD}
   ██████╗ ██████╗ ██████╗ ███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
  ██║     ██║   ██║██║  ██║█████╗  ██║  ███╗██║   ██║███████║██████╔╝██║  ██║
  ██║     ██║   ██║██║  ██║██╔══╝  ██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
  ╚██████╗╚██████╔╝██████╔╝███████╗╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
{RESET}{DIM}  LLM-Powered Code Vulnerability Scanner  |  Gemini AI + Semgrep + Bandit{RESET}
"""


def print_vuln(v: dict, idx: int):
    sev   = v.get("severity", "LOW")
    color = SEV_COLOR.get(sev, RESET)
    print(f"\n  {BOLD}[{idx}] {color}{sev}{RESET}  {BOLD}{v.get('type', 'Unknown')}{RESET}")
    print(f"      {DIM}File:{RESET} {v.get('file', '?')}  {DIM}Line:{RESET} {v.get('line', '?')}")
    print(f"      {DIM}Source:{RESET} {v.get('source', '?')}  {DIM}CWE:{RESET} {v.get('cwe', '?')}")
    print(f"      {v.get('description', '')}")
    if v.get("fix"):
        print(f"      {GREEN}Fix:{RESET} {v.get('fix')}")


def print_summary(all_vulns: list):
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for v in all_vulns:
        sev = v.get("severity", "LOW")
        counts[sev] = counts.get(sev, 0) + 1

    print(f"\n{BOLD}{'─'*60}")
    print(f"  SCAN SUMMARY")
    print(f"{'─'*60}{RESET}")
    print(f"  Total vulnerabilities : {BOLD}{len(all_vulns)}{RESET}")
    print(f"  {RED}Critical{RESET}              : {counts['CRITICAL']}")
    print(f"  {ORANGE}High{RESET}                  : {counts['HIGH']}")
    print(f"  {YELLOW}Medium{RESET}                : {counts['MEDIUM']}")
    print(f"  {GREEN}Low{RESET}                   : {counts['LOW']}")
    print(f"{BOLD}{'─'*60}{RESET}")


def run_via_api(args) -> dict:
    """Call the running FastAPI backend."""
    import httpx
    base = args.api_url or "http://localhost:8000"

    if args.repo:
        resp = httpx.post(
            f"{base}/api/scan/repo",
            json={"repo_url": args.repo, "max_files": args.max_files},
            timeout=args.timeout,
        )
    elif args.file:
        with open(args.file, encoding="utf-8", errors="ignore") as f:
            content = f.read()
        ext  = args.file.rsplit(".", 1)[-1]
        lang_map = {"py":"python","js":"javascript","ts":"typescript","java":"java"}
        resp = httpx.post(
            f"{base}/api/scan/file",
            json={"filename": os.path.basename(args.file), "content": content,
                  "language": lang_map.get(ext, "python")},
            timeout=args.timeout,
        )
    else:
        print("Error: specify --repo or --file", file=sys.stderr)
        sys.exit(1)

    resp.raise_for_status()
    return resp.json()


def run_direct(args) -> dict:
    """Run scan directly (without the API server) — useful for CI/CD."""
    sys.path.insert(0, os.path.dirname(__file__))
    from core.llm_scanner import scan_with_llm
    from core.static_analyzer import run_bandit, run_semgrep, deduplicate

    all_vulns = []

    if args.file:
        with open(args.file, encoding="utf-8", errors="ignore") as f:
            content = f.read()
        ext  = args.file.rsplit(".", 1)[-1]
        lang_map = {"py":"python","js":"javascript","ts":"typescript","java":"java"}
        lang = lang_map.get(ext, "python")
        path = os.path.basename(args.file)

        llm_v    = scan_with_llm(path, content, lang) if not args.no_llm else []
        bandit_v = run_bandit(content, path)
        semgrep_v= run_semgrep(content, path, lang)

        for v in llm_v:     v["source"] = "LLM"
        for v in bandit_v:  v["source"] = "Bandit"
        for v in semgrep_v: v["source"] = "Semgrep"

        all_vulns = deduplicate(llm_v + bandit_v + semgrep_v)

    return {"all_vulnerabilities": all_vulns, "files_scanned": 1}


def main():
    parser = argparse.ArgumentParser(
        description="CodeGuard — LLM-Powered Code Vulnerability Scanner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py --repo https://github.com/pallets/flask
  python cli.py --file app.py
  python cli.py --file app.py --output results.json
  python cli.py --repo https://github.com/owner/repo --max-files 5 --no-llm
        """
    )
    parser.add_argument("--repo",       help="GitHub repository URL to scan")
    parser.add_argument("--file",       help="Local file path to scan")
    parser.add_argument("--output",     help="Save results to JSON file")
    parser.add_argument("--max-files",  type=int, default=20, help="Max files to scan (default: 20)")
    parser.add_argument("--no-llm",     action="store_true",  help="Skip Gemini AI (faster, no API cost)")
    parser.add_argument("--api-url",    default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--direct",     action="store_true",  help="Run without API server")
    parser.add_argument("--timeout",    type=int, default=120, help="Request timeout in seconds")
    parser.add_argument("--severity",   choices=["CRITICAL","HIGH","MEDIUM","LOW"], help="Filter by severity")
    parser.add_argument("--json-only",  action="store_true", help="Output JSON only (for CI/CD pipelines)")
    args = parser.parse_args()

    if not args.repo and not args.file:
        parser.print_help()
        sys.exit(1)

    if not args.json_only:
        print(BANNER)
        target = args.repo or args.file
        print(f"  {CYAN}Target:{RESET} {target}")
        print(f"  {CYAN}Mode:{RESET}   {'Direct' if args.direct else 'API'}")
        print(f"  {CYAN}LLM:{RESET}    {'Disabled' if args.no_llm else 'Gemini AI'}")
        print()

    start = time.time()
    try:
        if args.direct or args.file:
            data = run_direct(args)
        else:
            data = run_via_api(args)
    except Exception as e:
        print(f"{RED}Error: {e}{RESET}", file=sys.stderr)
        sys.exit(1)

    vulns = data.get("all_vulnerabilities", [])

    # Filter
    if args.severity:
        sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        max_level = sev_order[args.severity]
        vulns = [v for v in vulns if sev_order.get(v.get("severity","LOW"), 3) <= max_level]

    if args.json_only:
        print(json.dumps({"vulnerabilities": vulns, "total": len(vulns)}, indent=2))
        sys.exit(1 if vulns else 0)

    # Pretty print
    if not vulns:
        print(f"{GREEN}{BOLD}  ✅ No vulnerabilities found!{RESET}")
    else:
        print(f"{BOLD}  VULNERABILITIES FOUND:{RESET}")
        for i, v in enumerate(vulns, 1):
            print_vuln(v, i)

    print_summary(vulns)
    print(f"\n  {DIM}Scan completed in {round(time.time()-start, 2)}s{RESET}")
    print(f"  {DIM}Files scanned: {data.get('files_scanned', 1)}{RESET}\n")

    # Save output
    if args.output:
        with open(args.output, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  {GREEN}Results saved to {args.output}{RESET}\n")

    # Exit code 1 if critical/high found (useful for CI/CD)
    critical_high = [v for v in vulns if v.get("severity") in ("CRITICAL", "HIGH")]
    sys.exit(1 if critical_high else 0)


if __name__ == "__main__":
    main()
