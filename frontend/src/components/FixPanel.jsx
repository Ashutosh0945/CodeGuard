// src/components/FixPanel.jsx
import { useState } from 'react'
import { SeverityBadge, SourceTag, SectionLabel, SEV_COLOR } from './ui'
import { askAI } from '../api/client'
import toast from 'react-hot-toast'

const QUICK_QUESTIONS = [
  'How serious is this in production?',
  'What is the CVSS score?',
  'Show a real-world exploit example',
  'How to test if my app is vulnerable?',
]

export default function FixPanel({ vuln }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer]     = useState('')
  const [asking, setAsking]     = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) return
    setAsking(true); setAnswer('')
    try {
      const res = await askAI(question, vuln)
      setAnswer(res.answer)
    } catch(e) {
      toast.error('AI error: ' + e.message)
    } finally { setAsking(false) }
  }

  if (!vuln) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6 fade-in">
      <div className="text-5xl mb-4" style={{ filter:'drop-shadow(0 0 12px #00d4ff44)' }}>🛡️</div>
      <div className="font-bold mb-2" style={{ color:'var(--text)' }}>Select a vulnerability</div>
      <div className="text-sm leading-relaxed" style={{ color:'var(--muted)' }}>
        Click any finding on the left to see Groq AI's detailed fix and secure code example.
      </div>
    </div>
  )

  const c = SEV_COLOR[vuln.severity] || SEV_COLOR.LOW

  return (
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="p-4 rounded-xl" style={{ background:'var(--surface2)', border:`1px solid ${c.border}`, boxShadow:`0 0 16px ${c.glow}` }}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <SeverityBadge severity={vuln.severity} />
          <span className="font-bold" style={{ color:'var(--text)' }}>{vuln.type}</span>
          <SourceTag source={vuln.source} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold"
            style={{ background:'#7c3aed18', border:'1px solid #7c3aed55', color:'#a78bfa' }}>
            {vuln.cwe||'CWE-?'}
          </span>
          <span className="text-xs font-mono" style={{ color:'var(--muted)' }}>
            📄 {(vuln.file||'').split('/').pop()} · Line ~{vuln.line||'?'}
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <SectionLabel>📋 DESCRIPTION</SectionLabel>
        <p className="text-sm leading-relaxed" style={{ color:'var(--text)' }}>{vuln.description}</p>
      </div>

      {/* Fix */}
      {vuln.fix && (
        <div>
          <SectionLabel>🛠️ HOW TO FIX</SectionLabel>
          <div className="p-3 rounded-xl text-sm leading-relaxed"
            style={{ background:'#10b98112', border:'1px solid #10b98133', color:'#6ee7b7' }}>
            {vuln.fix}
          </div>
        </div>
      )}

      {/* Code */}
      {vuln.fix_code && (
        <div>
          <SectionLabel>💻 SECURE CODE EXAMPLE</SectionLabel>
          <pre className="code-block">{vuln.fix_code}</pre>
        </div>
      )}

      {/* Ask AI */}
      <div className="pt-4" style={{ borderTop:'1px solid var(--border)' }}>
        <SectionLabel>🤖 ASK GROQ AI</SectionLabel>

        {/* Quick questions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_QUESTIONS.map(q => (
            <button key={q} onClick={() => setQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{
                background:'var(--surface2)',
                border:'1px solid var(--border)',
                color:'var(--muted)',
              }}>
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input value={question} onChange={e=>setQuestion(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleAsk()}
            placeholder="Ask anything about this vulnerability…"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background:'var(--bg)',
              border:'1px solid var(--border)',
              color:'var(--text)',
            }}
            onFocus={e=>e.target.style.borderColor='var(--accent2)'}
            onBlur={e=>e.target.style.borderColor='var(--border)'}
          />
          <button onClick={handleAsk} disabled={asking}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{
              background: asking ? 'var(--surface2)' : 'linear-gradient(135deg,var(--accent2),#5b21b6)',
              boxShadow: asking ? 'none' : '0 4px 16px #7c3aed44',
              opacity: asking ? 0.6 : 1,
              cursor: asking ? 'not-allowed' : 'pointer',
            }}>
            {asking ? '…' : '⚡ Ask'}
          </button>
        </div>

        {answer && (
          <div className="mt-3 p-4 rounded-xl text-sm leading-relaxed fade-in"
            style={{
              background:'linear-gradient(135deg,#7c3aed08,#00d4ff08)',
              border:'1px solid #7c3aed33',
              color:'var(--text)',
            }}>
            <div className="text-xs font-bold mb-2" style={{ color:'var(--accent2)' }}>⚡ Groq AI Response</div>
            {answer}
          </div>
        )}
      </div>
    </div>
  )
}
