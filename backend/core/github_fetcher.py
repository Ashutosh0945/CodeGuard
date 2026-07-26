"""
github_fetcher.py
Fetches source code files from a GitHub repository using the GitHub REST API.
"""

import base64
import re
import time
import logging
from typing import List, Dict, Optional
import httpx
from config import settings

logger = logging.getLogger(__name__)

SCANNABLE_EXTENSIONS = {
    ".py":   "python",
    ".js":   "javascript",
    ".ts":   "typescript",
    ".java": "java",
    ".php":  "php",
    ".go":   "go",
    ".rb":   "ruby",
    ".cpp":  "cpp",
    ".c":    "c",
    ".cs":   "csharp",
}

# Files/dirs we always skip
SKIP_PATTERNS = [
    r"node_modules/", r"\.git/", r"dist/", r"build/",
    r"\.min\.js$", r"vendor/", r"__pycache__/",
    r"\.test\.", r"_test\.", r"test_", r"spec\."
]


def _parse_repo(repo_url: str):
    """Extract owner and repo name from a GitHub URL."""
    repo_url = repo_url.rstrip("/")
    # Handle both https://github.com/owner/repo and owner/repo shorthand
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if match:
        return match.group(1), match.group(2).replace(".git", "")
    parts = repo_url.split("/")
    if len(parts) == 2:
        return parts[0], parts[1]
    raise ValueError(f"Cannot parse GitHub URL: {repo_url}")


def _should_skip(path: str) -> bool:
    return any(re.search(p, path) for p in SKIP_PATTERNS)


def _get_headers() -> dict:
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def fetch_repo_files(
    repo_url: str,
    branch: str = "main",
    max_files: int = 20,
    extensions: Optional[List[str]] = None
) -> List[Dict]:
    """
    Returns a list of dicts:
        { "path": str, "content": str, "language": str, "size": int }
    """
    if extensions is None:
        extensions = list(SCANNABLE_EXTENSIONS.keys())

    owner, repo = _parse_repo(repo_url)
    headers = _get_headers()

    # Try requested branch, fall back to 'master'
    for br in [branch, "master", "main"]:
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{br}?recursive=1"
        resp = httpx.get(tree_url, headers=headers, timeout=20)
        if resp.status_code == 200:
            branch = br
            break
    else:
        raise RuntimeError(f"Could not fetch repo tree for {owner}/{repo}. Check the URL and token.")

    tree = resp.json().get("tree", [])
    logger.info(f"Repo tree: {len(tree)} entries for {owner}/{repo}@{branch}")

    candidates = [
        item for item in tree
        if item.get("type") == "blob"
        and any(item["path"].endswith(ext) for ext in extensions)
        and not _should_skip(item["path"])
        and item.get("size", 0) < 200_000   # skip huge files
    ]

    # Sort: smaller files first (faster, less token usage)
    candidates.sort(key=lambda x: x.get("size", 0))
    candidates = candidates[:max_files]

    logger.info(f"Fetching {len(candidates)} files…")
    files = []
    for item in candidates:
        try:
            blob_resp = httpx.get(item["url"], headers=headers, timeout=15)
            blob = blob_resp.json()
            raw = blob.get("content", "")
            # GitHub returns base64 with newlines
            content = base64.b64decode(raw.replace("\n", "")).decode("utf-8", errors="ignore")
            ext = "." + item["path"].rsplit(".", 1)[-1]
            files.append({
                "path":     item["path"],
                "content":  content,
                "language": SCANNABLE_EXTENSIONS.get(ext, "unknown"),
                "size":     item.get("size", 0),
            })
            time.sleep(0.05)   # gentle rate-limit
        except Exception as e:
            logger.warning(f"Could not fetch {item['path']}: {e}")

    logger.info(f"Successfully fetched {len(files)} files.")
    return files


def get_repo_info(repo_url: str) -> dict:
    """Return basic metadata about the repo."""
    owner, repo = _parse_repo(repo_url)
    url = f"https://api.github.com/repos/{owner}/{repo}"
    resp = httpx.get(url, headers=_get_headers(), timeout=15)
    if resp.status_code != 200:
        return {"owner": owner, "repo": repo}
    d = resp.json()
    return {
        "owner":       owner,
        "repo":        repo,
        "description": d.get("description"),
        "language":    d.get("language"),
        "stars":       d.get("stargazers_count"),
        "forks":       d.get("forks_count"),
        "url":         d.get("html_url"),
    }
