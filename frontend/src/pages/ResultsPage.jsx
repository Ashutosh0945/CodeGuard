import { useState, useEffect } from 'react';

// ── helpers ──────────────────────────────────────────────────────────────────
function sevRank(s) { return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 9; }
function langIcon(lang) {
  return { Python: '🐍', JavaScript: '🟨', TypeScript: '🔷', Go: '🐹', Java: '☕', Ruby: '💎', PHP: '🐘', Rust: '🦀' }[lang] ?? '📄';
}
function sevShort(s) { return s === 'critical' ? 'crit' : s === 'medium' ? 'med' : s; }

/**
 * Normalise the backend response into the shape the UI expects.
 *
 * Expected backend shape (from backend/models.py / main.py):
 * {
 *   repo_url?: string,
 *   files: {
 *     [filename]: {
 *       language: string,
 *       code: string[],          // array of source lines
 *       vulnerabilities: [
 *         { line: number, severity: string, title: string, description: string, fix: string }
 *       ]
 *     }
 *   }
 * }
 *
 * If the backend sends a different shape, tweak normalise() below.
 */
function normalise(raw) {
  if (!raw) return {};

  // Already in the right shape
  if (raw.files && typeof raw.files === 'object') {
    const out = {};
    for (const [name, data] of Object.entries(raw.files)) {
      out[name] = {
        lang: data.language || data.lang || 'Unknown',
        code: Array.isArray(data.code) ? data.code : (data.content || '').split('\n'),
        vulns: (data.vulnerabilities || data.vulns || []).map((v) => ({
          line: v.line,
          sev: (v.severity || v.sev || 'medium').toLowerCase(),
          title: v.title || v.type || 'Issue',
          desc: v.description || v.desc || '',
          fix: v.fix || v.suggestion || '',
          resolved: false,
        })),
      };
    }
    return out;
  }

  // Flat list of findings (fallback)
  if (Array.isArray(raw.vulnerabilities || raw.findings)) {
    const findings = raw.vulnerabilities || raw.findings;
    const byFile = {};
    for (const f of findings) {
      const fname = f.file || f.filename || 'unknown';
      if (!byFile[fname]) byFile[fname] = { lang: f.language || 'Unknown', code: [], vulns: [] };
      byFile[fname].vulns.push({
        line: f.line || 1,
        sev: (f.severity || 'medium').toLowerCase(),
        title: f.title || f.type || 'Issue',
        desc: f.description || '',
        fix: f.fix || f.suggestion || '',
        resolved: false,
      });
    }
    return byFile;
  }

  return {};
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ResultsPage({ results, onClose, onNewScan }) {
  const [files, setFiles] = useState(() => normalise(results));
  const [currentFile, setCurrentFile] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fileNames = Object.keys(files);

  useEffect(() => {
    if (fileNames.length && !currentFile) setCurrentFile(fileNames[0]);
  }, [fileNames]);

  // Severity pill counts
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of Object.values(files)) {
    for (const v of f.vulns) if (!v.resolved) counts[v.sev] = (counts[v.sev] || 0) + 1;
  }

  function markResolved(fname, vidx) {
    setFiles((prev) => {
      const next = { ...prev };
      next[fname] = {
        ...next[fname],
        vulns: next[fname].vulns.map((v, i) => i === vidx ? { ...v, resolved: !v.resolved } : v),
      };
      return next;
    });
  }

  const cf = currentFile && files[currentFile];
  const remaining = cf ? cf.vulns.filter((v) => !v.resolved).length : 0;

  // Vuln lookup by line for the current file
  const vulnByLine = {};
  if (cf) {
    cf.vulns.forEach((v, i) => { if (!v.resolved) vulnByLine[v.line] = { ...v, idx: i }; });
  }

  const repoLabel = results?.repo_url?.replace('https://github.com/', '') || results?.source || 'scan-results';

  return (
    <div id="resultsPage" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Title bar */}
      <div className="results-titlebar">
        <div className="rtb-left">
          <div className="rtb-logo"><div className="rtb-logo-icon">✦</div>ORION</div>
          <div className="rtb-sep" />
          <div className="rtb-breadcrumb">{repoLabel}</div>
        </div>
        <div className="rtb-right">
          <div className="sev-pills">
            {Object.entries(counts).map(([k, v]) => v > 0 && (
              <span key={k} className={`sev-pill sp-${k}`}>{v} {k[0].toUpperCase() + k.slice(1)}</span>
            ))}
          </div>
          <button className="btn-new-scan" onClick={onNewScan}>✦ New Scan</button>
          <button className="btn-back" onClick={onClose}>← Back</button>
        </div>
      </div>

      {/* Body */}
      <div className="results-body">
        {/* Sidebar */}
        <div className={`results-sidebar${sidebarCollapsed ? ' collapsed' : ''}`} id="resultsSidebar">
          <div className="rs-header">
            Explorer
            <button className="rs-toggle" onClick={() => setSidebarCollapsed(true)}>✕</button>
          </div>
          <div className="rs-tree">
            <div>
              <div className="tree-folder-label">
                <span style={{ fontSize: '.7rem', color: 'var(--muted)', width: 10 }}>▾</span>
                📁 project-root
              </div>
              <div className="tree-children">
                {fileNames.map((fname) => {
                  const fvulns = files[fname].vulns.filter((v) => !v.resolved);
                  const maxSev = fvulns.length ? fvulns.reduce((a, b) => sevRank(a.sev) < sevRank(b.sev) ? a : b).sev : null;
                  return (
                    <div
                      key={fname}
                      className={`tree-file${fname === currentFile ? ' active' : ''}`}
                      onClick={() => setCurrentFile(fname)}
                    >
                      <span>{langIcon(files[fname].lang)}</span>
                      {fname}
                      {maxSev && <span className={`tree-vuln-count tvc-${maxSev}`}>{fvulns.length}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="results-main">
          <div className="results-editor-area">
            {/* Tabs */}
            <div className="results-tabs">
              {fileNames.map((fname) => (
                <div
                  key={fname}
                  className={`rtab${fname === currentFile ? ' active' : ''}`}
                  onClick={() => setCurrentFile(fname)}
                >
                  {langIcon(files[fname].lang)} {fname}
                </div>
              ))}
            </div>

            {/* Code editor */}
            <div className="results-editor">
              {sidebarCollapsed && (
                <button className="sidebar-open-btn show" onClick={() => setSidebarCollapsed(false)}>☰</button>
              )}
              {cf && cf.code.map((line, i) => {
                const lineNum = i + 1;
                const vuln = vulnByLine[lineNum];
                const sc = vuln ? sevShort(vuln.sev) : null;
                return (
                  <div key={lineNum} id={`line_${lineNum}`} className={`code-line${sc ? ` vuln-${sc}` : ''}`}>
                    <div className={`vuln-gutter${sc ? ' ' + sc : ''}`} />
                    <div className="code-ln">{lineNum}</div>
                    <div className="code-content">
                      <span
                        className="code-editable"
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck={false}
                      >
                        {line || ' '}
                      </span>
                      {vuln && (
                        <span
                          className={`vuln-marker vm-${sc}`}
                          title={vuln.title}
                          onClick={() => {
                            document.getElementById(`fixCard_${vuln.idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          ⚠ #{vuln.idx + 1} {vuln.sev.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fixes panel */}
          <div className="results-fixes">
            <div className="fixes-header">
              <div className="fixes-title">Suggested Fixes</div>
              <div className="fixes-count">{remaining} issue{remaining !== 1 ? 's' : ''} remaining</div>
            </div>
            <div className="fixes-list">
              {cf && cf.vulns.map((v, i) => {
                const sc = sevShort(v.sev);
                return (
                  <div
                    key={i}
                    id={`fixCard_${i}`}
                    className={`fix-card fc-${sc}`}
                    onClick={() => {
                      document.getElementById(`line_${v.line}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <div className={`fix-num fn-${sc}`}>{i + 1}</div>
                    <div className="fix-title">{v.title}</div>
                    <div className="fix-line-ref">Line {v.line} · {currentFile}</div>
                    <div className="fix-desc">{v.fix || v.desc}</div>
                    <div
                      className={`fix-resolved${v.resolved ? ' show' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); markResolved(currentFile, i); }}
                    >
                      {v.resolved ? '✔ Resolved — click to undo' : '○ Mark resolved'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="results-statusbar">
        <span className="sb-item">✦ ORION AI</span>
        <span className="sb-item">{currentFile || 'No file open'}</span>
        <span className="sb-item">{cf?.lang || '–'}</span>
        <span className="sb-item">{remaining} vulnerabilit{remaining === 1 ? 'y' : 'ies'}</span>
        <span className="sb-item" style={{ marginLeft: 'auto' }}>Groq AI · 3-Layer Pipeline</span>
      </div>
    </div>
  );
}
