// src/components/ui.jsx

export const SEV_COLOR = {
  CRITICAL: { bg:'#ef444418', border:'#ef444455', text:'#ef4444', glow:'#ef444433' },
  HIGH:     { bg:'#f9731618', border:'#f9731655', text:'#f97316', glow:'#f9731633' },
  MEDIUM:   { bg:'#f59e0b18', border:'#f59e0b55', text:'#f59e0b', glow:'#f59e0b33' },
  LOW:      { bg:'#10b98118', border:'#10b98155', text:'#10b981', glow:'#10b98133' },
}

export const SOURCE_CONFIG = {
  LLM:     { label:'🤖 Groq AI', bg:'#7c3aed18', border:'#7c3aed55', color:'#a78bfa' },
  Bandit:  { label:'🔷 Bandit',  bg:'#0ea5e918', border:'#0ea5e955', color:'#38bdf8' },
  Semgrep: { label:'🔶 Semgrep', bg:'#f9731618', border:'#f9731655', color:'#fb923c' },
}

export function SeverityBadge({ severity }) {
  const c = SEV_COLOR[severity] || SEV_COLOR.LOW
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md"
      style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.text, boxShadow:`0 0 8px ${c.glow}` }}>
      {severity}
    </span>
  )
}

export function SourceTag({ source }) {
  const s = SOURCE_CONFIG[source] || SOURCE_CONFIG.LLM
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
      style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color }}>
      {s.label}
    </span>
  )
}

export function Card({ children, className='', onClick, selected }) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl p-5 transition-all duration-200 ${onClick?'cursor-pointer':''} ${selected?'card-selected':'card-hover'} ${className}`}
      style={{ background:'var(--surface)' }}>
      {children}
    </div>
  )
}

export function StatBox({ value, label, color, icon }) {
  return (
    <div className="rounded-2xl p-4 text-center transition-all hover:scale-105 hover:-translate-y-0.5"
      style={{
        background:'var(--surface)',
        border:'1px solid var(--border)',
        boxShadow:`0 4px 16px ${color}18`,
      }}>
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className="text-2xl font-bold font-mono" style={{ color, textShadow:`0 0 12px ${color}66` }}>
        {value}
      </div>
      <div className="text-xs mt-1 font-semibold tracking-widest" style={{ color:'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}

export function Spinner({ size=36 }) {
  return (
    <div className="spinner" style={{ width:size, height:size }} />
  )
}

export function SectionLabel({ children }) {
  return (
    <div className="text-xs font-bold tracking-widest mb-3 flex items-center gap-2"
      style={{ color:'var(--muted)' }}>
      <div className="h-px flex-1" style={{ background:'var(--border)' }} />
      {children}
      <div className="h-px flex-1" style={{ background:'var(--border)' }} />
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, className='' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn-glow px-5 py-3 rounded-xl font-bold text-sm text-black transition-all
        ${disabled?'opacity-40 cursor-not-allowed':'cursor-pointer'} ${className}`}>
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center fade-in">
      <div className="text-6xl mb-5" style={{ filter:'drop-shadow(0 0 16px #00d4ff44)' }}>{icon}</div>
      <div className="text-xl font-bold mb-2" style={{ color:'var(--text)' }}>{title}</div>
      <div className="text-sm leading-relaxed max-w-sm" style={{ color:'var(--muted)' }}>
        {sub?.split('\n').map((l,i)=><div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

export function GlowCard({ children, color='var(--accent)', className='' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{
        background:'var(--surface)',
        border:`1px solid ${color}44`,
        boxShadow:`0 4px 24px ${color}18`,
      }}>
      {children}
    </div>
  )
}
