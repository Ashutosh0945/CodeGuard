import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Scanner from './pages/Scanner'
import Benchmark from './pages/Benchmark'
import History from './pages/History'

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('cg-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <Routes>
        <Route path="/"          element={<Scanner />}   />
        <Route path="/benchmark" element={<Benchmark />} />
        <Route path="/history"   element={<History />}   />
      </Routes>
    </div>
  )
}
