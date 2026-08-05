// ── Orion API Client ─────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'https://codeguard-production-c6ce.up.railway.app';

async function request(method, path, body = null, isFormData = false) {
  const opts = {
    method,
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function scanRepo(repoUrl) {
  return request('POST', '/api/scan/repo', { repo_url: repoUrl, max_files: 15 });
}

export async function scanFile(filename, content, language = 'python') {
  return request('POST', '/api/scan/file', { filename, content, language });
}

export async function scanUpload(files) {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return request('POST', '/api/scan/upload', form, true);
}

export async function askAboutVuln(question, context = '') {
  return request('POST', '/api/ask', { question, context });
}

export async function getBenchmark() {
  return request('GET', '/api/benchmark');
}

export async function getHealth() {
  return request('GET', '/api/health');
}
