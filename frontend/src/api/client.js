/**
 * api/client.js
 * All backend API calls. Uses Vite proxy in dev (/api → localhost:8000).
 * In production, set VITE_API_URL in .env to your Render/Railway backend URL.
 */

import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://codeguard-hch8.onrender.com'

const http = axios.create({
  baseURL: BASE,
  timeout: 180_000,   // 3 min — LLM scans can be slow
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptors ───────────────────────────────────────────
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

// ── API calls ──────────────────────────────────────────────

/** Scan a GitHub repository */
export const scanRepo = (repoUrl, branch = 'main', maxFiles = 20) =>
  http.post('/api/scan/repo', { repo_url: repoUrl, branch, max_files: maxFiles })
    .then((r) => r.data)

/** Scan a single file passed as text */
export const scanFile = (filename, content, language = 'python') =>
  http.post('/api/scan/file', { filename, content, language })
    .then((r) => r.data)

/** Upload file(s) as multipart/form-data */
export const scanUpload = (files) => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  return http.post('/api/scan/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

/** Ask Groq a question about a specific vulnerability */
export const askAI = (question, vuln) =>
  http.post('/api/ask', {
    question,
    vuln_type:   vuln.type,
    cwe:         vuln.cwe || 'CWE-unknown',
    file_path:   vuln.file,
    description: vuln.description,
  }).then((r) => r.data)

/** Get benchmark results (LLM vs Bandit vs Semgrep) */
export const getBenchmark = (useLlm = false) =>
  http.get('/api/benchmark', { params: { use_llm: useLlm } })
    .then((r) => r.data)

/** Get repo metadata */
export const getRepoInfo = (url) =>
  http.get('/api/repo-info', { params: { url } })
    .then((r) => r.data)

/** Health check */
export const healthCheck = () =>
  http.get('/api/health').then((r) => r.data)

