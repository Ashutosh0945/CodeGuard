export const SEV_COLOR = {
  CRITICAL: { bg:'#ff475718', border:'#ff475755', text:'#ff4757', glow:'#ff475733' },
  HIGH:     { bg:'#ff6b3518', border:'#ff6b3555', text:'#ff6b35', glow:'#ff6b3533' },
  MEDIUM:   { bg:'#ffd32a18', border:'#ffd32a55', text:'#ffd32a', glow:'#ffd32a33' },
  LOW:      { bg:'#06d6a018', border:'#06d6a055', text:'#06d6a0', glow:'#06d6a033' },
}

export const SOURCE_CONFIG = {
  LLM:     { label: '🤖 Groq AI', bg: '#8b5cf618', border: '#8b5cf655', color: '#a78bfa' },
  Bandit:  { label: '🔷 Bandit',  bg: '#0ea5e918', border: '#0ea5e955', color: '#38bdf8' },
  Semgrep: { label: '🔶 Semgrep', bg: '#ff6b3518', border: '#ff6b3555', color: '#fb923c' },
}

export function SeverityBadge({ severity }) {
  const c = SEV_COLOR[severity] || SEV_COLOR.LOW
  return (
    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, boxShadow: `0 0 10px ${c.glow}` }}>
      {severity}
    </span>
  )
}

export function SourceTag({ source }) {
  const s = SOURCE_CONFIG[source] || SOURCE_CONFIG.LLM
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  )
}

export function StatBox({ value, label, color, icon }) {
  return (
    <div className="rounded-2xl p-4 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-default"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${color}33`,
        boxShadow: `0 4px 20px ${color}15, 0 0 0 0 ${color}`,
      }}>
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-3xl font-black font-mono mb-1"
        style={{ color, textShadow: `0 0 20px ${color}88` }}>
        {value}
      </div>
      <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}

export function Spinner({ size = 36 }) {
  return <div className="spinner" style={{ width: size, height: size }} />
}

export function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, var(--border))' }} />
      <span className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
        style={{ color: 'var(--accent)', background: '#00f5ff10', border: '1px solid #00f5ff22' }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--border), transparent)' }} />
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`btn-glow px-6 py-3 rounded-xl font-bold text-sm text-black transition-all duration-300
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      {children}
    </button>
  )
}

export function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center fade-in">
      <div className="float text-7xl mb-6" style={{ filter: 'drop-shadow(0 0 24px #00f5ff66)' }}>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>{title}</div>
      <div className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--muted)' }}>
        {sub?.split('\n').map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

export function GlowCard({ children, color = 'var(--accent)', className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${color}33`,
        boxShadow: `0 4px 30px ${color}15`,
      }}>
      {children}
    </div>
  )
}
