/**
 * Render saved editor HTML using the paper's Times fonts and pagination helpers.
 * @param {string} html Saved setup.studentInstructions; empty content is omitted.
 * @param {object} layout PDF drawing, measurement and cursor callbacks.
 */
export function drawPaperInstructions(html, { margin, right, measure, text, command, ensureSpace, getY, advance }) {
  const root = new DOMParser().parseFromString(String(html ?? ''), 'text/html').body
  const blocks = []
  let runs = []
  let marker = null
  let depth = 0
  const flush = () => {
    if (runs.some(run => run.text.trim())) blocks.push({ runs, marker, depth })
    runs = []
    marker = null
  }
  const visit = (node, font = 'F1') => {
    if (node.nodeType === 3) {
      runs.push({ text: node.textContent.replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' '), font })
      return
    }
    if (node.nodeType !== 1 || /^(SCRIPT|STYLE|IFRAME|OBJECT)$/.test(node.tagName)) return
    const tag = node.tagName
    if (tag === 'UL' || tag === 'OL') {
      flush()
      depth++
      Array.from(node.children).forEach((child, index) => {
        marker = tag === 'OL' ? `${index + 1}.` : 'bullet'
        Array.from(child.childNodes).forEach(n => visit(n, font))
        flush()
      })
      depth--
      return
    }
    if (tag === 'BR') { flush(); return }
    const isBlock = /^(P|DIV|H[1-6]|BLOCKQUOTE)$/.test(tag)
    if (isBlock && runs.some(run => run.text.trim())) flush()
    const bold = /^(B|STRONG|H[1-6])$/.test(tag) || /^(bold|[7-9]00)$/.test(node.style.fontWeight)
    const italic = /^(I|EM)$/.test(tag) || node.style.fontStyle === 'italic'
    const nextFont = bold ? 'F2' : italic ? 'F3' : font
    Array.from(node.childNodes).forEach(child => visit(child, nextFont))
    if (isBlock) flush()
  }
  Array.from(root.childNodes).forEach(node => visit(node))
  flush()
  const size = 10
  const leading = 12
  const textWidth = (value, font) => value === ' '
    ? measure('a a', size, font) - measure('aa', size, font)
    : measure(value, size, font)
  blocks.forEach((block, blockIndex) => {
    // Match question text indentation; wrapped list lines share this same edge.
    const x = margin + (block.depth ? 22 + (Math.min(block.depth, 6) - 1) * 18 : 0)
    const width = right - x
    const lines = []
    let line = []
    let used = 0
    const finishLine = () => { if (line.length) lines.push(line); line = []; used = 0 }
    for (const run of block.runs) {
      for (const token of run.text.match(/\s+|\S+/g) || []) {
        if (!used && !token.trim()) continue
        const tokenWidth = token === ' ' ? textWidth(token, run.font) : measure(token, size, run.font)
        if (used + tokenWidth > width) finishLine()
        if (!used && !token.trim()) continue
        // Split unbroken text too, so pasted URLs cannot overflow the paper.
        for (const character of token) {
          const charWidth = textWidth(character, run.font)
          if (used + charWidth > width) finishLine()
          line.push({ text: character, font: run.font, width: charWidth })
          used += charWidth
        }
      }
    }
    finishLine()
    ensureSpace(Math.min(lines.length * leading + (blockIndex < blocks.length - 1 ? leading : 0), 96))
    lines.forEach((segments, index) => {
      ensureSpace(leading)
      if (index === 0 && block.marker === 'bullet') {
        const bx = x - 16
        const by = getY() + 3
        command(`q 0 0 0 rg ${bx} ${by + 1.5} m ${bx + 2} ${by + 1.5} ${bx + 2} ${by - 1.5} ${bx} ${by - 1.5} c ${bx - 2} ${by - 1.5} ${bx - 2} ${by + 1.5} ${bx} ${by + 1.5} c f Q`)
      } else if (index === 0 && block.marker) {
        text({ text: block.marker, x: x - 16, y: getY(), size })
      }
      let cursor = x
      // Combine adjacent characters of the same style into searchable PDF text.
      const spans = []
      segments.forEach(segment => {
        const last = spans.at(-1)
        if (last?.font === segment.font && last.text.trim() && segment.text.trim()) { last.text += segment.text; last.width += segment.width }
        else spans.push({ ...segment })
      })
      spans.forEach(span => {
        if (span.text.trim()) text({ text: span.text, x: cursor, y: getY(), size, font: span.font })
        cursor += span.width
      })
      advance(leading)
    })
    advance(block.marker ? 0 : 2)
  })
}
