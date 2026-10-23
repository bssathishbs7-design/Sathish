/** Creates a questions-only PDF exporter. Helpers use the same question schema as the assessment editor. */
export function createQuestionPaperExporter({ stripHtml, isDescriptiveQuestionType, getQuestionMarksTotal, parseMarksValue, getPublishedQuestionRows }) {
const normalizePdfText = (value) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const escapePdfText = (value) => normalizePdfText(value)
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)')

const sanitizeFileName = (value) => normalizePdfText(value)
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  || 'question-paper'

const getPdfSectionKey = (item) => {
  if (item?.previewSectionKey) return item.previewSectionKey
  if (!isDescriptiveQuestionType(item?.type)) return 'MCQ'
  if (String(item?.type).includes('MEQs')) return 'MEQs'
  if (String(item?.type).includes('LAQs')) return 'LAQs'
  if (String(item?.type).toLowerCase().includes('reasoning')) return 'Reasoning'
  return 'SAQs'
}

const getPdfSectionTitle = (key) => {
  const map = {
    MCQ: 'Multiple Choice Questions',
    SAQs: 'Short Answer Questions',
    MEQs: 'Essay Questions',
    LAQs: 'Long Answer Questions',
    Reasoning: 'Reasoning Answer Questions',
  }
  if (map[key]) return map[key]

  const readableKey = String(key ?? '')
    .replace(/^custom-section-/i, '')
    .replace(/^nmc-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bSaqs\b/g, 'SAQs')
    .replace(/\bMeqs\b/g, 'MEQs')
    .replace(/\bLaqs\b/g, 'LAQs')
    .replace(/\bSAQs\s+/g, '')
    .replace(/\bMEQs\b/g, 'Essay')
    .replace(/\bModified Essay\b/g, 'Essay')
    .trim()

  return readableKey ? `${readableKey} Questions` : 'Questions'
}

const PDF_ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.']

const loadPdfImage = (imageUrl) => new Promise((resolve, reject) => {
  if (!imageUrl) {
    resolve(null)
    return
  }

  const image = new Image()
  image.crossOrigin = 'anonymous'
  const timer = setTimeout(() => reject(new Error('Image loading timed out')), 15000)
  image.onload = () => {
    clearTimeout(timer)
    try {
    const canvas = document.createElement('canvas')
    const maxSize = 1200
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight, 1)
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Unable to render image')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92)
    const base64 = jpegDataUrl.split(',')[1]
    resolve({
      data: atob(base64),
      width: canvas.width,
      height: canvas.height,
    })
    } catch (error) { reject(error) }
  }
  image.onerror = () => { clearTimeout(timer); reject(new Error('Unable to load question paper image')) }
  image.src = imageUrl
})

const getPdfQuestionText = (item) => (
  stripHtml(item?.questionText)
  || item?.title
  || item?.question
  || 'Untitled question'
)

const getPdfOptionText = (option) => stripHtml(option?.label ?? option?.content ?? option)

const getPdfMarksSummary = (questions) => {
  const mcqMarks = questions
    .filter((item) => !isDescriptiveQuestionType(item?.type))
    .reduce((total, item) => total + getQuestionMarksTotal(item), 0)
  const descriptiveMarks = questions
    .filter((item) => isDescriptiveQuestionType(item?.type))
    .reduce((total, item) => total + getQuestionMarksTotal(item), 0)
  return {
    mcqMarks,
    descriptiveMarks,
    totalMarks: mcqMarks + descriptiveMarks,
  }
}

const buildQuestionPaperPdf = async (assessment) => {
  const questions = getPublishedQuestionRows(assessment)
  const setup = assessment?.setup ?? {}
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 54
  const right = pageWidth - margin
  const bottom = 58
  const contentWidth = right - margin
  const pages = []
  const pdfImages = []
  let commands = []
  let y = pageHeight - margin
  const measure = document.createElement('canvas').getContext('2d')
  if (!measure) throw new Error('Unable to prepare question paper')
  const approximateTextWidth = (text, size, font = 'F1') => {
    measure.font = (font === 'F2' ? 'bold ' : font === 'F3' ? 'italic ' : '') + size + 'px "Times New Roman", Times, serif'
    return measure.measureText(normalizePdfText(text)).width
  }
  const wrap = (text, width, size = 13, font = 'F1') => {
    const lines = []
    let line = ''
    for (const word of normalizePdfText(text).split(' ').filter(Boolean)) {
      const next = line ? line + ' ' + word : word
      if (approximateTextWidth(next, size, font) <= width) { line = next; continue }
      if (line) { lines.push(line); line = '' }
      for (const character of word) {
        if (line && approximateTextWidth(line + character, size, font) > width) { lines.push(line); line = '' }
        line += character
      }
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }
  const addCommand = command => commands.push(command)
  const addText = ({ text, x, y: textY, size = 13, font = 'F1' }) => {
    addCommand(`BT /${font} ${size} Tf ${x.toFixed(2)} ${textY.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`)
  }
  const addRightText = ({ text, x = right, y: textY, size = 13, font = 'F1' }) =>
    addText({ text, x: x - approximateTextWidth(text, size, font), y: textY, size, font })
  const addLine = lineY => addCommand(`0.4 w 0 0 0 RG ${margin} ${lineY.toFixed(2)} m ${right.toFixed(2)} ${lineY.toFixed(2)} l S`)
  const title = stripHtml(assessment.assessmentName || 'Assessment')
  const finishPage = () => {
    pages.push(commands.join('\n'))
    commands = []
    y = pageHeight - margin
  }
  const newPage = () => {
    finishPage()
    const shortTitle = wrap(title, contentWidth, 10)[0]
    addText({ text: shortTitle, x: margin, y, size: 10, font: 'F3' })
    y -= 12
    addLine(y)
    y -= 24
  }
  const ensureSpace = height => { if (y - height < bottom && commands.length) newPage() }
  const centred = (text, size, font = 'F1', width = contentWidth, centre = pageWidth / 2) => {
    for (const line of wrap(text, width, size, font)) {
      addText({ text: line, x: centre - approximateTextWidth(line, size, font) / 2, y, size, font })
      y -= size + 4
    }
  }
  const imagesFor = async item => {
    const images = Array.isArray(item?.images) ? item.images : []
    return (await Promise.all(images.map(image => loadPdfImage(typeof image === 'string' ? image : image?.url)))).filter(Boolean)
  }
  const questionImages = await Promise.all(questions.map(imagesFor))
  const drawImages = (images, x) => {
    for (const image of images) {
      const scale = Math.min((right - x) / image.width, 150 / image.height, 1)
      const width = image.width * scale
      const height = image.height * scale
      ensureSpace(height + 12)
      const name = 'Im' + (pdfImages.length + 1)
      pdfImages.push({ ...image, name })
      addCommand(`q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${(y - height).toFixed(2)} cm /${name} Do Q`)
      y -= height + 12
    }
  }
  const logo = await loadPdfImage(setup.logoPreview)
  if (logo) {
    const scale = Math.min(42 / logo.width, 42 / logo.height)
    const name = 'Im1'
    pdfImages.push({ ...logo, name })
    addCommand(`q ${(logo.width * scale).toFixed(2)} 0 0 ${(logo.height * scale).toFixed(2)} ${margin} ${(y - logo.height * scale + 12).toFixed(2)} cm /${name} Do Q`)
  }
  const headerWidth = logo ? contentWidth - 108 : contentWidth
  const headerStart = y
  if (setup.collegeName) centred(setup.collegeName, 14, 'F2', headerWidth)
  centred(title, 15, 'F2', headerWidth)
  const category = assessment.examCategory || setup.examCategory
  const year = assessment.assignTo || setup.assignYear || setup.year
  const academicYear = setup.academicYear || assessment.academicYear
  const details = [category, year, academicYear].filter(Boolean).join(' / ')
  if (details) centred(details, 11)
  if (logo) y = Math.min(y, headerStart - 46)
  y -= 6
  addLine(y)
  y -= 20
  const rawDuration = assessment.totalDuration || setup.totalDuration || setup.duration || ''
  const time = String(rawDuration).match(/^(\d+):(\d{2})$/)
  const duration = time ? [Number(time[1]) ? Number(time[1]) + ' hours' : '', Number(time[2]) ? Number(time[2]) + ' minutes' : ''].filter(Boolean).join(' ') || '0 minutes' : rawDuration
  const marksSummary = getPdfMarksSummary(questions)
  const leftLines = wrap('Duration: ' + (duration || 'Not specified'), contentWidth / 2 - 12, 12)
  const markLines = wrap('Maximum marks: ' + marksSummary.totalMarks, contentWidth / 2 - 12, 12, 'F2')
  for (let i = 0; i < Math.max(leftLines.length, markLines.length); i++) {
    if (leftLines[i]) addText({ text: leftLines[i], x: margin, y, size: 12 })
    if (markLines[i]) addRightText({ text: markLines[i], y, size: 12, font: 'F2' })
    y -= 16
  }
  addLine(y + 5)
  y -= 18
  // Section order follows the saved question paper, never an alphabetical sort.
  const groups = new Map()
  questions.forEach((item, index) => {
    const key = getPdfSectionKey(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({ item, images: questionImages[index] })
  })
  const leading = 17
  const questionX = margin + 22
  const markWidth = 62
  const paragraph = ({ text, label, level = 0, marks, keepNext = 0 }) => {
    const labelX = margin + level * 18
    const textX = labelX + 22
    const hasMarks = marks !== undefined && marks !== null
    const width = right - textX - (hasMarks ? markWidth : 0)
    const lines = wrap(text, width)
    const height = lines.length * leading + 7
    // Keep ordinary subquestions together; very long text can continue safely.
    ensureSpace(Math.min(height + keepNext, 150))
    addText({ text: label, x: labelX, y })
    if (hasMarks) addRightText({ text: '[' + marks + (Number(marks) === 1 ? ' mark]' : ' marks]'), y, size: 11 })
    lines.forEach(line => {
      ensureSpace(leading)
      addText({ text: line, x: textX, y })
      y -= leading
    })
    y -= 7
  }
  let sectionIndex = 0
  let number = 1
  for (const [key, entries] of groups) {
    const sectionMarks = entries.reduce((sum, { item }) => sum + getQuestionMarksTotal(item), 0)
    const heading = (PDF_ROMAN_NUMERALS[sectionIndex++] || sectionIndex + '.') + ' ' + getPdfSectionTitle(key)
    const headingLines = wrap(heading, contentWidth - 80, 13, 'F2')
    ensureSpace(headingLines.length * 18 + 65)
    addRightText({ text: sectionMarks + (sectionMarks === 1 ? ' mark' : ' marks'), y, size: 12, font: 'F2' })
    for (const line of headingLines) {
      addText({ text: line, x: margin, y, size: 13, font: 'F2' })
      y -= 18
    }
    y -= 6
    for (const { item, images } of entries) {
      const descriptive = isDescriptiveQuestionType(item.type)
      const parts = Array.isArray(item.descriptiveSections) ? item.descriptiveSections : []
      const options = (item.options || []).map(getPdfOptionText).filter(Boolean)
      const optionWidth = right - questionX - 20
      const optionHeight = options.reduce((sum, option) => sum + wrap(option, optionWidth).length * leading + 4, 0)
      const stemHeight = wrap(getPdfQuestionText(item), contentWidth - 22 - markWidth).length * leading + 7
      if (!descriptive && !images.length && stemHeight + optionHeight < 380) ensureSpace(stemHeight + optionHeight + 12)
      paragraph({ text: getPdfQuestionText(item), label: number++ + '.', marks: getQuestionMarksTotal(item), keepNext: parts.length || options.length ? 34 : 0 })
      drawImages(images, questionX)
      if (!descriptive) {
        const columnWidth = (right - questionX - 20) / 2 - 22
        const shortOptions = options.every(option => approximateTextWidth(option, 13) <= columnWidth)
        if (shortOptions) {
          for (let i = 0; i < options.length; i += 2) {
            ensureSpace(leading + 4)
            for (let j = 0; j < 2 && i + j < options.length; j++) {
              const x = questionX + j * ((right - questionX) / 2)
              addText({ text: String.fromCharCode(65 + i + j) + '.', x, y })
              addText({ text: options[i + j], x: x + 20, y })
            }
            y -= leading + 4
          }
        } else {
          options.forEach((option, index) => paragraph({ text: option, label: String.fromCharCode(65 + index) + '.', level: 1 }))
        }
      } else {
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          const children = Array.isArray(part.children) ? part.children : []
          paragraph({ text: stripHtml(part.questionText), label: (PDF_ROMAN_NUMERALS[i] || i + 1 + '.').toLowerCase(), level: 1, marks: children.length ? undefined : parseMarksValue(part.marks), keepNext: children.length ? 34 : 0 })
          drawImages(await imagesFor(part), margin + 40)
          for (let j = 0; j < children.length; j++) {
            paragraph({ text: stripHtml(children[j].questionText), label: String.fromCharCode(97 + j) + ')', level: 2, marks: parseMarksValue(children[j].marks) })
            drawImages(await imagesFor(children[j]), margin + 58)
          }
        }
      }
      y -= 8
    }
    y -= 6
  }
  if (!questions.length) addText({ text: 'No questions available.', x: margin, y })
  finishPage()

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`,
  ]

  const fontStartObjectNumber = 3 + pages.length * 2
  const imageStartObjectNumber = fontStartObjectNumber + 3
  const imageResource = pdfImages.length
    ? ` /XObject << ${pdfImages.map((image, index) => `/${image.name} ${imageStartObjectNumber + index} 0 R`).join(' ')} >>`
    : ''

  const pageNumberSize = 10

  pages.forEach((pageContent, index) => {
    const pageObjectNumber = 3 + index * 2
    const streamObjectNumber = pageObjectNumber + 1
    const pageNumberText = `Page ${index + 1} of ${pages.length}`
    const footerTitle = wrap(title, contentWidth - 90, 10)[0]
    const footerTitleContent = `BT /F1 10 Tf ${margin.toFixed(2)} 32.00 Td (${escapePdfText(footerTitle)}) Tj ET`
    const pageNumberContent = `BT /F1 ${pageNumberSize} Tf ${(pageWidth - margin - approximateTextWidth(pageNumberText, pageNumberSize)).toFixed(2)} 32.00 Td (${escapePdfText(pageNumberText)}) Tj ET`
    const fullPageContent = `${pageContent}\n${footerTitleContent}\n${pageNumberContent}`
    objects.push(`${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontStartObjectNumber} 0 R /F2 ${fontStartObjectNumber + 1} 0 R /F3 ${fontStartObjectNumber + 2} 0 R >>${imageResource} >> /Contents ${streamObjectNumber} 0 R >>\nendobj\n`)
    objects.push(`${streamObjectNumber} 0 obj\n<< /Length ${fullPageContent.length} >>\nstream\n${fullPageContent}\nendstream\nendobj\n`)
  })
  objects.push(`${fontStartObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\nendobj\n`)
  objects.push(`${fontStartObjectNumber + 1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj\n`)
  objects.push(`${fontStartObjectNumber + 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>\nendobj\n`)
  pdfImages.forEach((image, index) => {
    objects.push(`${imageStartObjectNumber + index} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n${image.data}\nendstream\nendobj\n`)
  })

  const header = '%PDF-1.4\n'
  const offsets = []
  let body = header
  objects.forEach((object) => {
    offsets.push(body.length)
    body += object
  })
  const xrefOffset = body.length
  const xrefRows = offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')

  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefRows}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Uint8Array.from(body, (character) => character.charCodeAt(0) & 0xff)
}

const downloadQuestionPaperPdf = async (assessment) => {
  const pdf = await buildQuestionPaperPdf(assessment)
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${sanitizeFileName(`${assessment?.assessmentName || 'Assessment'} Question Paper`)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


return downloadQuestionPaperPdf
}
