// src/components/ScanInput.jsx
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { PrimaryButton, SectionLabel } from './ui'

// ── Supported languages ───────────────────────────────────
const LANG_CONFIG = {
  py:   { lang: 'python',     label: '🐍 Python',     color: '#3776ab' },
  js:   { lang: 'javascript', label: '🟨 JavaScript',  color: '#f7df1e' },
  ts:   { lang: 'typescript', label: '🔷 TypeScript',  color: '#3178c6' },
  java: { lang: 'java',       label: '☕ Java',        color: '#f89820' },
  php:  { lang: 'php',        label: '🐘 PHP',         color: '#777bb4' },
  go:   { lang: 'go',         label: '🐹 Go',          color: '#00add8' },
  rb:   { lang: 'ruby',       label: '💎 Ruby',        color: '#cc342d' },
  cpp:  { lang: 'cpp',        label: '⚙️ C++',         color: '#00599c' },
  c:    { lang: 'c',          label: '🔧 C',           color: '#a8b9cc' },
  cs:   { lang: 'csharp',     label: '🟣 C#',          color: '#9b4f96' },
}
const SUPPORTED_EXTS = Object.keys(LANG_CONFIG).map(e => `.${e}`)

const QUICK_REPOS = [
  { label: 'pallets/flask',  url: 'https://github.com/pallets/flask'  },
  { label: 'psf/requests',   url: 'https://github.com/psf/requests'   },
  { label: 'django/django',  url: 'https://github.com/django/django'   },
]

export default function ScanInput({ onScanRepo, onScanFiles, loading }) {
  const [activeTab, setActiveTab]       = useState('url')
  const [repoUrl, setRepoUrl]           = useState('')
  const [maxFiles, setMaxFiles]         = useState(15)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const onDrop = useCallback((accepted) => {
    setUploadedFiles(prev => [...prev, ...accepted].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 5,
  })

  const getLangInfo = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    return LANG_CONFIG[ext] || { lang: 'unknown', label: '📄 Unknown', color: '#888' }
  }

  const handleRepoScan = () => {
    if (!repoUrl.trim()) return
    onScanRepo(repoUrl.trim(), 'main', maxFiles)
  }

  const handleFileScan = () => {
    if (!uploadedFiles.length) return
    onScanFiles(uploadedFiles)
  }

  const removeFile = (idx) => setUploadedFiles(f => f.filter((_, i) => i !== idx))

  const tabs = [
    { id: 'url',    label: '🔗 GitHub URL'   },
    { id: 'upload', label: '📁 Upload Files' },
  ]

  return (
    <div className="rounded-2xl p-6 mb-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === t.id ? 'var(--surface)' : 'transparent',
              color: activeTab === t.id ? 'var(--accent)' : 'var(--muted)',
              border: activeTab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Supported Languages Banner */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.values(LANG_CONFIG).map(l => (
          <span key={l.lang} className="text-xs px-2 py-1 rounded-lg font-semibold"
            style={{ background: `${l.color}20`, border: `1px solid ${l.color}44`, color: l.color }}>
            {l.label}
          </span>
        ))}
      </div>

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div>
          <SectionLabel>SCAN GITHUB REPOSITORY</SectionLabel>
          <div className="flex gap-3 mb-3">
            <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRepoScan()}
              placeholder="https://github.com/username/repository"
              className="flex-1 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-all"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />
            <PrimaryButton onClick={handleRepoScan} disabled={loading || !repoUrl.trim()}>
              {loading ? '⏳ Scanning…' : '🔍 Scan Repo'}
            </PrimaryButton>
          </div>

          {/* Max files */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Max files:</span>
            {[5, 10, 15, 20].map(n => (
              <button key={n} onClick={() => setMaxFiles(n)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: maxFiles === n ? '#00d4ff20' : 'var(--bg)',
                  border: `1px solid ${maxFiles === n ? 'var(--accent)' : 'var(--border)'}`,
                  color: maxFiles === n ? 'var(--accent)' : 'var(--muted)',
                }}>
                {n}
              </button>
            ))}
          </div>

          {/* Quick repos */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Try:</span>
            {QUICK_REPOS.map(r => (
              <button key={r.url} onClick={() => { setRepoUrl(r.url); onScanRepo(r.url, 'main', maxFiles) }}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs transition-all"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <SectionLabel>UPLOAD CODE FILES — SUPPORTS 10 LANGUAGES</SectionLabel>
          <div {...getRootProps()}
            className="rounded-xl p-10 text-center cursor-pointer transition-all mb-4"
            style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
              background: isDragActive ? '#00d4ff08' : 'var(--bg)',
            }}>
            <input {...getInputProps()} />
            <div className="text-4xl mb-3">📂</div>
            <div className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {isDragActive ? 'Drop files here…' : 'Drag & drop or click to browse'}
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {SUPPORTED_EXTS.join(', ')} — Max 5 files
            </div>
          </div>

          {/* File list */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {uploadedFiles.map((f, i) => {
                const li = getLangInfo(f.name)
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded font-bold"
                        style={{ background: `${li.color}20`, color: li.color }}>
                        {li.label}
                      </span>
                      <span className="font-mono text-sm" style={{ color: 'var(--text)' }}>
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                      <button onClick={() => removeFile(i)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: '#ef4444', background: '#ef444415' }}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <PrimaryButton onClick={handleFileScan} disabled={loading || uploadedFiles.length === 0}>
            {loading ? '⏳ Scanning…' : `🔍 Scan ${uploadedFiles.length || ''} File${uploadedFiles.length !== 1 ? 's' : ''}`}
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
