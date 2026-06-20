import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, BadgeCheck, Clock3, Download, EyeOff, FileWarning, FolderPlus, Info, Monitor, Pencil, Plus, Trash2, X } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const assessmentMetrics = [
  {
    label: 'Draft Assessment',
    count: 0,
    icon: FolderPlus,
    tone: 'draft',
  },
  {
    label: 'Pending Approval',
    count: 0,
    icon: Clock3,
    tone: 'pending',
  },
  {
    label: 'Approved Assessment',
    count: 0,
    icon: BadgeCheck,
    tone: 'approved',
  },
  {
    label: 'Approval Rejected',
    count: 0,
    icon: FileWarning,
    tone: 'rejected',
  },
  {
    label: 'Published Assessment',
    count: 0,
    icon: BadgeCheck,
    tone: 'published',
  },
]

const selectOptions = {
  colleges: [
    'Sri Ramachandra Institute of Higher Education and Research',
    'Saveetha Institute of Medical and Technical Sciences',
    'SRM Medical College Hospital and Research Centre',
    'Sri Manakula Vinayagar Medical College and Hospital',
  ],
  examCategories: [
    'Internal Assessment',
    'University Exam',
    'Formative Assessment',
    'Summative Assessment',
    'Theory Exam',
    'Practical Exam',
    'Viva Voce',
    'Mock Test',
    'Entrance/Screening Test',
  ],
  courses: ['India MBBS (NMC Syllabus)'],
  years: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
  academicYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'],
}

const initialForm = {
  collegeName: '',
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
}

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const PUBLISHED_LOG_PAGE_SIZE = 5

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const stripHtml = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

const formatYearLabel = (value) => {
  const yearMap = {
    'Year 1': 'First Year',
    'Year 2': 'Second Year',
    'Year 3': 'Third Year',
    'Year 4': 'Fourth Year',
  }
  return yearMap[value] || value || '-'
}

const readAssessmentDrafts = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const readPublishedAssessments = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getAssessmentStorageSuffix = (setup = {}) => {
  if (setup.assessmentId) return String(setup.assessmentId)
  const signature = [
    setup.collegeName,
    setup.assessmentName,
    setup.academicYear,
    setup.examCategory,
    setup.course,
    setup.year,
  ].filter(Boolean).join('|')
  return signature ? signature.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'draft'
}

const getAssessmentQuestionsStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_QUESTIONS_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const readDraftQuestions = (draft) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(draft?.setup ?? draft)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getDraftValue = (draft, ...keys) => {
  for (const key of keys) {
    const value = draft?.[key] ?? draft?.setup?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getQuestionMarksTotal = (item) => {
  if (isDescriptiveQuestionType(item?.type)) {
    const sections = Array.isArray(item?.descriptiveSections) ? item.descriptiveSections : []
    const sectionMarks = sections.reduce((total, section) => {
      const children = Array.isArray(section.children) ? section.children : []
      const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
      const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
      return total + ownMarks + childMarks
    }, 0)
    const totalMarks = (sections.length ? 0 : parseMarksValue(item?.marks)) + sectionMarks
    return totalMarks || (stripHtml(item?.questionText) ? 2 : 0)
  }

  if (item?.type === 'MCQ' && !parseMarksValue(item?.marks)) return 1
  return parseMarksValue(item?.marks)
}

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

const wrapPdfText = (value, maxLength = 88) => {
  const words = normalizePdfText(value).split(' ').filter(Boolean)
  const lines = []

  words.forEach((word) => {
    const currentLine = lines[lines.length - 1] ?? ''
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= maxLength) {
      if (lines.length) lines[lines.length - 1] = nextLine
      else lines.push(nextLine)
      return
    }

    if (word.length > maxLength) {
      lines.push(`${word.slice(0, maxLength - 1)}-`)
      return
    }

    lines.push(word)
  })

  return lines.length ? lines : ['-']
}

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
    MCQ: 'Multiple Choice Question',
    SAQs: 'Short Answer Questions',
    MEQs: 'Modified Essay Questions',
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
    .trim()

  return readableKey ? `${readableKey} Questions` : 'Questions'
}

const PDF_SECTION_ORDER = ['MCQ', 'SAQs', 'MEQs', 'LAQs', 'Reasoning']
const PDF_ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.']

const loadPdfLogoImage = (logoPreview) => new Promise((resolve) => {
  if (!logoPreview) {
    resolve(null)
    return
  }

  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    const maxSize = 180
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight, 1)
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')

    if (!context) {
      resolve(null)
      return
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
  }
  image.onerror = () => resolve(null)
  image.src = logoPreview
})

const getPublishedQuestionRows = (assessment) => (
  Array.isArray(assessment?.questionRows) ? assessment.questionRows : []
)

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
  const logoImage = await loadPdfLogoImage(setup.logoPreview)
  const marksSummary = getPdfMarksSummary(questions)
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 28
  const contentWidth = pageWidth - (margin * 2)
  const pages = []
  let commands = []
  let y = pageHeight - 30

  const approximateTextWidth = (text, size) => normalizePdfText(text).length * size * 0.47
  const addCommand = (command) => commands.push(command)
  const addText = ({ text, x, y: textY, size = 12, font = 'F1' }) => {
    addCommand(`BT /${font} ${size} Tf ${x.toFixed(2)} ${textY.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`)
  }
  const addCenteredText = ({ text, y: textY, size = 12, font = 'F1' }) => {
    addText({ text, x: (pageWidth - approximateTextWidth(text, size)) / 2, y: textY, size, font })
  }
  const addCenteredTextInBox = ({ text, centerX, y: textY, size = 12, font = 'F1' }) => {
    addText({ text, x: centerX - (approximateTextWidth(text, size) / 2), y: textY, size, font })
  }
  const addRightText = ({ text, x, y: textY, size = 12, font = 'F1' }) => {
    addText({ text, x: x - approximateTextWidth(text, size), y: textY, size, font })
  }
  const addLine = (x1, y1, x2, y2) => addCommand(`0 0 0 RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
  const addRect = (x, rectY, width, height) => addCommand(`0 0 0 RG ${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`)
  const finishPage = () => {
    pages.push(commands.join('\n'))
    commands = []
    y = pageHeight - 42
  }
  const ensureSpace = (height) => {
    if (y - height > margin) return
    finishPage()
  }
  const addWrappedText = ({ text, x, maxLength, size = 12, font = 'F1', lineHeight = 15, indent = 0 }) => {
    const lines = wrapPdfText(text, maxLength)
    lines.forEach((line, index) => {
      ensureSpace(lineHeight + 6)
      addText({ text: line, x: x + (index ? indent : 0), y, size, font })
      y -= lineHeight
    })
  }
  const getWrappedTextHeight = (text, maxLength, lineHeight) => wrapPdfText(text, maxLength).length * lineHeight
  const getQuestionBlockHeight = (item, displayNumber) => {
    const isDescriptive = isDescriptiveQuestionType(item?.type)
    const questionHeight = getWrappedTextHeight(`${displayNumber}. ${getPdfQuestionText(item)}`, 103, 13)

    if (!isDescriptive) {
      const optionRows = Math.ceil((item.options ?? []).map(getPdfOptionText).filter(Boolean).length / 2)
      return questionHeight + 4 + (optionRows * 18) + 8
    }

    const sections = Array.isArray(item.descriptiveSections) ? item.descriptiveSections : []
    const sectionHeight = sections.reduce((total, section, sectionIndex) => {
      const sectionLabel = `${PDF_ROMAN_NUMERALS[sectionIndex]?.replace('.', '').toLowerCase() || sectionIndex + 1}.`
      const ownHeight = getWrappedTextHeight(`${sectionLabel} ${stripHtml(section.questionText) || 'Sub question'}`, 88, 13)
      const childHeight = (section.children ?? []).reduce((childTotal, child, childIndex) => (
        childTotal + getWrappedTextHeight(`${String.fromCharCode(97 + childIndex)}. ${stripHtml(child.questionText) || 'Inside question'}`, 84, 13)
      ), 0)
      return total + ownHeight + childHeight
    }, 0)

    return questionHeight + 5 + sectionHeight + (sections.length * 3) + 10
  }

  const hasLogo = Boolean(logoImage)
  const logoBoxX = margin + 6
  const logoBoxY = pageHeight - 94
  const logoMaxSize = 56
  const headerCenterX = pageWidth / 2

  if (logoImage) {
    const logoScale = Math.min(logoMaxSize / logoImage.width, logoMaxSize / logoImage.height)
    const logoWidth = logoImage.width * logoScale
    const logoHeight = logoImage.height * logoScale
    addCommand(`q ${logoWidth.toFixed(2)} 0 0 ${logoHeight.toFixed(2)} ${logoBoxX.toFixed(2)} ${(logoBoxY + ((logoMaxSize - logoHeight) / 2)).toFixed(2)} cm /Im1 Do Q`)
  }
  addCenteredTextInBox({ text: setup.collegeName || '[Select College Name]', centerX: headerCenterX, y: pageHeight - 48, size: 15, font: 'F2' })
  addCenteredTextInBox({ text: `Academic Year ${String(setup.academicYear || '2025 - 2026').replace(/\s*-\s*/g, '-')}`, centerX: headerCenterX, y: pageHeight - 68, size: 12, font: 'F3' })
  addCenteredTextInBox({ text: assessment?.assessmentName || '[Assessment Name]', centerX: headerCenterX, y: pageHeight - 90, size: 15, font: 'F2' })
  addCenteredTextInBox({ text: assessment?.examCategory || '[Exam Category]', centerX: headerCenterX, y: pageHeight - 109, size: 12, font: 'F2' })
  y = pageHeight - 124
  addLine(margin, y, pageWidth - margin, y)
  y -= 18
  const totalMarksText = `Total Marks : ${marksSummary.totalMarks} (${marksSummary.mcqMarks} MCQ + ${String(marksSummary.descriptiveMarks).padStart(2, '0')} Descriptive)`
  const durationLabel = 'Duration : '
  const durationValue = assessment?.totalDuration || 'HH:MM'
  const durationStartX = pageWidth - margin - 12 - approximateTextWidth(`${durationLabel}${durationValue}`, 12)
  addText({
    text: totalMarksText,
    x: margin + 12,
    y,
    size: 12,
    font: 'F2',
  })
  addText({ text: durationLabel, x: durationStartX, y, size: 12 })
  addText({ text: durationValue, x: durationStartX + approximateTextWidth(durationLabel, 12), y, size: 12, font: 'F2' })
  y -= 13
  addLine(margin, y, pageWidth - margin, y)
  y -= 20

  const groupedQuestions = questions.reduce((groups, item) => {
    const key = getPdfSectionKey(item)
    return { ...groups, [key]: [...(groups[key] || []), item] }
  }, {})
  const orderedKeys = [
    ...PDF_SECTION_ORDER.filter((key) => groupedQuestions[key]?.length),
    ...Object.keys(groupedQuestions).filter((key) => !PDF_SECTION_ORDER.includes(key)),
  ]
  let sectionNumber = 0
  let questionNumber = 1

  orderedKeys.forEach((sectionKey) => {
    const sectionQuestions = groupedQuestions[sectionKey] || []
    const sectionMarks = sectionQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
    const firstQuestionHeight = sectionQuestions.length ? getQuestionBlockHeight(sectionQuestions[0], questionNumber) : 0
    ensureSpace(34 + firstQuestionHeight)
    const roman = PDF_ROMAN_NUMERALS[sectionNumber] || `${sectionNumber + 1}.`
    addText({ text: `${roman}${getPdfSectionTitle(sectionKey)}`, x: margin + 4, y, size: 13, font: 'F2' })
    addRightText({ text: `${String(sectionMarks).padStart(2, '0')} Marks`, x: pageWidth - margin - 12, y, size: 13, font: 'F2' })
    y -= 22
    sectionNumber += 1

    sectionQuestions.forEach((item) => {
      const isDescriptive = isDescriptiveQuestionType(item?.type)
      const questionMarks = getQuestionMarksTotal(item)
      const questionText = `${questionNumber}. ${getPdfQuestionText(item)}`
      ensureSpace(getQuestionBlockHeight(item, questionNumber))
      addWrappedText({ text: questionText, x: margin + 4, maxLength: 103, size: 12, lineHeight: 13, indent: 16 })
      questionNumber += 1

      if (!isDescriptive) {
        y -= 4
        const options = (item.options ?? []).map(getPdfOptionText).filter(Boolean)
        for (let optionIndex = 0; optionIndex < options.length; optionIndex += 2) {
          ensureSpace(16)
          const leftOption = `${String.fromCharCode(65 + optionIndex)}. ${options[optionIndex]}`
          const rightOption = options[optionIndex + 1] ? `${String.fromCharCode(66 + optionIndex)}. ${options[optionIndex + 1]}` : ''
          addText({ text: leftOption, x: margin + 32, y, size: 12 })
          if (rightOption) addText({ text: rightOption, x: margin + 286, y, size: 12 })
          y -= 16
        }
      } else {
        const sections = Array.isArray(item.descriptiveSections) ? item.descriptiveSections : []
        y -= sections.length ? 5 : 0
        sections.forEach((section, sectionIndex) => {
          const sectionLabel = `${PDF_ROMAN_NUMERALS[sectionIndex]?.replace('.', '').toLowerCase() || sectionIndex + 1}.`
          addWrappedText({ text: `${sectionLabel} ${stripHtml(section.questionText) || 'Sub question'}`, x: margin + 28, maxLength: 88, size: 12, lineHeight: 13, indent: 16 })
          y -= (section.children ?? []).length ? 3 : 0
          ;(section.children ?? []).forEach((child, childIndex) => {
            addWrappedText({ text: `${String.fromCharCode(97 + childIndex)}. ${stripHtml(child.questionText) || 'Inside question'}`, x: margin + 42, maxLength: 84, size: 12, lineHeight: 13, indent: 16 })
            if (parseMarksValue(child.marks)) {
              addRightText({ text: `[${String(child.marks).padStart(2, '0')} Marks]`, x: pageWidth - margin - 12, y: y + 14, size: 12 })
            }
          })
          if (!(section.children ?? []).length && parseMarksValue(section.marks)) {
            addRightText({ text: `[${String(section.marks).padStart(2, '0')} Marks]`, x: pageWidth - margin - 12, y: y + 14, size: 12 })
          }
        })
        if (!sections.length && questionMarks) {
          addRightText({ text: `[${String(questionMarks).padStart(2, '0')} Marks]`, x: pageWidth - margin - 12, y: y + 15, size: 12 })
        }
      }
      y -= isDescriptive ? 10 : 8
    })
  })

  if (!orderedKeys.length) {
    addText({ text: 'No questions available.', x: margin + 4, y, size: 12 })
  }

  finishPage()

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`,
  ]

  const fontStartObjectNumber = 3 + pages.length * 2
  const imageObjectNumber = fontStartObjectNumber + 3
  const imageResource = logoImage ? ` /XObject << /Im1 ${imageObjectNumber} 0 R >>` : ''

  const pageNumberSize = 10

  pages.forEach((pageContent, index) => {
    const pageObjectNumber = 3 + index * 2
    const streamObjectNumber = pageObjectNumber + 1
    const pageNumberText = `Page ${index + 1} of ${pages.length}`
    const pageNumberContent = `BT /F1 ${pageNumberSize} Tf ${(pageWidth - margin - approximateTextWidth(pageNumberText, pageNumberSize)).toFixed(2)} 18.00 Td (${escapePdfText(pageNumberText)}) Tj ET`
    const fullPageContent = `${pageContent}\n${pageNumberContent}`
    objects.push(`${pageObjectNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontStartObjectNumber} 0 R /F2 ${fontStartObjectNumber + 1} 0 R /F3 ${fontStartObjectNumber + 2} 0 R >>${imageResource} >> /Contents ${streamObjectNumber} 0 R >>\nendobj\n`)
    objects.push(`${streamObjectNumber} 0 obj\n<< /Length ${fullPageContent.length} >>\nstream\n${fullPageContent}\nendstream\nendobj\n`)
  })
  objects.push(`${fontStartObjectNumber} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\nendobj\n`)
  objects.push(`${fontStartObjectNumber + 1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj\n`)
  objects.push(`${fontStartObjectNumber + 2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>\nendobj\n`)
  if (logoImage) {
    objects.push(`${imageObjectNumber} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.data.length} >>\nstream\n${logoImage.data}\nendstream\nendobj\n`)
  }

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

const getDraftSummary = (draft) => {
  const questions = readDraftQuestions(draft)
  if (questions.length) {
    return {
      questionCount: questions.length,
      totalMarks: questions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
    }
  }

  return {
    questionCount: Number(draft?.questionCount ?? 0),
    totalMarks: Number(draft?.totalMarks ?? 0),
  }
}

const formatDraftSavedDate = (value) => {
  if (!value) return 'Draft saved'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Draft saved'
  return `Saved ${date.toLocaleDateString()}`
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const formatDisplayDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString('en-GB').replace(/\//g, '-')} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const parseAssessmentDate = (value) => {
  if (!value) return null
  const normalized = String(value).trim()
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const displayMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)

  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
  if (displayMatch) return new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1]))

  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const applyAssessmentTime = (date, value) => {
  if (!date) return null
  const nextDate = new Date(date)
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i)

  if (!match) {
    nextDate.setHours(0, 0, 0, 0)
    return nextDate
  }

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const period = String(match[3] || '').toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  nextDate.setHours(hours, minutes, 0, 0)
  return nextDate
}

const parseAssessmentDurationMs = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  return ((hours * 60) + minutes) * 60 * 1000
}

const getDayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const getPublishedAssessmentScheduleStatus = (assessment, now = new Date()) => {
  const startDate = parseAssessmentDate(assessment?.startDate)
  if (!startDate) return null

  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  const durationMs = parseAssessmentDurationMs(assessment?.totalDuration)
  const durationEndAt = durationMs ? new Date(startAt.getTime() + durationMs) : null
  const endDate = parseAssessmentDate(assessment?.endDate)
  const dateEndAt = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null
  const endAt = [durationEndAt, dateEndAt].filter(Boolean).sort((a, b) => a - b)[0] || startAt
  if (now > endAt) return { type: 'completed', label: 'Completed' }
  if (now >= startAt) return { type: 'live', label: 'Assessment Live' }

  const diffMs = startAt.getTime() - now.getTime()
  const minutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)))
  const startDay = getDayStart(startAt)
  const currentDay = getDayStart(now)
  const calendarDays = Math.round((startDay.getTime() - currentDay.getTime()) / (24 * 60 * 60 * 1000))

  if (calendarDays >= 1) {
    return { type: 'upcoming', label: `${calendarDays} ${calendarDays === 1 ? 'day' : 'days'} to go` }
  }

  if (minutes > 5 && minutes >= 60) {
    const hours = Math.max(1, Math.floor(minutes / 60))
    return { type: 'upcoming', label: `${hours} ${hours === 1 ? 'hour' : 'hours'} to go` }
  }

  return { type: 'upcoming', label: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to go` }
}

const getPublishedLogRows = (assessment) => {
  if (Array.isArray(assessment?.publishedLog) && assessment.publishedLog.length) return assessment.publishedLog

  return [{
    facultyId: assessment?.facultyId || assessment?.setup?.facultyId || 'MC2568',
    facultyName: assessment?.facultyName || assessment?.setup?.facultyName || 'Karthik Subramanian',
    remarks: assessment?.publishedAt ? 'Assessment published' : 'Published log not available',
    timestamp: assessment?.publishedAt || assessment?.createdAt || '',
  }]
}

export default function AssessmentCreatePage({ onNavigate }) {
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const [publishedAssessments, setPublishedAssessments] = useState(readPublishedAssessments)
  const [selectedPublishedLogAssessment, setSelectedPublishedLogAssessment] = useState(null)
  const [publishedLogPage, setPublishedLogPage] = useState(1)
  const [scheduleNow, setScheduleNow] = useState(() => new Date())
  const [activeAssessmentTab, setActiveAssessmentTab] = useState(() => {
    const requestedTab = window.localStorage.getItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    window.localStorage.removeItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    if (requestedTab === 'published' && readPublishedAssessments().length) return 'published'
    return readAssessmentDrafts().length ? 'draft' : readPublishedAssessments().length ? 'published' : ''
  })
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft'
      ? { ...metric, count: draftAssessments.length }
      : metric.tone === 'published'
        ? { ...metric, count: publishedAssessments.length }
        : metric
  ))

  useEffect(() => {
    if (activeAssessmentTab !== 'published') return undefined

    setScheduleNow(new Date())
    const intervalId = window.setInterval(() => setScheduleNow(new Date()), 10000)
    return () => window.clearInterval(intervalId)
  }, [activeAssessmentTab])

  const createAssessment = () => {
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...initialForm,
      assessmentId: `assessment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'create')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const continueDraftAssessment = (draft) => {
    if (!draft?.setup) return
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...draft.setup,
      sourceDraftId: draft.id,
      sourceDraftName: draft.assessmentName || draft.setup?.assessmentName || 'Untitled Assessment',
    }))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deleteDraftAssessment = (draftId) => {
    setDraftAssessments((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== draftId)
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
      if (!nextDrafts.length && activeAssessmentTab === 'draft') {
        setActiveAssessmentTab('')
      }
      return nextDrafts
    })
  }

  const editPublishedAssessment = (assessment) => {
    if (!assessment?.setup) return
    const editedAt = new Date().toISOString()
    const nextAssessment = {
      ...assessment,
      publishedLog: [
        {
          facultyId: assessment.facultyId || assessment.setup?.facultyId || 'MC2568',
          facultyName: assessment.facultyName || assessment.setup?.facultyName || 'Karthik Subramanian',
          remarks: 'Assessment opened for edit',
          timestamp: editedAt,
        },
        ...getPublishedLogRows(assessment),
      ],
    }
    setPublishedAssessments((current) => {
      const nextPublished = current.map((item) => (item.id === assessment.id ? nextAssessment : item))
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      return nextPublished
    })
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...assessment.setup,
      sourcePublishedId: assessment.id,
      sourcePublishedName: assessment.assessmentName || assessment.setup?.assessmentName || 'Untitled Assessment',
      isPublishedEdit: true,
    }))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'configuration')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deletePublishedAssessment = (assessmentId) => {
    setPublishedAssessments((current) => {
      const nextPublished = current.filter((assessment) => assessment.id !== assessmentId)
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      setSelectedPublishedLogAssessment((selected) => (selected?.id === assessmentId ? null : selected))
      if (!nextPublished.length && activeAssessmentTab === 'published') {
        setActiveAssessmentTab(draftAssessments.length ? 'draft' : '')
      }
      return nextPublished
    })
  }

  return (
    <section className="vx-content assessment-page assessment-create-tracker-page">
      <div className={`assessment-page-shell assessment-create-page-shell ${activeAssessmentTab === 'draft' ? 'is-draft-tab' : ''}`}>
        <div className="assessment-create-page-header">
          <PageNavigationHeader items={['My Pages', 'Assessment', 'My Progress']} />
          <button
            type="button"
            className={`assessment-create-new-btn ${activeAssessmentTab === 'create' ? 'is-active' : ''}`}
            onClick={createAssessment}
          >
            <Plus size={17} strokeWidth={2.4} />
            Create Assessment
          </button>
        </div>

        <section className="assessment-create-toolbar" aria-label="Assessment create actions">
          <div className="assessment-create-metrics" aria-label="Assessment create metrics">
            {metrics.map((metric) => {
              const Icon = metric.icon
              const isDisabledMetric = metric.count <= 0
              const isActiveMetric = activeAssessmentTab === metric.tone && !isDisabledMetric

              return (
                <button
                  key={metric.label}
                  type="button"
                  className={`assessment-create-metric is-${metric.tone} ${isActiveMetric ? 'is-active' : ''}`}
                  onClick={() => {
                    if (isDisabledMetric) return
                    setActiveAssessmentTab(metric.tone)
                  }}
                  disabled={isDisabledMetric}
                  aria-disabled={isDisabledMetric}
                >
                  <span className="assessment-create-metric-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="assessment-create-metric-copy">
                    <strong>{metric.count}</strong>
                    <span>{metric.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {activeAssessmentTab === 'draft' ? (
          <section className="assessment-create-draft-shell" aria-label="Draft assessments">
            <div className="assessment-create-card-heading">
              <h2>Draft Assessment</h2>
            </div>
            {draftAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {draftAssessments.map((draft) => {
                  const assessmentName = getDraftValue(draft, 'assessmentName') || 'Untitled Assessment'
                  const examCategory = getDraftValue(draft, 'examCategory') || 'Assessment'
                  const academicYear = getDraftValue(draft, 'academicYear') || '-'
                  const course = String(getDraftValue(draft, 'course', 'assignCourse') || '-')
                    .replace(/\s*\(NMC Syllabus\)\s*/i, '')
                    .trim() || '-'
                  const year = getDraftValue(draft, 'year', 'assignYear')
                  const savedAt = getDraftValue(draft, 'updatedAt', 'savedAt', 'createdAt')
                  const draftSummary = getDraftSummary(draft)
                  const questionCount = draftSummary.questionCount
                  const totalMarks = draftSummary.totalMarks

                  return (
                    <article key={draft.id} className="assessment-create-draft-card">
                      <div className="assessment-create-draft-profile">
                        <div>
                        <strong>{assessmentName}</strong>
                        <span className="assessment-create-draft-category">{examCategory}</span>
                        <span>{questionCount} Questions | {totalMarks} Marks</span>
                        </div>
                        <button
                          type="button"
                          className="assessment-create-draft-delete"
                          onClick={() => deleteDraftAssessment(draft.id)}
                          aria-label={`Delete ${assessmentName}`}
                        >
                          <Trash2 size={15} strokeWidth={2.1} />
                        </button>
                      </div>
                      <div className="assessment-create-draft-stats" aria-label="Draft summary">
                        <span>
                          <strong>{questionCount}</strong>
                          <em>Questions</em>
                        </span>
                        <span>
                          <strong>{totalMarks}</strong>
                          <em>Total Marks</em>
                        </span>
                        <span>
                          <strong>{formatYearLabel(year)}</strong>
                          <em>Year</em>
                        </span>
                      </div>
                      <div className="assessment-create-draft-chips">
                        <span>{academicYear}</span>
                        <span>{course}</span>
                      </div>
                      <div className="assessment-create-draft-footer">
                        <span>{formatDraftSavedDate(savedAt)}</span>
                        <button type="button" onClick={() => continueDraftAssessment(draft)}>
                          Continue
                          <ArrowRight size={14} strokeWidth={2.3} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No draft assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {activeAssessmentTab === 'published' ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Published assessments">
            <div className="assessment-create-card-heading">
              <h2>Published Assessment</h2>
            </div>
            {publishedAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {publishedAssessments.map((assessment) => {
                  const isPracticeExam = String(assessment.supervisionType || '').toLowerCase().includes('practice')
                  const isOfflineExam = String(assessment.examMode || '').toLowerCase() === 'offline'
                  const SupervisionIcon = isPracticeExam ? EyeOff : Monitor
                  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
                  const publishedQuestionRows = getPublishedQuestionRows(assessment)

                  return (
                      <article key={assessment.id} className="assessment-create-draft-card assessment-create-published-card">
                        <div className="assessment-create-published-head">
                          <div>
                            <strong>{assessment.assessmentName || 'Untitled Assessment'}</strong>
                            <small>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</small>
                      </div>
                      <span className="assessment-create-published-actions">
                        <button type="button" className="assessment-create-published-icon-btn is-delete" onClick={() => deletePublishedAssessment(assessment.id)} aria-label={`Delete ${assessment.assessmentName || 'published assessment'}`}>
                          <Trash2 size={13} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="assessment-create-published-info"
                          onClick={() => {
                            setSelectedPublishedLogAssessment(assessment)
                            setPublishedLogPage(1)
                          }}
                          title="Published assessment details"
                          aria-label={`View published log for ${assessment.assessmentName || 'published assessment'}`}
                        >
                          <Info size={14} strokeWidth={2.2} />
                        </button>
                        <button type="button" className="assessment-create-published-icon-btn is-edit" onClick={() => editPublishedAssessment(assessment)} aria-label={`Edit ${assessment.assessmentName || 'published assessment'}`}>
                          <Pencil size={13} strokeWidth={2.2} />
                        </button>
                      </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <span className={`assessment-create-published-status is-${String(assessment.examMode || '').toLowerCase() === 'offline' ? 'offline' : 'online'}`}>
                            {assessment.examMode || '-'}
                          </span>
                          {!isOfflineExam ? (
                            <span className={`assessment-create-published-supervision ${isPracticeExam ? 'is-practice' : 'is-proctored'}`}>
                              <SupervisionIcon size={13} strokeWidth={2.3} />
                              {assessment.supervisionType || '-'}
                            </span>
                          ) : publishedQuestionRows.length ? (
                            <button type="button" className="assessment-create-published-download-btn" onClick={() => downloadQuestionPaperPdf(assessment)}>
                              <Download size={12} strokeWidth={2.4} />
                              Download PDF
                            </button>
                          ) : null}
                        </span>
                        <div className="assessment-create-published-details" aria-label="Published assessment details">
                          <span><strong>{formatDisplayDate(assessment.startDate)}</strong><em>Start Date</em></span>
                          <span><strong>{assessment.startTime || '-'}</strong><em>Start Time</em></span>
                          <span><strong>{assessment.totalDuration || '-'}</strong><em>Total Duration</em></span>
                          <span><strong>{formatDisplayDate(assessment.endDate)}</strong><em>End Date</em></span>
                          <span><strong>{assessment.totalMarks ?? '-'}</strong><em>Total Marks</em></span>
                          <span><strong>{assessment.examType || '-'}</strong><em>Exam Type</em></span>
                        </div>
                        <div className="assessment-create-draft-footer assessment-create-published-footer">
                          {scheduleStatus ? (
                            scheduleStatus.type === 'upcoming' ? (
                              <span>{scheduleStatus.label}</span>
                            ) : (
                              <span className={`assessment-create-published-schedule-badge is-${scheduleStatus.type}`}>
                                {scheduleStatus.label}
                              </span>
                            )
                          ) : null}
                        </div>
                      </article>
                    )
                })}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No published assessments available.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
      {selectedPublishedLogAssessment ? createPortal((() => {
        const publishedLogRows = getPublishedLogRows(selectedPublishedLogAssessment)
        const totalPublishedLogPages = Math.max(1, Math.ceil(publishedLogRows.length / PUBLISHED_LOG_PAGE_SIZE))
        const currentPublishedLogPage = Math.min(publishedLogPage, totalPublishedLogPages)
        const pagedPublishedLogRows = publishedLogRows.slice(
          (currentPublishedLogPage - 1) * PUBLISHED_LOG_PAGE_SIZE,
          currentPublishedLogPage * PUBLISHED_LOG_PAGE_SIZE,
        )

        return (
        <div className="assessment-create-log-modal-backdrop" role="presentation" onClick={() => setSelectedPublishedLogAssessment(null)}>
          <section className="assessment-create-log-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-create-log-title" onClick={(event) => event.stopPropagation()}>
            <div className="assessment-create-log-modal-head">
              <div>
                <h3 id="assessment-create-log-title">Published Log Details</h3>
                <span>{selectedPublishedLogAssessment.assessmentName || 'Untitled Assessment'}</span>
              </div>
              <button type="button" className="assessment-create-log-close" onClick={() => setSelectedPublishedLogAssessment(null)} aria-label="Close published log details">
                <X size={15} strokeWidth={2.3} />
              </button>
            </div>
            <div className="assessment-create-log-table-shell">
              <div className="assessment-create-log-grid" role="table" aria-label="Published log details">
                <div className="assessment-create-log-grid-head" role="row">
                  <span role="columnheader">Faculty ID</span>
                  <span role="columnheader">Faculty Name</span>
                  <span role="columnheader">Remarks</span>
                  <span role="columnheader">Date & Time Stamp</span>
                </div>
                {pagedPublishedLogRows.map((item, index) => (
                  <div className="assessment-create-log-grid-row" role="row" key={`${item.timestamp || 'log'}-${index}`}>
                    <span role="cell">{item.facultyId || '-'}</span>
                    <span role="cell">{item.facultyName || '-'}</span>
                    <span role="cell">{item.remarks || '-'}</span>
                    <span role="cell">{formatDisplayDateTime(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="assessment-create-log-pagination" aria-label="Published log pagination">
              <span>
                Page {currentPublishedLogPage} of {totalPublishedLogPages}
                {' '}| Showing {pagedPublishedLogRows.length} of {publishedLogRows.length}
              </span>
              <div>
                <button type="button" onClick={() => setPublishedLogPage((page) => Math.max(1, page - 1))} disabled={currentPublishedLogPage <= 1}>
                  Previous
                </button>
                <button type="button" onClick={() => setPublishedLogPage((page) => Math.min(totalPublishedLogPages, page + 1))} disabled={currentPublishedLogPage >= totalPublishedLogPages}>
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
        )
      })(), document.body) : null}
    </section>
  )
}
