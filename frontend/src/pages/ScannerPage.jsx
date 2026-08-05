import { useState, useRef } from 'react';
import { scanRepo, scanUpload } from '../api/client';

const LOADING_STEPS = [
  'Running Bandit (Layer 1)…',
  'Parsing AST for patterns…',
  'Running Semgrep (Layer 2)…',
  'Matching cross-file rules…',
  'Sending context to LLM (Layer 3)…',
  'Reasoning over findings…',
  'Deduplicating & ranking results…',
  'Generating fix suggestions…',
];

export default function ScannerPage({ onNavigate, onResults }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [language, setLanguage] = useState('en');
  const [depth, setDepth] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initialising');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  function addFiles(newFiles) {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...Array.from(newFiles).filter((f) => !names.has(f.name))];
    });
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function startScan() {
    if (!repoUrl && !files.length) {
      setError('Please enter a GitHub URL or upload files.');
      return;
    }
    setError('');
    setLoading(true);

    // Animate steps while waiting
    let step = 0;
    const iv = setInterval(() => {
      setLoadingStep(LOADING_STEPS[step % LOADING_STEPS.length]);
      step++;
    }, 600);

    try {
      let results;
      if (repoUrl) {
        results = await scanRepo(repoUrl, language, depth);
      } else {
        results = await scanUpload(files, language, depth);
      }
      clearInterval(iv);
      setLoading(false);
      onResults(results);
    } catch (err) {
      clearInterval(iv);
      setLoading(false);
      setError(err.message || 'Scan failed. Is the backend running?');
    }
  }

  return (
    <div className="page active" id="scannerPage">
      {/* ── Hero ── */}
      <div className="scanner-layout">
        <div className="scanner-left">
          <span className="eyebrow">✦ AI-Powered Code Security</span>
          <h1>
            Find vulnerabilities<br />
            before attackers<br />
            <span className="grad-text">find your users.</span>
          </h1>
          <p className="hero-subtitle">
            ORION combines Bandit, Semgrep, and a large language model into a
            single scan. Static tools catch the obvious. The LLM catches
            everything else — logic flaws, context-aware injection, secrets
            hiding in plain sight.
          </p>
          <div className="hero-badges">
            <span className="hero-badge">⚡ Bandit + Semgrep + LLM</span>
            <span className="hero-badge">🌐 15+ output languages</span>
            <span className="hero-badge">∞ Any file type</span>
          </div>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => document.getElementById('repoUrl')?.focus()}
            >
              <span>⊙ Scan a Repository</span>
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('howitworks')}>
              ▷ See How It Works
            </button>
          </div>
          <div className="hero-stats">
            {[
              { num: '3-layer', label: 'Detection Engine' },
              { num: '50+', label: 'Vuln Types' },
              { num: '91%', label: 'F1 Accuracy' },
              { num: 'Any', label: 'Language' },
            ].map((s) => (
              <div className="hstat" key={s.label}>
                <div className="hstat-num">{s.num}</div>
                <div className="hstat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3-D Cube ── */}
        <div className="scanner-right">
          <div className="cube-scene">
            <div className="cube-bg-glow" />
            <div className="scan-ring"><div className="scan-light" /></div>
            <div className="cube-wrapper">
              <div className="cube-3d">
                <div className="face face-front">
                  <div className="face-inner">
                    <div className="fnode">📁 /src</div>
                    <div className="fnode">🔐 auth.js</div>
                    <div className="fnode">🗄 db.py</div>
                  </div>
                </div>
                <div className="face face-back">
                  <div className="face-inner">
                    <div className="fnode">🌿 main</div>
                    <div className="fnode">🌿 dev</div>
                    <div className="fnode">📦 v2.1</div>
                  </div>
                </div>
                <div className="face face-left">
                  <div className="face-inner">
                    <div className="fnode">💾 commits</div>
                    <div className="fnode">🔄 42 total</div>
                  </div>
                </div>
                <div className="face face-right">
                  <div className="face-inner">
                    <div className="fnode">⚠️ vuln?</div>
                    <div className="fnode">🔍 scanning</div>
                  </div>
                </div>
                <div className="face face-top" />
                <div className="face face-bottom" />
              </div>
            </div>
            <div className="float-card float-card-1">
              <div className="fc-label">Language split</div>
              {[
                { color: '#6366f1', lang: 'Python', pct: '58%' },
                { color: '#38bdf8', lang: 'TypeScript', pct: '24%' },
                { color: '#f59e0b', lang: 'JavaScript', pct: '10%' },
                { color: '#38bdf8', lang: 'Go', pct: '6%' },
                { color: '#94a3b8', lang: 'Other', pct: '2%' },
              ].map((l) => (
                <div key={l.lang} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', marginTop: 2 }}>
                  <span className="lang-dot" style={{ background: l.color }} />
                  {l.lang}
                  <span style={{ marginLeft: 'auto', color: l.color, fontWeight: 600 }}>{l.pct}</span>
                </div>
              ))}
            </div>
            <div className="float-card float-card-2"><div className="fc-label">Commits</div><div className="fc-value">42 total</div></div>
            <div className="float-card float-card-3"><div className="fc-label">Last scan</div><div className="fc-value" style={{ color: 'var(--mint)' }}>✔ Clean</div></div>
            <div className="float-card float-card-4"><div className="fc-label">Files scanned</div><div className="fc-value">186</div></div>
          </div>
        </div>
      </div>

      {/* ── Scan Form ── */}
      <div className="scan-section">
        {!loading ? (
          <div className="glass-card">
            <p className="input-label">// GitHub Repository</p>
            <input
              id="repoUrl"
              className="url-input"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="or-divider">or upload files directly from your PC</div>
            <div
              className={`drop-zone${dragOver ? ' drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => addFiles(e.target.files)}
              />
              <span className="drop-icon">☁</span>
              <p className="drop-title">Upload files from your PC</p>
              <p className="drop-sub">Drag and drop or click to browse</p>
            </div>
            {files.length > 0 && (
              <div className="file-chips">
                {files.map((f) => (
                  <div className="file-chip" key={f.name}>
                    📄 {f.name}
                    <span className="chip-rm" onClick={() => removeFile(f.name)}>✕</span>
                  </div>
                ))}
              </div>
            )}
            <div className="options-row">
              <div className="select-wrap">
                <label htmlFor="langSelect">Output Language</label>
                <select id="langSelect" className="glass-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="zh">🇨🇳 中文</option>
                  <option value="ja">🇯🇵 日本語</option>
                  <option value="ar">🇸🇦 العربية</option>
                  <option value="pt">🇧🇷 Português</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="ko">🇰🇷 한국어</option>
                </select>
              </div>
              <div className="select-wrap">
                <label htmlFor="depthSelect">Scan Depth</label>
                <select id="depthSelect" className="glass-select" value={depth} onChange={(e) => setDepth(e.target.value)}>
                  <option value="quick">⚡ Quick</option>
                  <option value="standard">🔍 Standard</option>
                  <option value="deep">🔬 Deep — All Files</option>
                </select>
              </div>
            </div>
            {error && (
              <p style={{ color: 'var(--rose)', fontSize: '.82rem', marginTop: 10, fontFamily: "'JetBrains Mono',monospace" }}>
                ⚠ {error}
              </p>
            )}
            <button className="btn-scan" onClick={startScan}>
              <span>✦ Scan for Vulnerabilities</span>
            </button>
          </div>
        ) : (
          <div className="loading-overlay visible">
            <div className="scanner-anim">
              <div className="sr1" />
              <div className="sr2" />
            </div>
            <p className="loading-text">Running your 3-layer scan…</p>
            <p className="loading-step">{loadingStep}</p>
          </div>
        )}
      </div>
    </div>
  );
}
