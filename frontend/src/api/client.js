import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://codeguard-hch8.onrender.com'

const http = axios.create({ baseURL: BASE, timeout: 180000, headers: { 'Content-Type': 'application/json' } })

http.interceptors.response.use(res => res, err => {
  const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Unknown error'
  return Promise.reject(new Error(msg))
})

export const scanRepo = (repoUrl, branch='main', maxFiles=20) =>
  http.post('/api/scan/repo', { repo_url: repoUrl, branch, max_files: maxFiles }).then(r => r.data)

export const scanFile = (filename, content, language='python') =>
  http.post('/api/scan/file', { filename, content, language }).then(r => r.data)

export const scanUpload = async (files) => {
  const file = files[0]
  const content = await file.text()
  const ext = file.name.split('.').pop().toLowerCase()
  const langMap = {py:'python',js:'javascript',ts:'typescript',java:'java',php:'php',go:'go',rb:'ruby',cpp:'cpp',c:'c',cs:'csharp'}
  return http.post('/api/scan/file', { filename: file.name, content, language: langMap[ext]||'python' }).then(r => r.data)
}

export const askAI = (question, vuln) =>
  http.post('/api/ask', { question, vuln_type: vuln.type, cwe: vuln.cwe||'CWE-unknown', file_path: vuln.file, description: vuln.description }).then(r => r.data)

export const getBenchmark = (useLlm=false) =>
  http.get('/api/benchmark', { params: { use_llm: useLlm } }).then(r => r.data)

export const getRepoInfo = (url) =>
  http.get('/api/repo-info', { params: { url } }).then(r => r.data)

export const healthCheck = () =>
  http.get('/api/health').then(r => r.data)
