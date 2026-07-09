import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, BadgeCheck, ClipboardCheck, Clock3, Download, EyeOff, FileWarning, FolderPlus, Info, ListFilter, Monitor, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
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
  {
    label: 'Evaluation',
    count: 0,
    icon: ClipboardCheck,
    tone: 'evaluation',
  },
  {
    label: 'Results',
    count: 0,
    icon: BadgeCheck,
    tone: 'results',
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
const ONLINE_PRACTICE_EXAM_STORAGE_KEY = 'vx-online-practice-exam-assessment'
const ONLINE_PROCTORED_EXAM_STORAGE_KEY = 'vx-online-proctored-exam-assessment'
const EXAM_CONTROLS_ASSESSMENT_KEY = 'vx-exam-controls-assessment'
const EXAM_CONTROLS_STATE_KEY = 'vx-exam-controls-state'
const ASSESSMENT_EVALUATION_SELECTED_KEY = 'vx-assessment-evaluation-selected'
const ASSESSMENT_PUBLISHED_CHANGED_EVENT = 'vx-assessment-published-changed'
const PUBLISHED_LOG_PAGE_SIZE = 5
const PUBLISHED_ACTION_VERIFICATION_CODE = '1234'
const PUBLISHED_FILTER_DEFAULTS = {
  mode: 'all',
  status: 'all',
  supervision: 'all',
  examType: 'all',
}
const PUBLISHED_FILTER_GROUPS = [
  {
    key: 'mode',
    label: 'Exam Mode',
    options: [
      { value: 'all', label: 'All Modes' },
      { value: 'online', label: 'Online' },
      { value: 'offline', label: 'Offline' },
    ],
  },
  {
    key: 'status',
    label: 'Exam Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'live', label: 'Live' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'supervision',
    label: 'Supervision Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'practice', label: 'Practice Exam' },
      { value: 'proctored', label: 'Proctored Exam' },
    ],
  },
  {
    key: 'examType',
    label: 'Exam Type',
    options: [
      { value: 'all', label: 'All Exam Types' },
      { value: 'mcq', label: 'MCQ' },
      { value: 'descriptive', label: 'Descriptive' },
      { value: 'hybrid', label: 'Hybrid' },
    ],
  },
]

const formatSupervisionTypeLabel = (value) => (
  value === 'Proctored Exams' ? 'Proctored Exam' : value
)

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const stripHtml = (value) => String(value ?? '')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .trim()

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

const isSameAssessmentRecord = (first, second) => {
  if (!first || !second) return false
  if (first.id && second.id) return first.id === second.id

  return (
    first.assessmentName === second.assessmentName
    && first.startDate === second.startDate
    && first.startTime === second.startTime
  )
}

const clearDeletedAssessmentSessionRecords = (deletedAssessment) => {
  if (!deletedAssessment) return

  ;[ONLINE_PRACTICE_EXAM_STORAGE_KEY, ONLINE_PROCTORED_EXAM_STORAGE_KEY].forEach((storageKey) => {
    try {
      const selectedAssessment = JSON.parse(window.sessionStorage.getItem(storageKey) || 'null')
      if (isSameAssessmentRecord(deletedAssessment, selectedAssessment)) {
        window.sessionStorage.removeItem(storageKey)
      }
    } catch {
      // Session cleanup should not block deleting the published assessment.
    }
  })
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
    const storedRows = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(draft?.setup ?? draft)) || '[]')
    if (Array.isArray(storedRows) && storedRows.length) return storedRows
    return Array.isArray(draft?.questionRows) ? draft.questionRows : []
  } catch {
    return Array.isArray(draft?.questionRows) ? draft.questionRows : []
  }
}

const restoreAssessmentQuestionsForCreate = (setup = {}, questionRows = []) => {
  if (!setup || !Array.isArray(questionRows) || !questionRows.length) return

  try {
    window.localStorage.setItem(getAssessmentQuestionsStorageKey(setup), JSON.stringify(questionRows))
  } catch {
    // Navigation should still continue if browser storage is full.
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

const PDF_SECTION_ORDER = ['MCQ', 'SAQs', 'MEQs', 'LAQs', 'Reasoning']
const PDF_ROMAN_NUMERALS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.']

const loadPdfImage = (imageUrl) => new Promise((resolve) => {
  if (!imageUrl) {
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
  image.src = imageUrl
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
  const logoImage = await loadPdfImage(setup.logoPreview)
  const questionImages = await Promise.all(questions.map(async (question) => {
    const images = Array.isArray(question?.images) ? question.images : []
    const loadedImages = await Promise.all(images.map((image) => loadPdfImage(image?.url)))
    return loadedImages.filter(Boolean).slice(0, 4)
  }))
  const questionImageMap = new Map(questions.map((question, index) => [question, questionImages[index] || []]))
  const marksSummary = getPdfMarksSummary(questions)
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 28
  const contentWidth = pageWidth - (margin * 2)
  const pages = []
  const pdfImages = []
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
  const getImageDrawSize = (image, maxWidth, maxHeight) => {
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
    return {
      width: image.width * scale,
      height: image.height * scale,
    }
  }
  const addPdfImage = ({ image, x, maxWidth, maxHeight }) => {
    const size = getImageDrawSize(image, maxWidth, maxHeight)
    ensureSpace(size.height + 8)
    const name = `Im${pdfImages.length + 1}`
    pdfImages.push({ ...image, name })
    addCommand(`q ${size.width.toFixed(2)} 0 0 ${size.height.toFixed(2)} ${x.toFixed(2)} ${(y - size.height).toFixed(2)} cm /${name} Do Q`)
    y -= size.height + 8
  }
  const addQuestionImages = (item) => {
    const images = questionImageMap.get(item) || []
    if (!images.length) return

    y -= 2
    const imageGap = 8
    const columns = images.length
    const availableWidth = contentWidth - 64
    const imageBoxWidth = Math.max(72, (availableWidth - (imageGap * (columns - 1))) / columns)
    const imageBoxHeight = Math.min(112, imageBoxWidth * 0.75)
    ensureSpace(imageBoxHeight + 10)
    images.forEach((image, index) => {
      const imageX = margin + 32 + (index * (imageBoxWidth + imageGap))
      const name = `Im${pdfImages.length + 1}`
      pdfImages.push({ ...image, name })
      addCommand(`q ${imageBoxWidth.toFixed(2)} 0 0 ${imageBoxHeight.toFixed(2)} ${imageX.toFixed(2)} ${(y - imageBoxHeight).toFixed(2)} cm /${name} Do Q`)
    })
    y -= imageBoxHeight + 10
  }
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
  const addMarksLine = (marks) => {
    ensureSpace(14)
    y -= 1
    addRightText({ text: `[${String(marks).padStart(2, '0')} Marks]`, x: pageWidth - margin - 12, y, size: 12 })
    y -= 12
  }
  const getWrappedTextHeight = (text, maxLength, lineHeight) => wrapPdfText(text, maxLength).length * lineHeight
  const getQuestionBlockHeight = (item, displayNumber) => {
    const isDescriptive = isDescriptiveQuestionType(item?.type)
    const questionHeight = getWrappedTextHeight(`${displayNumber}. ${getPdfQuestionText(item)}`, 103, 13)
    const imageHeight = (questionImageMap.get(item) || []).length ? 130 : 0

    if (!isDescriptive) {
      const options = (item.options ?? []).map(getPdfOptionText).filter(Boolean)
      const optionHeight = options.reduce((total, option, optionIndex) => {
        if (optionIndex % 2 !== 0) return total
        const leftLines = wrapPdfText(`${String.fromCharCode(65 + optionIndex)}. ${option}`, 42).length
        const rightOption = options[optionIndex + 1]
        const rightLines = rightOption ? wrapPdfText(`${String.fromCharCode(66 + optionIndex)}. ${rightOption}`, 42).length : 1
        return total + (Math.max(leftLines, rightLines) * 13) + 4
      }, 0)
      return questionHeight + imageHeight + 4 + optionHeight + 8
    }

    const sections = Array.isArray(item.descriptiveSections) ? item.descriptiveSections : []
    const sectionHeight = sections.reduce((total, section, sectionIndex) => {
      const sectionLabel = `${PDF_ROMAN_NUMERALS[sectionIndex]?.replace('.', '').toLowerCase() || sectionIndex + 1}.`
      const ownHeight = getWrappedTextHeight(`${sectionLabel} ${stripHtml(section.questionText) || 'Sub question'}`, 88, 13)
      const childHeight = (section.children ?? []).reduce((childTotal, child, childIndex) => (
        childTotal
        + getWrappedTextHeight(`${String.fromCharCode(97 + childIndex)}. ${stripHtml(child.questionText) || 'Inside question'}`, 84, 13)
        + (parseMarksValue(child.marks) ? 13 : 0)
      ), 0)
      return total + ownHeight + childHeight + (!(section.children ?? []).length && parseMarksValue(section.marks) ? 13 : 0)
    }, 0)

    return questionHeight + imageHeight + 5 + sectionHeight + (sections.length * 3) + (!sections.length && getQuestionMarksTotal(item) ? 13 : 0) + 10
  }

  const hasLogo = Boolean(logoImage)
  const logoBoxX = margin + 6
  const logoBoxY = pageHeight - 94
  const logoMaxSize = 56
  const headerCenterX = pageWidth / 2

  if (logoImage) {
    const logoSize = getImageDrawSize(logoImage, logoMaxSize, logoMaxSize)
    const logoName = `Im${pdfImages.length + 1}`
    pdfImages.push({ ...logoImage, name: logoName })
    addCommand(`q ${logoSize.width.toFixed(2)} 0 0 ${logoSize.height.toFixed(2)} ${logoBoxX.toFixed(2)} ${(logoBoxY + ((logoMaxSize - logoSize.height) / 2)).toFixed(2)} cm /${logoName} Do Q`)
  }
  addCenteredTextInBox({ text: setup.collegeName || '[Select College Name]', centerX: headerCenterX, y: pageHeight - 48, size: 15, font: 'F2' })
  addCenteredTextInBox({ text: `Academic Year ${String(setup.academicYear || '2025 - 2026').replace(/\s*-\s*/g, '-')}`, centerX: headerCenterX, y: pageHeight - 68, size: 12, font: 'F3' })
  addCenteredTextInBox({ text: assessment?.assessmentName || '[Assessment Name]', centerX: headerCenterX, y: pageHeight - 90, size: 15, font: 'F2' })
  addCenteredTextInBox({ text: `${assessment?.examCategory || '[Exam Category]'} / ${assessment?.assignTo || setup.assignYear || setup.year || '[Year]'}`, centerX: headerCenterX, y: pageHeight - 109, size: 12, font: 'F2' })
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
      addQuestionImages(item)
      questionNumber += 1

      if (!isDescriptive) {
        y -= 4
        const options = (item.options ?? []).map(getPdfOptionText).filter(Boolean)
        for (let optionIndex = 0; optionIndex < options.length; optionIndex += 2) {
          const leftOption = `${String.fromCharCode(65 + optionIndex)}. ${options[optionIndex]}`
          const rightOption = options[optionIndex + 1] ? `${String.fromCharCode(66 + optionIndex)}. ${options[optionIndex + 1]}` : ''
          const leftLines = wrapPdfText(leftOption, 42)
          const rightLines = rightOption ? wrapPdfText(rightOption, 42) : []
          const rowLineCount = Math.max(leftLines.length, rightLines.length, 1)
          ensureSpace((rowLineCount * 13) + 4)
          leftLines.forEach((line, lineIndex) => {
            addText({ text: line, x: margin + 32 + (lineIndex ? 12 : 0), y: y - (lineIndex * 13), size: 12 })
          })
          rightLines.forEach((line, lineIndex) => {
            addText({ text: line, x: margin + 286 + (lineIndex ? 12 : 0), y: y - (lineIndex * 13), size: 12 })
          })
          y -= (rowLineCount * 13) + 4
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
              addMarksLine(child.marks)
            }
          })
          if (!(section.children ?? []).length && parseMarksValue(section.marks)) {
            addMarksLine(section.marks)
          }
        })
        if (!sections.length && questionMarks) {
          addMarksLine(questionMarks)
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
  const imageStartObjectNumber = fontStartObjectNumber + 3
  const imageResource = pdfImages.length
    ? ` /XObject << ${pdfImages.map((image, index) => `/${image.name} ${imageStartObjectNumber + index} 0 R`).join(' ')} >>`
    : ''

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
  const match = String(value || '').trim().match(/^(\d+)(?::(\d{2}))?$/)
  if (!match) return 0
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  return ((hours * 60) + minutes) * 60 * 1000
}

const formatAssessmentRemainingTime = (value) => {
  const totalSeconds = Math.max(0, Math.floor((value || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (item) => String(item).padStart(2, '0')

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
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
  if (now >= startAt) return { type: 'live', label: 'Assessment Live', remainingMs: endAt.getTime() - now.getTime() }

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

const splitPublishedAssessmentRows = (rows = [], now = new Date()) => {
  const published = []
  const evaluation = []
  const results = []

  rows.forEach((assessment) => {
    if (getPublishedAssessmentScheduleStatus(assessment, now)?.type === 'completed') {
      evaluation.push(assessment)
    } else {
      published.push(assessment)
    }
  })

  return { published, evaluation, results }
}

const isPublishedAssessmentActionLocked = (assessment, now = new Date()) => {
  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, now)
  if (['live', 'completed'].includes(scheduleStatus?.type)) return true

  const startDate = parseAssessmentDate(assessment?.startDate)
  if (!startDate) return false

  const startAt = applyAssessmentTime(startDate, assessment?.startTime)
  if (!startAt || Number.isNaN(startAt.getTime())) return false

  const lockAt = new Date(startAt.getTime() - 5 * 60 * 1000)
  return now >= lockAt
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

const getAssessmentControlId = (assessment) => (
  assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
)

const readExamControlLogRows = (assessment) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${EXAM_CONTROLS_STATE_KEY}:${getAssessmentControlId(assessment)}`) || 'null')
    if (!parsed || typeof parsed !== 'object') return []

    return Object.entries(parsed).flatMap(([studentId, state]) => (
      Array.isArray(state?.logs)
        ? state.logs.map((log, index) => ({
            ...log,
            id: log.id || `${studentId}-${index}`,
            studentId,
          }))
        : []
    ))
  } catch {
    return []
  }
}

export default function AssessmentCreatePage({ onNavigate }) {
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const [publishedAssessments, setPublishedAssessments] = useState(readPublishedAssessments)
  const [selectedPublishedLogAssessment, setSelectedPublishedLogAssessment] = useState(null)
  const [publishedLogPage, setPublishedLogPage] = useState(1)
  const [scheduleNow, setScheduleNow] = useState(() => new Date())
  const [publishedSearchValue, setPublishedSearchValue] = useState('')
  const [publishedFilters, setPublishedFilters] = useState(PUBLISHED_FILTER_DEFAULTS)
  const [isPublishedFilterOpen, setIsPublishedFilterOpen] = useState(false)
  const [publishedActionModal, setPublishedActionModal] = useState(null)
  const [publishedLogActiveTab, setPublishedLogActiveTab] = useState('exam')
  const [activeAssessmentTab, setActiveAssessmentTab] = useState(() => {
    const requestedTab = window.localStorage.getItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    window.localStorage.removeItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY)
    const rows = readPublishedAssessments()
    const drafts = readAssessmentDrafts()
    if (requestedTab === 'evaluation') return 'evaluation'
    if (requestedTab === 'results') return 'results'
    if (requestedTab === 'published') return 'published'
    return drafts.length ? 'draft' : rows.length ? 'published' : 'draft'
  })
  const { published: activePublishedAssessments, evaluation: evaluationAssessments, results: resultAssessments } = splitPublishedAssessmentRows(publishedAssessments, scheduleNow)
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft'
      ? { ...metric, count: draftAssessments.length }
      : metric.tone === 'published'
        ? { ...metric, count: activePublishedAssessments.length }
        : metric.tone === 'evaluation'
          ? { ...metric, count: evaluationAssessments.length }
          : metric.tone === 'results'
            ? { ...metric, count: resultAssessments.length }
          : metric
  ))
  const assessmentTabItems = metrics.map((metric) => ({
      key: metric.tone,
      label: metric.tone === 'pending'
        ? 'Pending'
        : metric.label.replace(' Assessment', '').replace('Approval ', ''),
      count: metric.count,
      icon: metric.icon,
    }))
  const shouldShowDraftAssessments = activeAssessmentTab === 'draft'
  const shouldShowPublishedAssessments = activeAssessmentTab === 'published'
  const shouldShowEvaluationAssessments = activeAssessmentTab === 'evaluation'
  const shouldShowResultAssessments = activeAssessmentTab === 'results'
  const activeEmptyTab = !['draft', 'published', 'evaluation', 'results'].includes(activeAssessmentTab)
    ? assessmentTabItems.find((item) => item.key === activeAssessmentTab)
    : null
  const activeTabLabel = assessmentTabItems.find((item) => item.key === activeAssessmentTab)?.label || 'Assessment'
  const livePublishedAssessmentCount = activePublishedAssessments.filter((assessment) => (
    getPublishedAssessmentScheduleStatus(assessment, scheduleNow)?.type === 'live'
  )).length
  const activePublishedFilterCount = Object.values(publishedFilters).filter((value) => value !== 'all').length
  const hasPublishedFilter = activePublishedFilterCount > 0
  const hasPublishedSearch = Boolean(publishedSearchValue.trim())
  const filteredDraftAssessments = draftAssessments.filter((draft) => {
    const searchText = [
      getDraftValue(draft, 'assessmentName'),
      getDraftValue(draft, 'examCategory'),
      getDraftValue(draft, 'academicYear'),
      getDraftValue(draft, 'course', 'assignCourse'),
      getDraftValue(draft, 'year', 'assignYear'),
      getDraftValue(draft, 'updatedAt', 'savedAt', 'createdAt'),
    ].filter(Boolean).join(' ').toLowerCase()

    return !hasPublishedSearch || searchText.includes(publishedSearchValue.trim().toLowerCase())
  })
  const filterAssessmentCards = (assessments) => assessments.filter((assessment) => {
    const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
    const searchText = [
      assessment.assessmentName,
      assessment.examCategory,
      assessment.assignTo,
      assessment.examMode,
      assessment.examType,
      assessment.supervisionType,
      assessment.startDate,
      formatDisplayDate(assessment.startDate),
      assessment.startTime,
    ].filter(Boolean).join(' ').toLowerCase()
    const searchMatches = !hasPublishedSearch || searchText.includes(publishedSearchValue.trim().toLowerCase())

    const mode = String(assessment.examMode || '').toLowerCase()
    const examType = String(assessment.examType || '').toLowerCase()
    const supervisionType = String(assessment.supervisionType || '').toLowerCase()

    return (
      searchMatches
      && (publishedFilters.mode === 'all' || mode === publishedFilters.mode)
      && (publishedFilters.status === 'all' || scheduleStatus?.type === publishedFilters.status)
      && (publishedFilters.supervision === 'all' || supervisionType.includes(publishedFilters.supervision))
      && (publishedFilters.examType === 'all' || examType === publishedFilters.examType)
    )
  })
  const filteredPublishedAssessments = filterAssessmentCards(activePublishedAssessments)
  const filteredEvaluationAssessments = filterAssessmentCards(evaluationAssessments)

  const clearPublishedSearchFilters = () => {
    setPublishedSearchValue('')
    setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)
    setIsPublishedFilterOpen(false)
  }

  const handleAssessmentTabChange = (tabKey) => {
    setActiveAssessmentTab(tabKey)
  }

  const renderAssessmentSearchToolbar = () => (
    <div className="assessment-create-published-toolbar assessment-create-tracker-toolbar">
      <label className="assessment-create-published-search">
        <Search size={15} strokeWidth={2.2} aria-hidden="true" />
        <input
          type="search"
          value={publishedSearchValue}
          placeholder={`Search ${activeTabLabel.toLowerCase()} assessments...`}
          onChange={(event) => setPublishedSearchValue(event.target.value)}
        />
      </label>
      <span className="assessment-create-published-filter-wrap">
        <button
          type="button"
          className={`assessment-create-published-filter-btn ${hasPublishedFilter ? 'is-active' : ''}`.trim()}
          onClick={() => setIsPublishedFilterOpen((current) => !current)}
          aria-expanded={isPublishedFilterOpen}
        >
          <ListFilter size={15} strokeWidth={2.3} />
          Filter
          {hasPublishedFilter ? <em>{activePublishedFilterCount}</em> : null}
        </button>
        {isPublishedFilterOpen ? (
          <span className="assessment-create-published-filter-popover" role="dialog" aria-label="Assessment filters">
            {PUBLISHED_FILTER_GROUPS.map((group) => (
              <label key={group.key}>
                <span>{group.label}</span>
                <select
                  value={publishedFilters[group.key]}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setPublishedFilters((current) => ({ ...current, [group.key]: nextValue }))
                  }}
                >
                  {group.options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ))}
            <span className="assessment-create-published-filter-actions">
              <button type="button" onClick={() => setPublishedFilters(PUBLISHED_FILTER_DEFAULTS)}>
                Reset
              </button>
              <button type="button" className="is-primary" onClick={() => setIsPublishedFilterOpen(false)}>
                Apply
              </button>
            </span>
          </span>
        ) : null}
      </span>
      {(hasPublishedSearch || hasPublishedFilter) ? (
        <button type="button" className="assessment-create-published-clear-btn" onClick={clearPublishedSearchFilters}>
          <X size={14} strokeWidth={2.3} />
          Clear
        </button>
      ) : null}
    </div>
  )

  useEffect(() => {
    if (activeAssessmentTab !== 'published') return undefined

    setScheduleNow(new Date())
    const intervalId = window.setInterval(() => setScheduleNow(new Date()), 1000)
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
    const nextSetup = {
      ...draft.setup,
      sourceDraftId: draft.id,
      sourceDraftName: draft.assessmentName || draft.setup?.assessmentName || 'Untitled Assessment',
    }
    restoreAssessmentQuestionsForCreate(nextSetup, readDraftQuestions(draft))
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deleteDraftAssessment = (draftId) => {
    setDraftAssessments((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== draftId)
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
      if (!nextDrafts.length && activeAssessmentTab === 'draft') {
        setActiveAssessmentTab(publishedAssessments.length ? 'published' : 'draft')
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
    const nextSetup = {
      ...assessment.setup,
      sourcePublishedId: assessment.id,
      sourcePublishedName: assessment.assessmentName || assessment.setup?.assessmentName || 'Untitled Assessment',
      isPublishedEdit: true,
    }
    restoreAssessmentQuestionsForCreate(nextSetup, getPublishedQuestionRows(assessment))
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(nextSetup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'configuration')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deletePublishedAssessment = (assessmentId) => {
    setPublishedAssessments((current) => {
      const deletedAssessment = current.find((assessment) => assessment.id === assessmentId)
      const nextPublished = current.filter((assessment) => assessment.id !== assessmentId)
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      clearDeletedAssessmentSessionRecords(deletedAssessment)
      window.dispatchEvent(new CustomEvent(ASSESSMENT_PUBLISHED_CHANGED_EVENT))
      setSelectedPublishedLogAssessment((selected) => (selected?.id === assessmentId ? null : selected))
      if (!nextPublished.length && activeAssessmentTab === 'published') {
        setActiveAssessmentTab(draftAssessments.length ? 'draft' : 'published')
      }
      return nextPublished
    })
  }

  const openPublishedActionModal = (action, assessment) => {
    setPublishedActionModal({
      action,
      assessment,
      step: 'confirm',
      method: 'password',
      value: '',
      error: '',
    })
  }

  const closePublishedActionModal = () => {
    setPublishedActionModal(null)
  }

  const continuePublishedActionVerification = () => {
    setPublishedActionModal((current) => (
      current ? { ...current, step: 'verify', method: 'password', value: '', error: '' } : current
    ))
  }

  const updatePublishedActionVerification = (updates) => {
    setPublishedActionModal((current) => (
      current ? { ...current, ...updates, error: '' } : current
    ))
  }

  const submitPublishedActionVerification = (event) => {
    event.preventDefault()
    if (!publishedActionModal?.assessment) return

    const enteredValue = String(publishedActionModal.value || '').trim()
    if (enteredValue !== PUBLISHED_ACTION_VERIFICATION_CODE) {
      setPublishedActionModal((current) => (
        current
          ? {
              ...current,
              error: current.method === 'otp' ? 'Invalid OTP' : 'Invalid Password',
            }
          : current
      ))
      return
    }

    const { action, assessment } = publishedActionModal
    setPublishedActionModal(null)
    if (action === 'edit') {
      editPublishedAssessment(assessment)
      return
    }
    deletePublishedAssessment(assessment.id)
  }

  const openExamControls = (assessment) => {
    window.sessionStorage.setItem(EXAM_CONTROLS_ASSESSMENT_KEY, JSON.stringify(assessment))
    onNavigate?.(APP_PAGES.EXAM_CONTROLS)
  }

  const startAssessmentEvaluation = (assessment) => {
    window.sessionStorage.setItem(ASSESSMENT_EVALUATION_SELECTED_KEY, JSON.stringify(assessment))
    onNavigate?.(APP_PAGES.ASSESSMENT_EVALUATION)
  }

  return (
    <section className="vx-content assessment-page assessment-create-tracker-page">
      <div className={`assessment-page-shell assessment-create-page-shell ${activeAssessmentTab === 'draft' ? 'is-draft-tab' : ''}`}>
        <div className="assessment-create-page-header">
          <PageNavigationHeader items={['My Pages', 'Assessment Suite', 'Assessment']} />
          <div className="assessment-create-header-actions" aria-label="Assessment page actions">
            <button
              type="button"
              className="assessment-create-new-btn"
              onClick={createAssessment}
            >
              <Plus size={17} strokeWidth={2.4} />
              Create Assessment
            </button>
          </div>
        </div>

        <section className="assessment-create-tabbar" aria-label="Assessment status tabs">
          <div className="assessment-create-tabs" role="tablist" aria-label="Assessment status filters">
            {assessmentTabItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeAssessmentTab === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`assessment-create-tab ${isActive ? 'is-active' : ''}`.trim()}
                  onClick={() => handleAssessmentTabChange(tab.key)}
                >
                  <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <strong>{tab.count}</strong>
                </button>
              )
            })}
          </div>
        </section>

        {shouldShowDraftAssessments ? (
          <section className="assessment-create-draft-shell" aria-label="Draft assessments">
            <div className="assessment-create-card-heading">
              <h2>Draft Assessment</h2>
              {renderAssessmentSearchToolbar()}
            </div>
            {draftAssessments.length && filteredDraftAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {filteredDraftAssessments.map((draft) => {
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
            ) : draftAssessments.length ? (
              <div className="assessment-create-placeholder">
                <p>No draft assessments match your search.</p>
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No draft assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowPublishedAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Published assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Published Assessment</h2>
                {activePublishedAssessments.length ? (
                  <button
                    type="button"
                    className={`assessment-create-live-count-btn ${publishedFilters.status === 'live' ? 'is-active' : ''}`.trim()}
                    onClick={() => {
                      setPublishedFilters((current) => ({
                        ...current,
                        status: current.status === 'live' ? 'all' : 'live',
                      }))
                    }}
                    aria-pressed={publishedFilters.status === 'live'}
                  >
                    <span aria-hidden="true" />
                    Live Assessment
                    <strong>{livePublishedAssessmentCount}</strong>
                  </button>
                ) : null}
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            {activePublishedAssessments.length ? (
              <>
                {filteredPublishedAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {filteredPublishedAssessments.map((assessment) => {
                  const isPracticeExam = String(assessment.supervisionType || '').toLowerCase().includes('practice')
                  const isOfflineExam = String(assessment.examMode || '').toLowerCase() === 'offline'
                  const SupervisionIcon = isPracticeExam ? EyeOff : Monitor
                  const scheduleStatus = getPublishedAssessmentScheduleStatus(assessment, scheduleNow)
                  const canShowExamControls = !isOfflineExam && ['live', 'completed'].includes(scheduleStatus?.type)
                  const canShowPublishedActions = !isPublishedAssessmentActionLocked(assessment, scheduleNow)
                  const publishedQuestionRows = getPublishedQuestionRows(assessment)
                  const durationValue = scheduleStatus?.type === 'live'
                    ? formatAssessmentRemainingTime(scheduleStatus.remainingMs)
                    : assessment.totalDuration || '-'
                  const durationLabel = scheduleStatus?.type === 'live' ? 'Remaining Time' : 'Total Duration'

                  return (
                      <article
                        key={assessment.id}
                        className={`assessment-create-draft-card assessment-create-published-card ${scheduleStatus?.type === 'live' ? 'is-live' : ''}`.trim()}
                      >
                        <div className="assessment-create-published-head">
                          <div>
                            <strong>{assessment.assessmentName || 'Untitled Assessment'}</strong>
                            <small>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</small>
                      </div>
                      <span className="assessment-create-published-actions">
                        {canShowPublishedActions ? (
                          <button type="button" className="assessment-create-published-icon-btn is-delete" onClick={() => openPublishedActionModal('delete', assessment)} aria-label={`Delete ${assessment.assessmentName || 'published assessment'}`}>
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="assessment-create-published-info"
                          onClick={() => {
                            setSelectedPublishedLogAssessment(assessment)
                            setPublishedLogPage(1)
                            setPublishedLogActiveTab('exam')
                          }}
                          title="Published assessment details"
                          aria-label={`View published log for ${assessment.assessmentName || 'published assessment'}`}
                        >
                          <Info size={14} strokeWidth={2.2} />
                        </button>
                        {canShowPublishedActions ? (
                          <button type="button" className="assessment-create-published-icon-btn is-edit" onClick={() => openPublishedActionModal('edit', assessment)} aria-label={`Edit ${assessment.assessmentName || 'published assessment'}`}>
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                        ) : null}
                      </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <span className={`assessment-create-published-status is-${String(assessment.examMode || '').toLowerCase() === 'offline' ? 'offline' : 'online'}`}>
                            {assessment.examMode || '-'}
                          </span>
                          {!isOfflineExam ? (
                            <span className={`assessment-create-published-supervision ${isPracticeExam ? 'is-practice' : 'is-proctored'}`}>
                              <SupervisionIcon size={13} strokeWidth={2.3} />
                              {formatSupervisionTypeLabel(assessment.supervisionType) || '-'}
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
                          <span><strong>{durationValue}</strong><em>{durationLabel}</em></span>
                          <span><strong>{formatDisplayDate(assessment.endDate)}</strong><em>End Date</em></span>
                          <span><strong>{assessment.totalMarks ?? '-'}</strong><em>Total Marks</em></span>
                          <span><strong>{assessment.examType || '-'}</strong><em>Exam Type</em></span>
                        </div>
                        <div className="assessment-create-draft-footer assessment-create-published-footer">
                          <span className="assessment-create-published-footer-status">
                            {scheduleStatus ? (
                              scheduleStatus.type === 'upcoming' ? (
                                <span>{scheduleStatus.label}</span>
                              ) : (
                                <span className={`assessment-create-published-schedule-badge is-${scheduleStatus.type}`}>
                                  {scheduleStatus.label}
                                </span>
                              )
                            ) : null}
                          </span>
                          {canShowExamControls ? (
                            <button type="button" className="assessment-create-exam-controls-btn" onClick={() => openExamControls(assessment)}>
                              <Monitor size={12} strokeWidth={2.4} />
                              Exam Controls
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                })}
              </div>
                ) : (
                  <div className="assessment-create-placeholder">
                    <p>No published assessments match your search.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No published assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowEvaluationAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Evaluation assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Evaluation</h2>
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            {evaluationAssessments.length ? (
              filteredEvaluationAssessments.length ? (
                <div className="assessment-create-draft-grid">
                  {filteredEvaluationAssessments.map((assessment) => {
                    const isPracticeExam = String(assessment.supervisionType || '').toLowerCase().includes('practice')
                    const isOfflineExam = String(assessment.examMode || '').toLowerCase() === 'offline'
                    const SupervisionIcon = isPracticeExam ? EyeOff : Monitor
                    const publishedQuestionRows = getPublishedQuestionRows(assessment)
                    const durationValue = assessment.totalDuration || '-'

                    return (
                      <article
                        key={assessment.id}
                        className="assessment-create-draft-card assessment-create-published-card"
                      >
                        <div className="assessment-create-published-head">
                          <div>
                            <strong>{assessment.assessmentName || 'Untitled Assessment'}</strong>
                            <small>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</small>
                          </div>
                          <span className="assessment-create-published-actions">
                            <button
                              type="button"
                              className="assessment-create-published-info"
                              onClick={() => {
                                setSelectedPublishedLogAssessment(assessment)
                                setPublishedLogPage(1)
                                setPublishedLogActiveTab('exam')
                              }}
                              title="Assessment log details"
                              aria-label={`View logs for ${assessment.assessmentName || 'assessment'}`}
                            >
                              <Info size={14} strokeWidth={2.2} />
                            </button>
                          </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <span className={`assessment-create-published-status is-${isOfflineExam ? 'offline' : 'online'}`}>
                            {assessment.examMode || '-'}
                          </span>
                          {!isOfflineExam ? (
                            <span className={`assessment-create-published-supervision ${isPracticeExam ? 'is-practice' : 'is-proctored'}`}>
                              <SupervisionIcon size={13} strokeWidth={2.3} />
                              {formatSupervisionTypeLabel(assessment.supervisionType) || '-'}
                            </span>
                          ) : publishedQuestionRows.length ? (
                            <button type="button" className="assessment-create-published-download-btn" onClick={() => downloadQuestionPaperPdf(assessment)}>
                              <Download size={12} strokeWidth={2.4} />
                              Download PDF
                            </button>
                          ) : null}
                        </span>
                        <div className="assessment-create-published-details" aria-label="Evaluation assessment details">
                          <span><strong>{formatDisplayDate(assessment.startDate)}</strong><em>Start Date</em></span>
                          <span><strong>{assessment.startTime || '-'}</strong><em>Start Time</em></span>
                          <span><strong>{durationValue}</strong><em>Total Duration</em></span>
                          <span><strong>{formatDisplayDate(assessment.endDate)}</strong><em>End Date</em></span>
                          <span><strong>{assessment.totalMarks ?? '-'}</strong><em>Total Marks</em></span>
                          <span><strong>{assessment.examType || '-'}</strong><em>Exam Type</em></span>
                        </div>
                        <div className="assessment-create-draft-footer assessment-create-published-footer">
                          <span className="assessment-create-published-footer-status">
                            <span className="assessment-create-published-schedule-badge is-yet-to-start">
                              Yet to Start
                            </span>
                          </span>
                          <button type="button" className="assessment-create-exam-controls-btn" onClick={() => startAssessmentEvaluation(assessment)}>
                            <ClipboardCheck size={12} strokeWidth={2.4} />
                            Start Evaluation
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="assessment-create-placeholder">
                  <p>No evaluation assessments match your search.</p>
                </div>
              )
            ) : (
              <div className="assessment-create-placeholder">
                <p>No completed assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {shouldShowResultAssessments ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Result assessments">
            <div className="assessment-create-card-heading">
              <div className="assessment-create-published-title">
                <h2>Results</h2>
              </div>
              {renderAssessmentSearchToolbar()}
            </div>
            <div className="assessment-create-placeholder">
              <p>Results flow will be added later.</p>
            </div>
          </section>
        ) : null}

        {activeEmptyTab ? (
          <section className="assessment-create-draft-shell" aria-label={`${activeEmptyTab.label} assessments`}>
            <div className="assessment-create-card-heading">
              <h2>{activeEmptyTab.key === 'evaluation' ? 'Evaluation' : `${activeEmptyTab.label} Assessment`}</h2>
              {renderAssessmentSearchToolbar()}
            </div>
            <div className="assessment-create-placeholder">
              <p>
                No {String(activeEmptyTab.label || 'selected').toLowerCase()} assessments {(hasPublishedSearch || hasPublishedFilter) ? 'match your search.' : 'available.'}
              </p>
            </div>
          </section>
        ) : null}
      </div>
      {publishedActionModal ? createPortal((
        <div className="assessment-create-action-guard-backdrop" role="presentation">
          <section
            className="assessment-create-action-guard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-create-action-guard-title"
          >
            {publishedActionModal.step === 'confirm' ? (
              <>
                <span className={`assessment-create-action-guard-icon is-${publishedActionModal.action}`} aria-hidden="true">
                  {publishedActionModal.action === 'edit' ? <Pencil size={26} strokeWidth={2.2} /> : <Trash2 size={26} strokeWidth={2.2} />}
                </span>
                <div className="assessment-create-action-guard-copy">
                  <h3 id="assessment-create-action-guard-title">
                    {publishedActionModal.action === 'edit' ? 'Are you sure edit?' : 'Are you sure delete?'}
                  </h3>
                  <p>{publishedActionModal.assessment?.assessmentName || 'Untitled Assessment'}</p>
                </div>
                <div className="assessment-create-action-guard-actions">
                  <button type="button" className="is-secondary" onClick={closePublishedActionModal}>
                    No
                  </button>
                  <button type="button" className={publishedActionModal.action === 'delete' ? 'is-danger' : 'is-primary'} onClick={continuePublishedActionVerification}>
                    Yes
                  </button>
                </div>
              </>
            ) : (
              <form className="assessment-create-action-guard-form" onSubmit={submitPublishedActionVerification}>
                <span className={`assessment-create-action-guard-icon is-${publishedActionModal.action}`} aria-hidden="true">
                  {publishedActionModal.action === 'edit' ? <Pencil size={26} strokeWidth={2.2} /> : <Trash2 size={26} strokeWidth={2.2} />}
                </span>
                <div className="assessment-create-action-guard-copy">
                  <h3 id="assessment-create-action-guard-title">
                    Verify {publishedActionModal.action === 'edit' ? 'Edit' : 'Delete'} Action
                  </h3>
                  <p>Select Password or OTP, then enter the code to continue.</p>
                </div>
                <div className="assessment-create-action-methods" role="radiogroup" aria-label="Verification method">
                  <button
                    type="button"
                    className={publishedActionModal.method === 'password' ? 'is-active' : ''}
                    onClick={() => updatePublishedActionVerification({ method: 'password', value: '' })}
                    aria-pressed={publishedActionModal.method === 'password'}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    className={publishedActionModal.method === 'otp' ? 'is-active' : ''}
                    onClick={() => updatePublishedActionVerification({ method: 'otp', value: '' })}
                    aria-pressed={publishedActionModal.method === 'otp'}
                  >
                    OTP
                  </button>
                </div>
                <label className="assessment-create-action-guard-field">
                  <span>{publishedActionModal.method === 'otp' ? 'Enter OTP' : 'Enter Password'}</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={publishedActionModal.value}
                    onChange={(event) => updatePublishedActionVerification({ value: event.target.value })}
                    placeholder="Enter 1234"
                  />
                </label>
                {publishedActionModal.error ? (
                  <p className="assessment-create-action-guard-error">{publishedActionModal.error}</p>
                ) : null}
                <div className="assessment-create-action-guard-actions">
                  <button type="button" className="is-secondary" onClick={closePublishedActionModal}>
                    No
                  </button>
                  <button type="submit" className={publishedActionModal.action === 'delete' ? 'is-danger' : 'is-primary'}>
                    Yes
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      ), document.body) : null}
      {selectedPublishedLogAssessment ? createPortal((() => {
        const publishedLogRows = getPublishedLogRows(selectedPublishedLogAssessment)
        const examControlLogRows = readExamControlLogRows(selectedPublishedLogAssessment)
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
                <h3 id="assessment-create-log-title">Assessment Log Details</h3>
                <span>{selectedPublishedLogAssessment.assessmentName || 'Untitled Assessment'}</span>
              </div>
              <button type="button" className="assessment-create-log-close" onClick={() => setSelectedPublishedLogAssessment(null)} aria-label="Close published log details">
                <X size={15} strokeWidth={2.3} />
              </button>
            </div>
            <div className="assessment-create-log-tabs" role="tablist" aria-label="Assessment log views">
              <button
                type="button"
                role="tab"
                aria-selected={publishedLogActiveTab === 'exam'}
                className={publishedLogActiveTab === 'exam' ? 'is-active' : ''}
                onClick={() => setPublishedLogActiveTab('exam')}
              >
                Exam Controls Log
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={publishedLogActiveTab === 'published'}
                className={publishedLogActiveTab === 'published' ? 'is-active' : ''}
                onClick={() => setPublishedLogActiveTab('published')}
              >
                Published Log Details
              </button>
            </div>
            <div className="assessment-create-log-table-shell">
              {publishedLogActiveTab === 'exam' ? (
                <div className="assessment-create-log-grid is-exam-controls" role="table" aria-label="Exam controls log">
                  <div className="assessment-create-log-grid-head" role="row">
                    <span role="columnheader">Student ID</span>
                    <span role="columnheader">Time</span>
                    <span role="columnheader">Action</span>
                    <span role="columnheader">Remarks</span>
                    <span role="columnheader">Faculty</span>
                  </div>
                  {examControlLogRows.length ? examControlLogRows.map((item, index) => (
                    <div className="assessment-create-log-grid-row" role="row" key={`${item.id || 'exam-log'}-${index}`}>
                      <span role="cell">{item.studentId || '-'}</span>
                      <span role="cell">{item.time || '-'}</span>
                      <span role="cell">{item.action || '-'}</span>
                      <span role="cell">{item.remarks || '-'}</span>
                      <span role="cell">{item.faculty || '-'}</span>
                    </div>
                  )) : (
                    <div className="assessment-create-log-empty">No exam controls log available.</div>
                  )}
                </div>
              ) : (
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
              )}
            </div>
            {publishedLogActiveTab === 'published' ? (
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
            ) : null}
          </section>
        </div>
        )
      })(), document.body) : null}
    </section>
  )
}
