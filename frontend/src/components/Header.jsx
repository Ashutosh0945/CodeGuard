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
    healthCheck().then(() => setApiStatus('online')).catch(() => setApiStatus('offline'))
    setScanCount(JSON.parse(localStorage.getItem('codeguard_history') || '[]').length)
  }, [])

  const navLinks = [
    { to: '/',          label: '🔍 Scanner',   },
    { to: '/benchmark', label: '📊 Benchmark'  },
    { to: '/history',   label: '📋 History'    },
  ]

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-8 py-3"
      style={{
        background: theme === 'dark' ? 'rgba(3,6,15,0.85)' : 'rgba(238,244,252,0.85)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        boxShadow: theme === 'dark' ? '0 2px 30px #00f5ff0a' : '0 2px 20px #0066cc0a',
      }}>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              boxShadow: '0 4px 20px #00f5ff44',
            }}>
            🔐
          </div>
          {apiStatus === 'online' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 pulse-dot"
              style={{ background: '#06d6a0', borderColor: 'var(--bg)' }} />
          )}
        </div>
        <div>
          <div className="font-black text-lg tracking-tight leading-none">
            <span style={{ color: 'var(--text)' }}>Code</span>
            <span className="gradient-text">Guard</span>
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            AI Vulnerability Scanner
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1 p-1 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {navLinks.map(n => (
          <Link key={n.to} to={n.to}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 no-underline"
            style={{
              background: location.pathname === n.to
                ? 'linear-gradient(135deg, #00f5ff15, #8b5cf615)'
                : 'transparent',
              color: location.pathname === n.to ? 'var(--accent)' : 'var(--muted)',
              border: location.pathname === n.to ? '1px solid #00f5ff33' : '1px solid transparent',
              boxShadow: location.pathname === n.to ? '0 0 16px #00f5ff22' : 'none',
            }}>
            {n.label}
          </Link>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">

        {/* API Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="pulse-dot"
            style={{
              background: apiStatus === 'online' ? '#06d6a0'
                        : apiStatus === 'offline' ? '#ff4757' : '#ffd32a'
            }} />
          <span style={{ color: 'var(--muted)' }}>
            {apiStatus === 'online' ? 'API Online'
           : apiStatus === 'offline' ? 'API Offline' : 'Connecting…'}
          </span>
        </div>

        {/* Groq Badge */}
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #00f5ff12, #8b5cf612)',
            border: '1px solid #00f5ff44',
            color: 'var(--accent)',
            boxShadow: '0 0 16px #00f5ff22',
          }}>
          ⚡ Groq AI
        </div>

        {/* Theme Toggle */}
        <button onClick={toggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 hover:rotate-12"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: theme === 'dark' ? '0 0 16px #ffd32a22' : '0 0 16px #8b5cf622',
          }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
