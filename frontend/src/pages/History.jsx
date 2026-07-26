// src/pages/History.jsx
import { useEffect, useState } from 'react'
import { SeverityBadge } from '../components/ui'

const STORAGE_KEY = 'codeguard_history'

export function saveToHistory(scanData) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const entry = {
      id:         Date.now(),
      timestamp:  new Date().toISOString(),
      target:     scanData.repo_url || scanData.filename || 'Upload',
      files:      scanData.files_scanned,
      total:      scanData.summary?.total || 0,
      critical:   scanData.summary?.critical || 0,
      high:       scanData.summary?.high || 0,
      medium:     scanData.summary?.medium || 0,
      low:        scanData.summary?.low || 0,
      duration:   scanData.scan_duration_seconds,
    }
    existing.unshift(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 20)))
  } catch {}
}

export default function History() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { setHistory([]) }
  }, [])

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-lg font-semibold mb-2" style={{ color: '#cdd9e5' }}>No scan history yet</div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          Run a scan from the Scanner tab and your results will appear here.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">📋 Scan History</h1>
        <button
          onClick={clear}
          className="text-xs px-4 py-2 rounded-lg transition-all"
          style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444' }}
        >
          Clear History
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {history.map((h) => (
          <div
            key={h.id}
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
              <div>
                <div className="font-mono text-sm font-semibold mb-1" style={{ color: '#cdd9e5' }}>
                  {h.target}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(h.timestamp).toLocaleString()} · {h.files} files · {h.duration}s
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {h.total} findings
                </span>
                {h.critical > 0 && <SeverityBadge severity="CRITICAL" />}
                {h.high > 0     && <SeverityBadge severity="HIGH"     />}
                {h.medium > 0   && <SeverityBadge severity="MEDIUM"   />}
                {h.low > 0      && <SeverityBadge severity="LOW"      />}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l:'Critical', v:h.critical, c:'#ef4444' },
                { l:'High',     v:h.high,     c:'#f97316' },
                { l:'Medium',   v:h.medium,   c:'#f59e0b' },
                { l:'Low',      v:h.low,      c:'#10b981' },
              ].map((s) => (
                <div
                  key={s.l}
                  className="text-center p-2 rounded-lg"
                  style={{ background: 'var(--bg)' }}
                >
                  <div className="font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
