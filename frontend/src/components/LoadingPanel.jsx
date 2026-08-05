// src/components/LoadingPanel.jsx
import { useState, useEffect } from 'react'

const STEPS = [
  { icon:'🔗', text:'Fetching repository file tree…'         },
  { icon:'🗂️', text:'Filtering scannable code files…'        },
  { icon:'🤖', text:'Running Groq AI semantic analysis…'     },
  { icon:'🔷', text:'Running Bandit static analysis…'        },
  { icon:'🔶', text:'Running Semgrep pattern matching…'      },
  { icon:'🔄', text:'Aggregating and deduplicating results…' },
  { icon:'✨', text:'Generating AI fix suggestions…'         },
]

export default function LoadingPanel({ target }) {
  const [stepIdx, setStepIdx]   = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots]         = useState('')

  useEffect(() => {
    setStepIdx(0); setProgress(0)
    const si = setInterval(() => {
      setStepIdx(i => Math.min(i+1, STEPS.length-1))
      setProgress(p => Math.min(p + 100/STEPS.length, 92))
    }, 900)
    const di = setInterval(() => setDots(d => d.length>=3?'':d+'.'), 400)
    return () => { clearInterval(si); clearInterval(di) }
  }, [target])

  return (
    <div className="rounded-2xl p-10 flex flex-col items-center gap-6 text-center fade-in"
      style={{
        background:'var(--surface)',
        border:'1px solid var(--border)',
        boxShadow:'0 8px 40px #00d4ff0d',
      }}>

      {/* Animated shield */}
      <div className="relative">
        <div className="text-6xl scan-active" style={{ filter:'drop-shadow(0 0 20px #00d4ff66)' }}>🔐</div>
        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background:'var(--accent)', animationDuration:'1.5s' }} />
      </div>

      <div>
        <div className="text-lg font-bold mb-1" style={{ color:'var(--text)' }}>
          Scanning with <span className="gradient-text">Groq AI</span> + Semgrep + Bandit
        </div>
        {target && (
          <div className="text-xs font-mono truncate max-w-md" style={{ color:'var(--muted)' }}>
            {target}
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{ background:'var(--surface2)', border:'1px solid var(--border)' }}>
        <span className="text-xl">{STEPS[stepIdx].icon}</span>
        <span className="text-sm font-mono" style={{ color:'var(--accent)' }}>
          {STEPS[stepIdx].text}{dots}
        </span>
      </div>

      {/* Step dots */}
      <div className="flex gap-2">
        {STEPS.map((_,i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i<=stepIdx ? 'var(--accent)' : 'var(--border)',
              boxShadow:  i===stepIdx ? '0 0 8px var(--accent)' : 'none',
              transform:  i===stepIdx ? 'scale(1.4)' : 'scale(1)',
            }} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-80 h-2 rounded-full overflow-hidden" style={{ background:'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700 progress-animated"
          style={{ width:`${progress}%` }} />
      </div>

      <div className="text-xs" style={{ color:'var(--muted)' }}>
        This may take 15–60 seconds depending on repository size.
      </div>
    </div>
  )
}
