/**
 * pdfExport.js
 * Generates a professional PDF vulnerability report using jsPDF.
 */

export async function exportToPDF(scanData, repoOrFile) {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  document.head.appendChild(script)
  await new Promise(r => { script.onload = r })

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 15
  let y = 20

  const SEV_COLORS = {
    CRITICAL: [239,68,68], HIGH:[249,115,22], MEDIUM:[245,158,11], LOW:[16,185,129],
  }

  const checkPage = (needed = 20) => { if (y + needed > 278) { doc.addPage(); y = 20 } }

  // HEADER
  doc.setFillColor(8,12,18)
  doc.rect(0,0,W,40,'F')
  doc.setFontSize(22); doc.setFont('helvetica','bold')
  doc.setTextColor(0,212,255); doc.text('CodeGuard', M, 18)
  doc.setFontSize(11); doc.setTextColor(200,210,220)
  doc.text('LLM-Powered Vulnerability Scan Report', M, 26)
  doc.setFontSize(9); doc.setTextColor(92,122,150)
  doc.text(`Generated: ${new Date().toLocaleString()}`, M, 34)
  doc.text(`Target: ${(repoOrFile||'Unknown').slice(0,60)}`, 110, 34)
  y = 50

  // SUMMARY
  const summary = scanData.summary || {}
  const vulns   = scanData.all_vulnerabilities || []
  doc.setFillColor(14,21,32)
  doc.roundedRect(M,y,W-M*2,30,3,3,'F')
  const stats = [
    {label:'Total',   value:vulns.length,          color:[0,212,255]},
    {label:'Critical',value:summary.critical||0,   color:[239,68,68]},
    {label:'High',    value:summary.high||0,        color:[249,115,22]},
    {label:'Medium',  value:summary.medium||0,      color:[245,158,11]},
    {label:'Low',     value:summary.low||0,         color:[16,185,129]},
  ]
  stats.forEach((s,i) => {
    const x = M+10+i*34
    doc.setFontSize(16); doc.setFont('helvetica','bold')
    doc.setTextColor(...s.color); doc.text(String(s.value), x, y+14)
    doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.setTextColor(92,122,150); doc.text(s.label.toUpperCase(), x, y+21)
  })
  y += 40

  doc.setFontSize(9); doc.setTextColor(92,122,150); doc.setFont('helvetica','normal')
  doc.text(`Files scanned: ${scanData.files_scanned||0}/${scanData.total_files||0}   Duration: ${scanData.scan_duration_seconds||'?'}s`, M, y)
  y += 12

  // SECTION TITLE
  doc.setFontSize(13); doc.setFont('helvetica','bold')
  doc.setTextColor(0,212,255); doc.text('Vulnerability Findings', M, y)
  y += 8

  const sevOrder = {CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3}
  const sorted = [...vulns].sort((a,b)=>(sevOrder[a.severity]??4)-(sevOrder[b.severity]??4))

  sorted.forEach((v, idx) => {
    checkPage(48)
    const color = SEV_COLORS[v.severity]||[128,128,128]

    doc.setFillColor(14,21,32)
    doc.roundedRect(M,y,W-M*2,40,2,2,'F')

    // Severity badge
    doc.setFillColor(...color)
    doc.roundedRect(M+3,y+3,22,7,1,1,'F')
    doc.setFontSize(6); doc.setFont('helvetica','bold')
    doc.setTextColor(255,255,255); doc.text(v.severity, M+5, y+8)

    // Type
    doc.setFontSize(10); doc.setFont('helvetica','bold')
    doc.setTextColor(220,230,240)
    doc.text(`${idx+1}. ${(v.type||'Unknown').slice(0,50)}`, M+28, y+8)

    // Meta
    doc.setFontSize(7); doc.setFont('helvetica','normal')
    doc.setTextColor(92,122,150)
    doc.text(`Source: ${v.source||'?'}   CWE: ${v.cwe||'?'}   Line: ~${v.line||'?'}`, M+3, y+16)

    // File
    doc.setFontSize(7); doc.setTextColor(0,212,255)
    const f = (v.file||'').length>70 ? '…'+(v.file||'').slice(-67) : (v.file||'')
    doc.text(f, M+3, y+22)

    // Description
    doc.setFontSize(8); doc.setTextColor(180,195,210); doc.setFont('helvetica','normal')
    const desc = doc.splitTextToSize((v.description||'').slice(0,140), W-M*2-6)
    doc.text(desc[0]||'', M+3, y+29)

    // Fix
    if (v.fix) {
      doc.setFontSize(7); doc.setTextColor(16,185,129)
      doc.text(`✓ ${v.fix.slice(0,110)}`, M+3, y+36)
    }
    y += 44
  })

  // FOOTER + PAGE NUMBERS
  const pageCount = doc.internal.getNumberOfPages()
  for (let i=1; i<=pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8); doc.setTextColor(92,122,150)
    doc.text('CodeGuard — LLM-Powered Vulnerability Scanner | Groq AI + Bandit', M, 290)
    doc.text(`Page ${i}/${pageCount}`, W-25, 290)
  }

  const filename = `CodeGuard_Report_${new Date().toISOString().slice(0,10)}.pdf`
  doc.save(filename)
  return filename
}
