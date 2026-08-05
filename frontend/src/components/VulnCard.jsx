// src/components/VulnCard.jsx
import { SeverityBadge, SourceTag, SEV_COLOR } from './ui'

export default function VulnCard({ vuln, selected, onClick }) {
  const c = SEV_COLOR[vuln.severity] || SEV_COLOR.LOW

  return (
    <div onClick={onClick}
      className={`rounded-2xl p-4 cursor-pointer transition-all duration-200 fade-in ${selected?'card-selected':'card-hover'}`}
      style={{ background:'var(--surface)' }}>

      {/* Left accent bar */}
      <div className="flex gap-3">
        <div className="w-1 rounded-full flex-shrink-0"
          style={{ background:c.text, boxShadow:`0 0 8px ${c.glow}` }} />

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SeverityBadge severity={vuln.severity} />
            <span className="font-bold text-sm flex-1 truncate" style={{ color:'var(--text)' }}>
              {vuln.type}
            </span>
            <SourceTag source={vuln.source} />
          </div>

          {/* File */}
          <div className="font-mono text-xs mb-2 truncate flex items-center gap-1"
            style={{ color:'var(--accent)' }}>
            📄 {vuln.file}
          </div>

          {/* Description */}
          <div className="text-xs leading-relaxed" style={{ color:'var(--muted)' }}>
            {vuln.description?.slice(0,110)}{vuln.description?.length>110?'…':''}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background:'var(--surface2)', color:'var(--muted)', border:'1px solid var(--border)' }}>
              Line ~{vuln.line||'?'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background:'var(--accent2)18', color:'#a78bfa', border:'1px solid #7c3aed44' }}>
              {vuln.cwe||'CWE-?'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
