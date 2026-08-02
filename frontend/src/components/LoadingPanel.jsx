import { useState, useEffect } from 'react'

const STEPS = [
  { icon: '🔗', text: 'Fetching repository file tree…',       color: '#00f5ff' },
  { icon: '🗂️', text: 'Filtering scannable code files…',      color: '#38bdf8' },
  { icon: '🤖', text: 'Running Groq AI semantic analysis…',   color: '#8b5cf6' },
  { icon: '🔷', text: 'Running Bandit static analysis…',      color: '#06d6a0' },
  { icon: '🔶', text: 'Running Semgrep pattern matching…',    color: '#ffd32a' },
  { icon: '🔄', text: 'Aggregating and deduplicating…',       color: '#ff6b35' },
  { icon: '✨', text: 'Generating AI fix suggestions…',       color: '#a78bfa' },
]

export default function LoadingPanel({ target }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    setStepIdx(0); setProgress(0)
    const si = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, STEPS.length - 1))
      setProgress(p => Math.min(p + 100 / STEPS.length, 93))
    }, 900)
    const di = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    return () => { clearInterval(si); clearInterval(di) }
  }, [target])

  const step = STEPS[stepIdx]

  return (
    <div className="rounded-3xl p-12 flex flex-col items-center gap-8 text-center fade-in"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px #00f5ff08',
        position: 'relative',
        overflow: 'hidden',
      }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 50%, #00f5ff06 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated Icon */}
      <div className="relative z-10">
        <div className="scan-active text-7xl" style={{ filter: 'drop-shadow(0 0 24px #00f5ff88)' }}>
          🛡️
        </div>
      </div>

      {/* Title */}
      <div className="z-10">
        <div className="text-xl font-bold mb-2">
          Scanning with <span className="gradient-text">Groq AI</span>
        </div>
        {target && (
          <div className="text-xs font-mono truncate max-w-md px-4 py-2 rounded-xl"
            style={{ color: 'var(--muted)', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            {target}
          </div>
        )}
      </div>

      {/* Current step */}
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl z-10"
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${step.color}33`,
          boxShadow: `0 0 20px ${step.color}22`,
        }}>
        <span className="text-2xl">{step.icon}</span>
        <span className="text-sm font-mono font-medium" style={{ color: step.color }}>
          {step.text}{dots}
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2 z-10">
        {STEPS.map((s, i) => (
          <div key={i} className="transition-all duration-500"
            style={{
              width: i === stepIdx ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= stepIdx ? s.color : 'var(--border)',
              boxShadow: i === stepIdx ? `0 0 12px ${s.color}` : 'none',
            }} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm h-2 rounded-full overflow-hidden z-10"
        style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700 progress-animated"
          style={{ width: `${progress}%` }} />
      </div>

      <div className="text-xs z-10" style={{ color: 'var(--muted)' }}>
        This may take 15–60 seconds depending on repository size
      </div>
    </div>
  )
}
