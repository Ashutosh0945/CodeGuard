// Orion API Client — routes through Vercel proxy to avoid CORS
async function request(method, path, body = null) {
  const proxyUrl = `/api/proxy?path=${encodeURIComponent(path)}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(proxyUrl, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

function transformVuln(v) {
  return {
    line: v.line || 1,
    severity: (v.severity || 'medium').toLowerCase(),
    title: v.type || v.title || 'Issue',
    description: v.description || v.desc || '',
    fix: v.fix
      ? (v.fix_code ? `${v.fix}\n\n${v.fix_code}` : v.fix)
      : (v.description || 'Review and remediate this vulnerability.'),
  };
}

function transformScanResponse(data, filename, content) {
  const vulns = data.all_vulnerabilities || [];
  const lines = (content || '').split('\n');
  const lang = data.results?.[0]?.language || 'python';
  return {
    files: {
      [filename]: {
        language: lang,
        code: lines,
        vulnerabilities: vulns.map(transformVuln),
      }
    }
  };
}

export async function scanRepo(repoUrl) {
  const data = await request('POST', '/api/scan/repo', { repo_url: repoUrl, max_files: 15 });
  const result = { files: {} };
  for (const fileResult of (data.results || [])) {
    const vulns = fileResult.all_vulns || [];
    result.files[fileResult.file] = {
      language: fileResult.language || 'unknown',
      code: [],
      vulnerabilities: vulns.map(transformVuln),
    };
  }
  return result;
}

export async function scanFile(filename, content, language = 'python') {
  const data = await request('POST', '/api/scan/file', { filename, content, language });
  return transformScanResponse(data, filename, content);
}

export async function scanUpload(files) {
  const file = Array.isArray(files) ? files[0] : files;
  const text = await file.text();
  const ext = file.name.split('.').pop().toLowerCase();
  const langMap = {
    py: 'python', js: 'javascript', ts: 'typescript', java: 'java',
    php: 'php', go: 'go', rb: 'ruby', cpp: 'cpp', c: 'c', cs: 'csharp'
  };
  const lang = langMap[ext] || 'python';
  const data = await request('POST', '/api/scan/file', {
    filename: file.name,
    content: text,
    language: lang
  });
  return transformScanResponse(data, file.name, text);
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
