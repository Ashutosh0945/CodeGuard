// src/pages/Scanner.jsx
import { useState } from 'react'
import toast from 'react-hot-toast'
import ScanInput from '../components/ScanInput'
import LoadingPanel from '../components/LoadingPanel'
import VulnCard from '../components/VulnCard'
import FixPanel from '../components/FixPanel'
import { StatBox, EmptyState, SectionLabel } from '../components/ui'
import { scanRepo, scanUpload } from '../api/client'
import { exportToPDF } from '../utils/pdfExport'

const SEV_ORDER = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3, INFO:4 }

const LANG_LABELS = {
  python:'🐍 Python', javascript:'🟨 JavaScript', typescript:'🔷 TypeScript',
  java:'☕ Java', php:'🐘 PHP', go:'🐹 Go', ruby:'💎 Ruby',
  cpp:'⚙️ C++', c:'🔧 C', csharp:'🟣 C#', unknown:'📄 Unknown',
}

export default function Scanner() {
  const [loading, setLoading]           = useState(false)
  const [exporting, setExporting]       = useState(false)
  const [scanTarget, setScanTarget]     = useState('')
  const [scanData, setScanData]         = useState(null)
  const [selectedVuln, setSelectedVuln] = useState(null)
  const [sevFilter, setSevFilter]       = useState('ALL')
  const [srcFilter, setSrcFilter]       = useState('ALL')
  const [langFilter, setLangFilter]     = useState('ALL')

  const handleScanRepo = async (url, branch, maxFiles) => {
    setLoading(true); setScanTarget(url); setScanData(null); setSelectedVuln(null)
    try {
      const data = await scanRepo(url, branch, maxFiles)
      setScanData(data)
      data.all_vulnerabilities?.length === 0
        ? toast.success('✅ No vulnerabilities found!')
        : toast.success(`Found ${data.all_vulnerabilities.length} vulnerabilities in ${data.files_scanned} files`)
    } catch(e) { toast.error('Scan failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleScanFiles = async (files) => {
    setLoading(true); setScanTarget(files.map(f=>f.name).join(', ')); setScanData(null); setSelectedVuln(null)
    try {
      const data = await scanUpload(files)
      setScanData(data)
      toast.success(`Scanned ${data.files_scanned} file(s) — ${data.all_vulnerabilities?.length||0} findings`)
    } catch(e) { toast.error('Upload scan failed: ' + e.message) }
    finally { setLoading(false) }
  }

  const handleExportPDF = async () => {
    if (!scanData) return
    setExporting(true)
    try {
      const filename = await exportToPDF(scanData, scanTarget)
      toast.success(`📄 Report saved: ${filename}`)
    } catch(e) { toast.error('PDF export failed: ' + e.message) }
    finally { setExporting(false) }
  }

  const vulns   = scanData?.all_vulnerabilities || []
  const summary = scanData?.summary || {}

  // Get unique languages from results
  const langs = [...new Set(scanData?.results?.map(r => r.language).filter(Boolean) || [])]

  const filtered = vulns.filter(v =>
    (sevFilter === 'ALL' || v.severity === sevFilter) &&
    (srcFilter === 'ALL' || v.source === srcFilter) &&
    (langFilter === 'ALL' || v.file?.endsWith(langFilter))
  ).sort((a,b) => (SEV_ORDER[a.severity]??4) - (SEV_ORDER[b.severity]??4))

  const stats = [
    {value:vulns.length,        label:'TOTAL',    color:'#00d4ff'},
    {value:summary.critical||0, label:'CRITICAL', color:'#ef4444'},
    {value:summary.high||0,     label:'HIGH',     color:'#f97316'},
    {value:summary.medium||0,   label:'MEDIUM',   color:'#f59e0b'},
    {value:summary.low||0,      label:'LOW',      color:'#10b981'},
  ]

  // Language breakdown
  const langBreakdown = {}
  vulns.forEach(v => {
    const ext = (v.file||'').split('.').pop().toLowerCase()
    langBreakdown[ext] = (langBreakdown[ext]||0)+1
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <ScanInput onScanRepo={handleScanRepo} onScanFiles={handleScanFiles} loading={loading} />

      {loading && <LoadingPanel target={scanTarget} />}

      {!loading && scanData && (
        <>
          {/* Scan meta + Export button */}
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl mb-4 flex-wrap"
            style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
            <span className="text-sm" style={{ color:'var(--muted)' }}>
              📁 {scanData.files_scanned}/{scanData.total_files} files
            </span>
            {scanData.scan_duration_seconds && (
              <span className="text-sm" style={{ color:'var(--muted)' }}>
                ⏱️ {scanData.scan_duration_seconds}s
              </span>
            )}
            {/* Language tags */}
            {langs.map(l => (
              <span key={l} className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)' }}>
                {LANG_LABELS[l]||l}
              </span>
            ))}
            {scanData.repo_url && (
              <a href={scanData.repo_url} target="_blank" rel="noopener noreferrer"
                className="text-xs ml-2" style={{ color:'var(--accent)' }}>
                🔗 Open Repo ↗
              </a>
            )}
            {/* PDF Export Button */}
            <button onClick={handleExportPDF} disabled={exporting}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: exporting ? 'var(--surface2)' : 'linear-gradient(135deg,#ef4444,#b91c1c)',
                color: '#fff', border:'none', cursor: exporting ? 'not-allowed':'pointer', opacity: exporting?0.6:1,
              }}>
              {exporting ? '⏳ Generating…' : '📄 Export PDF Report'}
            </button>
          </div>

          {/* Stat boxes */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {stats.map(s => <StatBox key={s.label} {...s} />)}
          </div>

          {/* Language breakdown */}
          {Object.keys(langBreakdown).length > 0 && (
            <div className="flex gap-3 mb-5 flex-wrap">
              <span className="text-xs font-bold tracking-widest self-center" style={{ color:'var(--muted)' }}>
                BY LANGUAGE:
              </span>
              {Object.entries(langBreakdown).map(([ext, count]) => (
                <span key={ext} className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)' }}>
                  .{ext} — {count} issue{count>1?'s':''}
                </span>
              ))}
            </div>
          )}

          {vulns.length === 0 ? (
            <EmptyState icon="✅" title="No vulnerabilities found" sub="This codebase passed all checks." />
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns:'1fr 400px' }}>
              {/* Left — Vuln list */}
              <div>
                {/* Filters */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <SectionLabel>VULNERABILITIES ({filtered.length})</SectionLabel>
                  <div className="flex gap-2 flex-wrap">
                    {['ALL','CRITICAL','HIGH','MEDIUM','LOW'].map(s => (
                      <button key={s} onClick={() => setSevFilter(s)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: sevFilter===s ? '#00d4ff20':'var(--surface)',
                          border:`1px solid ${sevFilter===s?'var(--accent)':'var(--border)'}`,
                          color: sevFilter===s?'var(--accent)':'var(--muted)',
                        }}>
                        {s}
                      </button>
                    ))}
                    <select value={srcFilter} onChange={e=>setSrcFilter(e.target.value)}
                      className="px-3 py-1 rounded-lg text-xs outline-none"
                      style={{ background:'var(--surface)', border:'1px solid var(--border)', color:'var(--muted)' }}>
                      {['ALL','LLM','Bandit','Semgrep'].map(s=>(
                        <option key={s} value={s}>{s==='ALL'?'All Sources':s==='LLM'?'Groq AI':s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3" style={{ maxHeight:'75vh', overflowY:'auto', paddingRight:4 }}>
                  {filtered.map((v,i) => (
                    <VulnCard key={v.id||i} vuln={v}
                      selected={selectedVuln?.id===v.id}
                      onClick={() => setSelectedVuln(v)} />
                  ))}
                  {filtered.length===0 && (
                    <EmptyState icon="🔍" title="No results match this filter" sub="Try changing the filter." />
                  )}
                </div>
              </div>

              {/* Right — Fix panel */}
              <div className="rounded-2xl p-5"
                style={{
                  background:'var(--surface)', border:'1px solid var(--border)',
                  position:'sticky', top:74, maxHeight:'calc(100vh - 90px)', overflowY:'auto',
                }}>
                <SectionLabel>AI FIX SUGGESTION</SectionLabel>
                <FixPanel vuln={selectedVuln} />
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !scanData && (
        <EmptyState icon="🔐" title="Ready to scan"
          sub="Supports Python, JavaScript, TypeScript, Java, PHP, Go, Ruby, C, C++, C#\nEnter a GitHub URL or upload code files above." />
      )}
    </div>
  )
}
