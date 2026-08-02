import { SeverityBadge, SourceTag, SEV_COLOR } from './ui'

export default function VulnCard({ vuln, selected, onClick }) {
  const c = SEV_COLOR[vuln.severity] || SEV_COLOR.LOW
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 fade-in ${selected ? 'card-selected' : 'card-hover'}`}
      style={{ background: 'var(--surface)' }}>
      <div className="flex gap-3">
        <div className="w-1 rounded-full flex-shrink-0 transition-all"
          style={{ background: c.text, boxShadow: `0 0 12px ${c.glow}` }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SeverityBadge severity={vuln.severity} />
            <span className="font-bold text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{vuln.type}</span>
            <SourceTag source={vuln.source} />
          </div>
          <div className="font-mono text-xs mb-1 truncate" style={{ color: 'var(--accent)' }}>📄 {vuln.file}</div>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            {vuln.description?.slice(0, 100)}{vuln.description?.length > 100 ? '…' : ''}
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-lg font-mono"
              style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              Line ~{vuln.line || '?'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-lg font-mono"
              style={{ background: '#8b5cf615', color: '#a78bfa', border: '1px solid #8b5cf633' }}>
              {vuln.cwe || 'CWE-?'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
