import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { healthCheck } from '../api/client'
import { useTheme } from '../hooks/useTheme'

export default function Header() {
  const location = useLocation()
  const [apiStatus, setApiStatus] = useState('checking')
  const [scanCount, setScanCount] = useState(0)
  const { theme, toggle } = useTheme()

  useEffect(() => {
    healthCheck().then(()=>setApiStatus('online')).catch(()=>setApiStatus('offline'))
    setScanCount(JSON.parse(localStorage.getItem('codeguard_history')||'[]').length)
  }, [])

  const navLinks = [
    { to:'/',          label:'🔍 Scanner',   },
    { to:'/benchmark', label:'📊 Benchmark'  },
    { to:'/history',   label:'📋 History'    },
  ]

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: theme==='dark' ? 'rgba(6,10,16,0.92)' : 'rgba(240,245,251,0.92)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        boxShadow: theme==='dark' ? '0 2px 24px #00d4ff0d' : '0 2px 24px #0077cc0d',
      }}>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              boxShadow: '0 4px 16px #00d4ff44',
            }}>
            🔐
          </div>
          {apiStatus==='online' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
              style={{ background:'#10b981', borderColor:'var(--bg)' }} />
          )}
        </div>
        <div>
          <div className="font-bold text-lg tracking-tight leading-none">
            <span style={{ color:'var(--text)' }}>Code</span>
            <span className="gradient-text">Guard</span>
          </div>
          <div className="text-xs" style={{ color:'var(--muted)' }}>LLM Vulnerability Scanner</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1 p-1 rounded-xl"
        style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
        {navLinks.map(n => (
          <Link key={n.to} to={n.to}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all no-underline"
            style={{
              background: location.pathname===n.to ? 'linear-gradient(135deg,var(--accent2)22,var(--accent)22)' : 'transparent',
              color: location.pathname===n.to ? 'var(--accent)' : 'var(--muted)',
              border: location.pathname===n.to ? '1px solid var(--accent)44' : '1px solid transparent',
              boxShadow: location.pathname===n.to ? '0 0 12px #00d4ff22' : 'none',
            }}>
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* API Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
          <div className="pulse-dot"
            style={{ background: apiStatus==='online'?'#10b981':apiStatus==='offline'?'#ef4444':'#f59e0b' }} />
          <span style={{ color:'var(--muted)' }}>
            {apiStatus==='online'?'API Online':apiStatus==='offline'?'API Offline':'Connecting…'}
          </span>
        </div>

        {/* Groq Badge */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-bold"
          style={{
            background:'linear-gradient(135deg,#00d4ff15,#7c3aed15)',
            border:'1px solid #00d4ff44',
            color:'var(--accent)',
            boxShadow:'0 0 12px #00d4ff22',
          }}>
          ⚡ Groq AI
        </div>

        {/* Theme Toggle */}
        <button onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110"
          style={{
            background:'var(--surface)',
            border:'1px solid var(--border)',
            boxShadow: theme==='dark'?'0 0 12px #f59e0b22':'0 0 12px #7c3aed22',
          }}
          title={theme==='dark'?'Switch to Light':'Switch to Dark'}>
          {theme==='dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
