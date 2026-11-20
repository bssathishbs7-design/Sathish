/** Render the sample's portrait, black-and-white report with merged matrix headers.
 * All rows are retained; long tables continue with repeated section headers.
 * @param {string} title
 * @param {Array} sections Sample report sections from buildBlueprintSampleReport.
 * @returns {Promise<Blob>}
 */
export async function createBlueprintPdf(title, sections) {
  await document.fonts.ready
  const width = 612, height = 792, margin = 72, bottom = height - 54
  const pages = []
  let canvas, ctx, y
  const font = (bold = false) => { ctx.font = (bold ? '700 ' : '400 ') + '9px Arial' }
  const wrap = (value, maxWidth) => {
    const lines = []
    let line = ''
    for (const word of String(value ?? '').split(/(\s+)/)) {
      if (ctx.measureText(line + word).width <= maxWidth) { line += word; continue }
      if (line.trim()) lines.push(line.trimEnd())
      line = ''
      for (const char of word.trimStart()) {
        if (ctx.measureText(line + char).width > maxWidth) { lines.push(line); line = '' }
        line += char
      }
    }
    lines.push(line.trimEnd())
    return lines
  }
  const page = () => {
    canvas = document.createElement('canvas')
    canvas.width = width * 2; canvas.height = height * 2
    ctx = canvas.getContext('2d'); ctx.scale(2, 2)
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#000000'; ctx.lineWidth = .5
    ctx.fillStyle = '#000000'; font()
    y = margin
    pages.push(canvas)
  }
  const box = (lines, x, top, w, h, bold, align = 'center') => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, top, w, h)
    ctx.strokeStyle = '#000000'; ctx.strokeRect(x, top, w, h)
    ctx.fillStyle = '#000000'; font(bold)
    const first = top + (h - lines.length * 11) / 2 + 8.5
    lines.forEach((line, j) => ctx.fillText(line, align === 'left' ? x + 5 : x + (w - ctx.measureText(line).width) / 2, first + j * 11))
  }
  page()
  for (const section of sections) {
    if (section.newPage) page()
    else if (section.name) y += 24
    const widths = section.widths.map(w => (width - 2 * margin) * w / 24)
    const heading = () => {
      if (section.name) { font(true); ctx.fillStyle = '#000000'; ctx.fillText(section.name, margin, y + 8); y += 20 }
      if (section.grouped) {
        const h = 18
        box(['Competency'], margin, y, widths[0], h * 2, true)
        let x = margin + widths[0]
        for (let i = 0; i < 3; i++) {
          const w = widths[i * 2 + 1] + widths[i * 2 + 2]
          box([['MCQ', 'LAQ', 'SAQ'][i]], x, y, w, h, true)
          box(['LoT'], x, y + h, w / 2, h, true)
          box(['HoT'], x + w / 2, y + h, w / 2, h, true)
          x += w
        }
        box(['Total'], x, y, widths[7], h * 2, true)
        y += h * 2
      } else if (section.headers.length) {
        font(true)
        const lines = section.headers.map((label, i) => wrap(label, widths[i] - 10))
        const h = Math.max(...lines.map(l => l.length)) * 11 + 5
        let x = margin
        lines.forEach((cell, i) => { box(cell, x, y, widths[i], h, true); x += widths[i] })
        y += h
      }
    }
    if (y + 90 > bottom) page()
    heading()
    for (const values of section.rows) {
      const bold = values[0] === 'Total'
      font(bold || !section.name)
      let lines = values.map((value, i) => wrap(typeof value === 'number' && section.name === 'MARKS DISTRIBUTION' && i === 3 ? value.toFixed(2) : value, widths[i] - 10))
      let rowHeight = Math.max(...lines.map(l => l.length)) * 11 + 4
      if (y + rowHeight > bottom && rowHeight < bottom - margin - 90) { page(); heading() }
      while (lines.some(cell => cell.length)) {
        let available = Math.floor((bottom - y - 4) / 11)
        if (available < 1) { page(); heading(); available = Math.floor((bottom - y - 4) / 11) }
        const take = Math.min(available, Math.max(...lines.map(l => l.length)))
        rowHeight = take * 11 + 4
        let x = margin
        lines.forEach((cell, i) => { box(cell.slice(0, take), x, y, widths[i], rowHeight, bold || !section.name && i === 0, !section.name || i === 0 && typeof values[i] === 'string' && section.name !== 'MARKS DISTRIBUTION' ? 'left' : 'center'); x += widths[i] })
        y += rowHeight
        lines = lines.map(cell => cell.slice(take))
      }
    }
  }
  const jpegPages = pages.map((pageCanvas, index) => {
    const context = pageCanvas.getContext('2d')
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.fillStyle = '#333333'; context.font = '16px Arial'
    context.fillText(`Page ${index + 1} of ${pages.length}`, margin * 2, (height - 20) * 2)
    return Uint8Array.from(atob(pageCanvas.toDataURL('image/jpeg', .92).split(',')[1]), c => c.charCodeAt(0))
  })
  const encoder = new TextEncoder(), chunks = [], offsets = [0]
  let length = 0
  const append = value => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; chunks.push(bytes); length += bytes.length }
  const object = (id, body, bytes) => { offsets[id] = length; append(`${id} 0 obj\n${body}`); if (bytes) { append('\nstream\n'); append(bytes); append('\nendstream') } append('\nendobj\n') }
  append('%PDF-1.4\n')
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`)
  jpegPages.forEach((bytes, i) => {
    const id = 3 + i * 3
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Image ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`)
    object(id + 1, `<< /Type /XObject /Subtype /Image /Width ${width * 2} /Height ${height * 2} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`, bytes)
    const command = 'q 612 0 0 792 0 0 cm /Image Do Q'
    object(id + 2, `<< /Length ${command.length} >>`, encoder.encode(command))
  })
  const xref = length
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`)
  offsets.slice(1).forEach(offset => append(`${String(offset).padStart(10, '0')} 00000 n \n`))
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  return new Blob(chunks, { type: 'application/pdf' })
}
