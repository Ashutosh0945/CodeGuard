// ── Orion API Client ─────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'https://codeguard-22e4.onrender.com';

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
  const file = files[0];
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  const langMap = {py:'python',js:'javascript',ts:'typescript',java:'java',php:'php',go:'go',rb:'ruby',cpp:'cpp',c:'c',cs:'csharp'};
  const lang = langMap[ext] || 'python';
  const data = await request('POST', '/api/scan/file', {filename: file.name, content: text, language: lang});
  const vulns = data.all_vulnerabilities || [];
  const lines = text.split('\n');
  return {
    files: {
      [file.name]: {
        language: lang,
        code: lines,
        vulnerabilities: vulns.map(v => ({
          line: v.line || 1,
          severity: (v.severity || 'medium').toLowerCase(),
          title: v.type || 'Issue',
          description: v.description || '',
          fix: v.fix || ''
        }))
      }
    }
  };
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


