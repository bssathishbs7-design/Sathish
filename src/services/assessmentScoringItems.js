import { descriptiveSections, descriptiveResponseItems } from './descriptiveResponses.js'
const parseMarksValue = value => Number.isFinite(Number(value)) ? Number(value) : 0
const stripHtml = value => String(value || '').replace(/<[^>]*>/g, '').trim()

/** Shared leaf identities and mark limits for faculty scoring and result-release validation. */
export const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

export const getQuestionMarksTotal = (item) => {
  if (isDescriptiveQuestionType(item?.type)) {
    const sections = descriptiveSections(item)
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

export const getDescriptiveSectionMarks = (section) => {
  const children = Array.isArray(section?.children) ? section.children : []
  if (children.length) {
    return children.reduce((total, child) => total + (getQuestionMarksTotal(child) || parseMarksValue(child?.marks)), 0)
  }
  return getQuestionMarksTotal(section) || parseMarksValue(section?.marks)
}

export const getDescriptiveScoringItems = (question, index, answerInput = false) => {
  if (answerInput) return descriptiveResponseItems(question, index).map(({ key, item }) => ({ key, maxMarks: getQuestionMarksTotal(item) || parseMarksValue(item.marks) }))
  const baseKey = getQuestionKey(question, `descriptive-${index + 1}`)
  const sections = descriptiveSections(question)

  if (!sections.length) {
    return [{ key: baseKey, maxMarks: getQuestionMarksTotal(question) }]
  }

  return sections.flatMap((section, sectionIndex) => {
    const sectionKey = getQuestionKey(section, `${baseKey}-section-${sectionIndex + 1}`)
    const children = Array.isArray(section.children) ? section.children : []

    if (!children.length) {
      return [{ key: sectionKey, maxMarks: getDescriptiveSectionMarks(section) }]
    }

    return children.map((child, childIndex) => ({
      key: getQuestionKey(child, `${sectionKey}-child-${childIndex + 1}`),
      maxMarks: getQuestionMarksTotal(child) || parseMarksValue(child?.marks),
    }))
  })
}

export const getQuestionKey = (item, fallback) => String(
  item?.id
  || item?.questionId
  || item?._id
  || fallback
)
