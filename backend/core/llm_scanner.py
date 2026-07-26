"""
llm_scanner.py — Groq API (llama-3.3-70b-versatile)
Supports: Python, JavaScript, TypeScript, Java, PHP, Go, Ruby, C, C++, C#
"""

import json, logging, time, requests
from typing import List, Dict
from config import settings

logger = logging.getLogger(__name__)
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL    = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a senior application security engineer with expertise in multiple programming languages.
Analyze the given source code for security vulnerabilities across all common vulnerability types:
SQL Injection, XSS, Command Injection, Path Traversal, Hardcoded Secrets, Insecure Deserialization,
Weak Cryptography, CSRF, XXE, SSRF, Broken Authentication, Sensitive Data Exposure, and more.

Return ONLY a valid JSON array. Each item must have exactly these keys:
{
  "type":        string,
  "severity":    string,
  "line":        integer,
  "description": string,
  "fix":         string,
  "fix_code":    string,
  "cwe":         string
}

Severity must be one of: CRITICAL, HIGH, MEDIUM, LOW
Return [] if no vulnerabilities found.
No markdown fences, no explanation — ONLY the JSON array."""


def _chunk_code(code: str, max_chars: int = 12000) -> List[str]:
    if len(code) <= max_chars:
        return [code]
    chunks, step = [], max_chars - 500
    for i in range(0, len(code), step):
        chunks.append(code[i:i+max_chars])
    return chunks


def scan_with_llm(file_path: str, code: str, language: str = "python") -> List[Dict]:
    chunks  = _chunk_code(code)
    all_vulns, counter = [], 1
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type":  "application/json"
    }

    for chunk in chunks:
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content":
                    f"Analyze this {language} file for security vulnerabilities.\n"
                    f"File: {file_path}\n\n```{language}\n{chunk}\n```\n\n"
                    f"Return ONLY a JSON array of vulnerabilities. Nothing else."
                }
            ],
            "temperature": 0.1,
            "max_tokens":  2000,
        }
        try:
            r = requests.post(GROQ_URL, json=payload, headers=headers, timeout=60)
            r.raise_for_status()
            raw = r.json()["choices"][0]["message"]["content"].strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0]
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0]
            raw = raw.strip()
            if not raw or raw == "[]":
                continue
            vulns = json.loads(raw)
            if not isinstance(vulns, list):
                continue
            for v in vulns:
                v["id"]     = counter
                v["source"] = "LLM"
                v["file"]   = file_path
                counter    += 1
                all_vulns.append(v)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error for {file_path}: {e}")
        except Exception as e:
            logger.error(f"Groq error for {file_path}: {e}")
            raise
        if len(chunks) > 1:
            time.sleep(1)

    # Deduplicate by type+line
    seen, unique = set(), []
    for v in all_vulns:
        key = (v.get("type",""), v.get("line",0))
        if key not in seen:
            seen.add(key)
            unique.append(v)

    logger.info(f"Groq ({language}) found {len(unique)} vulns in {file_path}")
    return unique


def ask_about_vuln(question: str, vuln_type: str, cwe: str, file_path: str, description: str) -> str:
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type":  "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content":
                "You are a senior application security engineer. "
                "Answer concisely and practically with code examples where helpful."
            },
            {"role": "user", "content":
                f"Vulnerability: {vuln_type} ({cwe}) found in {file_path}\n"
                f"Description: {description}\n"
                f"Question: {question}"
            }
        ],
        "temperature": 0.2,
        "max_tokens":  800,
    }
    r = requests.post(GROQ_URL, json=payload, headers=headers, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]
