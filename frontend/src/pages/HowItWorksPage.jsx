import { useState } from 'react';

const STATS = [
  { num: '3', label: 'Detection Layers', sub: 'Bandit · Semgrep · LLM' },
  { num: '50+', label: 'Vulnerability Types', sub: 'Across all layers combined' },
  { num: '91%', label: 'F1 Accuracy', sub: 'vs 70% for static tools alone' },
  { num: '+21%', label: 'More Vulns Caught', sub: 'LLM layer over static-only' },
];

const PIPELINE = [
  {
    num: '01', cls: 'pipe-n1', title: 'Static AST Analysis', tool: 'Bandit',
    desc: 'Bandit parses your code into an Abstract Syntax Tree and checks every node against a library of known-bad patterns. Fast, deterministic, zero false negatives on common issues.',
    tags: [['ct-blue', 'SQL Injection'], ['ct-blue', 'Hardcoded Passwords'], ['ct-blue', 'Weak Crypto'], ['ct-blue', 'Shell Injection']],
  },
  {
    num: '02', cls: 'pipe-n2', title: 'Pattern & Rule Matching', tool: 'Semgrep',
    desc: 'Semgrep runs a library of community and custom rules across all files, catching cross-file data flows, API misuse, and language-specific pitfalls Bandit can\'t see.',
    tags: [['ct-amber', 'XSS'], ['ct-amber', 'CSRF'], ['ct-amber', 'Open Redirect'], ['ct-amber', 'Path Traversal']],
  },
  {
    num: '03', cls: 'pipe-n3', title: 'LLM Semantic Reasoning', tool: 'Groq AI',
    desc: 'The LLM receives the full file context + both tools\' output. It reasons about business logic, intent, and data flow — catching what pattern-matching fundamentally cannot.',
    tags: [['ct-indigo', 'Logic Flaws'], ['ct-indigo', 'Auth Bypass'], ['ct-indigo', 'Race Conditions'], ['ct-indigo', 'Context Injection']],
  },
  {
    num: '04', cls: 'pipe-n4', title: 'Unified Report + Fixes', tool: 'ORION Output',
    desc: 'All findings are deduplicated, ranked by severity, and enriched with plain-language explanations and specific fix suggestions. Output in your chosen language.',
    tags: [['ct-green', 'Severity Ranking'], ['ct-green', 'Fix Suggestions'], ['ct-green', '15+ Languages']],
  },
];

const LAYERS = [
  {
    icon: '🔵', title: 'Bandit', role: 'Layer 1 — AST scanner for Python',
    desc: 'An open-source tool by PyCQA that walks your Python AST and flags dangerous function calls, insecure imports, and known-bad patterns.',
    catches: ['Hardcoded passwords and API keys', 'Use of MD5, SHA1, DES encryption', 'SQL built from string concatenation', 'subprocess with shell=True', 'Use of assert for security checks'],
  },
  {
    icon: '🟡', title: 'Semgrep', role: 'Layer 2 — Multi-language rule engine',
    desc: 'Semgrep uses a declarative rule syntax to match code patterns across any language. It understands data flow across functions and files.',
    catches: ['Unescaped user input in HTML/templates', 'Missing CSRF tokens on state-changing routes', 'JWT verified with None algorithm', 'TLS certificate validation disabled', 'Prototype pollution in JavaScript'],
  },
  {
    icon: '🟣', title: 'LLM (Groq AI)', role: 'Layer 3 — Semantic reasoning engine',
    desc: 'The LLM reads the actual code the way a senior security engineer would — understanding what the code is trying to do, not just what tokens it contains.',
    catches: ['Business logic vulnerabilities', 'Insecure direct object references (IDOR)', 'Broken access control chains', 'Timing attacks in auth comparisons', 'Mass assignment and over-posting'],
  },
];

const VULNS = [
  { name: 'SQL Injection', pct: 34, color: 'linear-gradient(90deg,#f43f5e,#fb7185)', textColor: '#e11d48', src: 'Bandit + LLM' },
  { name: 'Hardcoded Secrets', pct: 28, color: 'linear-gradient(90deg,#f59e0b,#fbbf24)', textColor: '#b45309', src: 'Bandit' },
  { name: 'XSS (Cross-Site Scripting)', pct: 19, color: 'linear-gradient(90deg,var(--indigo),var(--violet))', textColor: 'var(--indigo)', src: 'Semgrep + LLM' },
  { name: 'Broken Access Control', pct: 11, color: 'linear-gradient(90deg,#7c3aed,#a78bfa)', textColor: '#7c3aed', src: 'LLM only' },
  { name: 'Insecure Cryptography', pct: 5, color: 'linear-gradient(90deg,#10b981,#34d399)', textColor: '#047857', src: 'Bandit + Semgrep' },
  { name: 'Business Logic Flaws', pct: 3, color: 'linear-gradient(90deg,#9333ea,#c084fc)', textColor: '#9333ea', src: 'LLM only' },
];

export default function HowItWorksPage({ onNavigate }) {
  const [videoClicked, setVideoClicked] = useState(false);

  return (
    <div className="page active" id="howitworksPage">
      <div className="hiw-page">
        <div className="hiw-hero">
          <span className="eyebrow" style={{ margin: '0 auto 16px' }}>// Methodology · How ORION Works</span>
          <h2>Three tools. One scan.<br /><em>Zero blind spots.</em></h2>
          <p>ORION doesn't replace Bandit or Semgrep — it uses them as the first two layers of a pipeline, then sends their combined output to an LLM that reasons over the results, catches what they missed, and explains every finding in plain language.</p>
        </div>

        <div className="section-label">// By the numbers</div>
        <div className="stats-strip">
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-card-num">{s.num}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="pipeline-section">
          <div className="section-label">// The scan pipeline</div>
          <div className="pipeline">
            {PIPELINE.map((step, i) => (
              <>
                <div className="pipe-step" key={step.num}>
                  <div className={`pipe-num ${step.cls}`}>{step.num}</div>
                  <div className="pipe-title">{step.title}</div>
                  <div className="pipe-tool">{step.tool}</div>
                  <div className="pipe-desc">{step.desc}</div>
                  <div className="pipe-catches">
                    {step.tags.map(([cls, label]) => (
                      <span key={label} className={`catch-tag ${cls}`}>{label}</span>
                    ))}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && <div className="pipe-arrow" key={`arr-${i}`}>→</div>}
              </>
            ))}
          </div>
        </div>

        <div className="section-label">// What each layer contributes</div>
        <div className="layers-grid" style={{ marginBottom: 72 }}>
          {LAYERS.map((l) => (
            <div className="layer-card" key={l.title}>
              <div className="layer-icon">{l.icon}</div>
              <div className="layer-title">{l.title}</div>
              <div className="layer-role">{l.role}</div>
              <div className="layer-desc">{l.desc}</div>
              <div className="layer-catches">
                <div className="layer-catch-title">Catches</div>
                {l.catches.map((c) => (
                  <div className="layer-catch-item" key={c}>{c}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Video section */}
        <div className="video-section">
          <div className="section-label">// See it in action</div>
          <div className="video-wrap">
            <div className="video-header">
              <div className="video-header-left">
                <div className="video-dots">
                  <div className="vdot vd1" /><div className="vdot vd2" /><div className="vdot vd3" />
                </div>
                ORION Scanner — Demo Walkthrough
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '.7rem', color: 'var(--muted)' }}>3:42</span>
            </div>
            <div className="video-player" onClick={() => setVideoClicked(true)}>
              <div className="video-mockup">
                <div className="vm-topbar">
                  <span style={{ fontSize: '.75rem' }}>🔗</span>
                  <span className="vm-url">https://github.com/demo/vulnerable-app</span>
                  <span style={{ fontSize: '.65rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.3)', color: '#c4b5fd', fontFamily: "'JetBrains Mono',monospace" }}>Scanning</span>
                </div>
                <div className="vm-code-block">
                  <span className="vc-muted">// db.py — Layer 1 (Bandit) flagged:</span>
                  <span className="vc-red">query = "SELECT * FROM users WHERE id=" + user_id  ⚠ CRITICAL</span>
                  <span className="vc-muted">// Layer 2 (Semgrep) flagged:</span>
                  <span className="vc-red">return HttpResponse("&lt;h1&gt;Hello " + name + "&lt;/h1&gt;")  ⚠ MEDIUM</span>
                  <span className="vc-muted">// Layer 3 (LLM) additionally found:</span>
                  <span className="vc-yellow">→ Auth check on line 34 bypassable via role=admin param</span>
                  <span className="vc-green">✔ Fix generated for all 3 issues</span>
                </div>
                <div className="vm-scanning">
                  <span>Layer 2/3 — Semgrep</span>
                  <div className="vm-scan-bar"><div className="vm-scan-fill" /></div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>72%</span>
                </div>
              </div>
              {!videoClicked ? (
                <div className="play-overlay">
                  <div className="play-btn">▶</div>
                </div>
              ) : (
                <div className="play-overlay">
                  <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '.85rem', color: 'rgba(255,255,255,0.7)', padding: 20, textAlign: 'center' }}>
                    📽 In a production build, your demo video would play here.<br /><br />
                    <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.4)' }}>Drop an MP4/YouTube embed into video-player to activate.</span>
                  </div>
                </div>
              )}
            </div>
            <div className="video-caption">
              <p><strong>What you'll see:</strong> Paste a GitHub repo URL → watch Bandit and Semgrep run in real time → see the LLM layer reason over findings → get a ranked report with one-click fix suggestions. Total time for a medium repo: under 30 seconds.</p>
            </div>
          </div>
        </div>

        <div className="section-label">// Most common vulnerabilities found</div>
        <div className="vuln-breakdown">
          {VULNS.map((v) => (
            <div className="vuln-type-card" key={v.name}>
              <div className="vt-bar-wrap">
                <div className="vt-top">
                  <span className="vt-name">{v.name}</span>
                  <span className="vt-pct" style={{ color: v.textColor }}>{v.pct}%</span>
                </div>
                <div className="vt-bar">
                  <div className="vt-fill" style={{ width: `${v.pct}%`, background: v.color }} />
                </div>
                <div className="vt-source">Caught by: {v.src}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '48px 0 0' }}>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 18 }}>Ready to run the 3-layer scan on your own code?</p>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={() => onNavigate('scanner')}>
            <span>✦ Start Scanning for Free</span>
          </button>
        </div>
      </div>
    </div>
  );
}
