import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, ClipboardList, FileSearch, Info, LayoutGrid, ListChecks, Rows3 } from 'lucide-react'
import { stripHtml } from '../utils/mathText'
import '../styles/assessment-pages.css'

const QUESTION_BANK_PUBLISHED_KEY = 'vx-question-bank-published-questions'
const QUESTION_BANK_VIEW_KEY = 'vx-question-bank-all-view'

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'

const readPublishedQuestions = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_PUBLISHED_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []

    const cleanedQuestions = parsed.filter((question, index) => (
      !(index === 6 && getQuestionPreview(question).trim().toLowerCase() === 'data')
    ))

    if (cleanedQuestions.length !== parsed.length) {
      window.localStorage.setItem(QUESTION_BANK_PUBLISHED_KEY, JSON.stringify(cleanedQuestions))
      window.dispatchEvent(new Event('question-bank-published-questions'))
    }

    return cleanedQuestions
  } catch {
    return []
  }
}

const readQuestionBankView = () => {
  if (typeof window === 'undefined') return 'card'

  const savedView = window.localStorage.getItem(QUESTION_BANK_VIEW_KEY)
  return savedView === 'table' ? 'table' : 'card'
}

const getQuestionAuthorName = (question) => (
  question?.authorName
  ?? question?.createdByName
  ?? question?.senderName
  ?? 'Karthik Subramanian'
)

const getListSummary = (values, fallback = '-') => {
  const list = Array.isArray(values) ? values.filter(Boolean) : []
  return list.length ? list.join(', ') : fallback
}

const getTableTagSummary = (question) => {
  const tagSummary = getOptionalTagGroups(question)
    .map((group) => `${group.label}: ${group.values.join(', ')}`)
    .join(' | ')

  return tagSummary || '-'
}

const getOptionalTagGroups = (question) => [
  { label: 'Cognitive Function', values: [question?.cognitiveFunction].filter(Boolean) },
  { label: 'Skill Focus', values: [question?.skillFocus].filter(Boolean) },
  { label: 'Organ System', values: [question?.organSystem].filter(Boolean) },
  { label: 'Organ Sub-System', values: question?.organSubSystems ?? [] },
  { label: 'Disease Tags', values: question?.diseaseTags ?? [] },
  { label: 'Key Concept', values: question?.keyConcepts ?? [] },
].map((group) => ({
  ...group,
  values: group.values.filter((value) => value && value !== 'Not Applicable'),
})).filter((group) => group.values.length)

const getSentDate = (value) => {
  if (!value) return 'Sent date not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sent date not available'

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const nonCreateHighlights = [
  {
    title: 'Question review',
    description: 'View and organize question bank items that are not part of the create workflow.',
    icon: FileSearch,
  },
  {
    title: 'Mapped collections',
    description: 'Track existing questions by subject, topic, competency, difficulty, and status.',
    icon: ClipboardList,
  },
  {
    title: 'Readiness status',
    description: 'Use this area for non-authoring question bank tasks, checks, and references.',
    icon: ListChecks,
  },
]

export default function QuestionBankNonCreatePage() {
  const [publishedQuestions, setPublishedQuestions] = useState(() => readPublishedQuestions())
  const [activeView, setActiveView] = useState(() => readQuestionBankView())
  const [activeTagsId, setActiveTagsId] = useState('')
  const [activeOptionDistractorId, setActiveOptionDistractorId] = useState('')
  const [expandedTableRows, setExpandedTableRows] = useState([])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncPublishedQuestions = () => {
      setPublishedQuestions(readPublishedQuestions())
    }

    window.addEventListener('storage', syncPublishedQuestions)
    window.addEventListener('question-bank-published-questions', syncPublishedQuestions)

    return () => {
      window.removeEventListener('storage', syncPublishedQuestions)
      window.removeEventListener('question-bank-published-questions', syncPublishedQuestions)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(QUESTION_BANK_VIEW_KEY, activeView)
  }, [activeView])

  return (
    <section className="vx-content assessment-page">
      <div className="assessment-page-shell">
      

        {publishedQuestions.length ? (
          <section className="assessment-page-view-toolbar" aria-label="Question bank view controls">
            <div className="assessment-page-view-count">
              <strong>{publishedQuestions.length}</strong>
              <span>{publishedQuestions.length === 1 ? 'question' : 'questions'}</span>
            </div>
            <div className="assessment-page-view-toggle" role="group" aria-label="Switch question view">
              <button
                type="button"
                className={activeView === 'card' ? 'is-active' : ''}
                onClick={() => setActiveView('card')}
              >
                <LayoutGrid size={15} strokeWidth={2.3} />
                Card View
              </button>
              <button
                type="button"
                className={activeView === 'table' ? 'is-active' : ''}
                onClick={() => setActiveView('table')}
              >
                <Rows3 size={15} strokeWidth={2.3} />
                Table View
              </button>
            </div>
          </section>
        ) : null}

        {publishedQuestions.length && activeView === 'card' ? (
          <section className="assessment-page-question-list" aria-label="Sent question bank questions">
            {publishedQuestions.map((question, index) => {
              const curriculum = [
                question.year,
                question.subject,
                ...(question.topics ?? []),
                ...(question.competencies ?? []),
              ].filter(Boolean)
              const imageRows = Array.isArray(question.images) ? question.images : []
              const optionRows = Array.isArray(question.options) ? question.options : []
              const tagGroups = getOptionalTagGroups(question)
              const questionId = question.id ?? `${question.type}-${index}`
              const isTagsOpen = activeTagsId === questionId

              return (
                <article key={questionId} className="assessment-page-question-card">
                  <div className="assessment-page-question-head">
                    <span className="assessment-page-question-type">{question.type ?? 'Question'}</span>
                    <span className="assessment-page-question-author">Author By : {getQuestionAuthorName(question)}</span>
                    {question.questionCategory ? <span>{question.questionCategory}</span> : null}
                    {question.cognitiveLevel ? <span>{question.cognitiveLevel}</span> : null}
                    {question.thinkingLevel ? <span>{question.thinkingLevel}</span> : null}
                    {question.difficultyLevel ? <span>{question.difficultyLevel}</span> : null}
                    <span>{getSentDate(question.questionBankSentAt)}</span>
                    {tagGroups.length ? (
                      <span className="assessment-page-question-tags-wrap">
                        <button
                          type="button"
                          className="assessment-page-question-tags-btn"
                          onClick={() => setActiveTagsId(isTagsOpen ? '' : questionId)}
                          aria-expanded={isTagsOpen}
                        >
                          <Info size={13} strokeWidth={2.2} />
                          View tags
                        </button>
                        {isTagsOpen ? (
                          <span className="assessment-page-question-tags-popover" role="tooltip">
                            {tagGroups.map((group) => (
                              <span key={group.label} className="assessment-page-question-tags-group">
                                <strong>{group.label}</strong>
                                <span>
                                  {group.values.map((value) => (
                                    <span key={value}>{value}</span>
                                  ))}
                                </span>
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <div className="assessment-page-question-title">
                    <strong>Q{index + 1}.</strong>
                    <span>{getQuestionPreview(question)}</span>
                  </div>
                  {curriculum.length ? (
                    <div className="assessment-page-question-path">
                      {curriculum.join(' / ')}
                    </div>
                  ) : null}
                  {imageRows.length ? (
                    <div className="assessment-page-question-images" aria-label="Question images">
                      {imageRows.map((image, imageIndex) => (
                        <figure key={image.id ?? `${question.id}-image-${imageIndex}`} className="assessment-page-question-image">
                          <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
                          <figcaption>{String.fromCharCode(65 + imageIndex)}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                  {question.type === 'MCQ' && optionRows.length ? (
                    <div className="assessment-page-question-options">
                      {optionRows
                        .filter((option) => stripHtml(option.label ?? option.content))
                        .map((option, optionIndex) => {
                          const optionLabel = String.fromCharCode(65 + optionIndex)
                          const isCorrect = (question.correctOptionIds ?? []).includes(option.id)
                          const optionPreviewId = `${questionId}-${option.id ?? optionIndex}`

                          return (
                            <span key={option.id ?? `${questionId}-option-${optionIndex}`} className={isCorrect ? 'is-correct' : ''}>
                              <strong>{optionLabel}.</strong>
                              {stripHtml(option.label ?? option.content)}
                              <span className="assessment-page-option-distractor">
                                <button
                                  type="button"
                                  onClick={() => setActiveOptionDistractorId((current) => (current === optionPreviewId ? '' : optionPreviewId))}
                                  aria-expanded={activeOptionDistractorId === optionPreviewId}
                                  aria-label={`View distractor errors for option ${optionLabel}`}
                                >
                                  <Info size={12} strokeWidth={2.2} />
                                </button>
                                {activeOptionDistractorId === optionPreviewId ? (
                                  <span className="assessment-page-option-distractor-tooltip" role="tooltip">
                                    <strong>Distractor Error</strong>
                                    <span>{(option.distractorErrors ?? [])[0] ?? 'No distractor error selected'}</span>
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          )
                        })}
                    </div>
                  ) : null}
                  {stripHtml(question.answerKey) ? (
                    <div className="assessment-page-question-answer">
                      <strong>Answer & Explanation</strong>
                      <span>{stripHtml(question.answerKey)}</span>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </section>
        ) : null}

        {publishedQuestions.length && activeView === 'table' ? (
          <section className="assessment-page-table-wrap" aria-label="Sent question bank table">
            <table className="assessment-page-question-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Question</th>
                </tr>
              </thead>
              <tbody>
                {publishedQuestions.map((question, index) => {
                  const questionId = question.id ?? `${question.type}-${index}`
                  const imageRows = Array.isArray(question.images) ? question.images : []
                  const optionRows = Array.isArray(question.options) ? question.options : []
                  const curriculum = [
                    question.year,
                    question.subject,
                    ...(question.topics ?? []),
                    ...(question.competencies ?? []),
                  ].filter(Boolean)
                  const tagGroups = getOptionalTagGroups(question)
                  const tableTagsId = `table-tags-${questionId}`
                  const isTagsOpen = activeTagsId === tableTagsId
                  const isTableRowOpen = expandedTableRows.includes(questionId)

                  return (
                    <tr key={questionId}>
                      <td className="assessment-page-table-serial">Q{index + 1}</td>
                      <td className="assessment-page-table-question-cell">
                        <div className="assessment-page-table-question-stack">
                          <div className="assessment-page-table-question-badges">
                            <span className="assessment-page-table-pill">{question.type ?? 'Question'}</span>
                            {question.difficultyLevel ? <span>{question.difficultyLevel}</span> : null}
                            {question.thinkingLevel ? <span>{question.thinkingLevel}</span> : null}
                            {question.questionCategory ? <span>{question.questionCategory}</span> : null}
                            {question.cognitiveLevel ? <span>{question.cognitiveLevel}</span> : null}
                            <span className="assessment-page-table-author-pill">Author By : {getQuestionAuthorName(question)}</span>
                          </div>
                          <div className="assessment-page-table-question-text">
                            <strong>{getQuestionPreview(question)}</strong>
                            <button
                              type="button"
                              className="assessment-page-table-collapse-btn"
                              onClick={() => {
                                setExpandedTableRows((current) => (
                                  current.includes(questionId)
                                    ? current.filter((id) => id !== questionId)
                                    : [...current, questionId]
                                ))
                              }}
                              aria-expanded={isTableRowOpen}
                              aria-label={`${isTableRowOpen ? 'Collapse' : 'Expand'} question ${index + 1}`}
                            >
                              {isTableRowOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
                            </button>
                          </div>
                          {isTableRowOpen ? (
                            <>
                              {curriculum.length ? (
                                <div className="assessment-page-table-curriculum">{curriculum.join(' / ')}</div>
                              ) : null}
                              {imageRows.length ? (
                                <div className="assessment-page-table-inline-section">
                                  <div className="assessment-page-table-images" aria-label={`Images for question ${index + 1}`}>
                                    {imageRows.map((image, imageIndex) => (
                                      <figure key={image.id ?? `${questionId}-table-image-${imageIndex}`}>
                                        <img src={image.url} alt={image.name || `Question image ${imageIndex + 1}`} />
                                        <figcaption>{String.fromCharCode(65 + imageIndex)}</figcaption>
                                      </figure>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {question.type === 'MCQ' && optionRows.length ? (
                                <div className="assessment-page-table-inline-section">
                                  <div className="assessment-page-table-options">
                                    {optionRows
                                      .filter((option) => stripHtml(option.label ?? option.content))
                                      .map((option, optionIndex) => {
                                        const optionLabel = String.fromCharCode(65 + optionIndex)
                                        const isCorrect = (question.correctOptionIds ?? []).includes(option.id)
                                        const optionPreviewId = `table-${questionId}-${option.id ?? optionIndex}`

                                        return (
                                          <span key={option.id ?? `${questionId}-table-option-${optionIndex}`} className={isCorrect ? 'is-correct' : ''}>
                                            <strong>{optionLabel}.</strong>
                                            {stripHtml(option.label ?? option.content)}
                                            <span className="question-bank-option-distractor-preview assessment-page-table-option-info">
                                              <button
                                                type="button"
                                                onClick={() => setActiveOptionDistractorId((current) => (current === optionPreviewId ? '' : optionPreviewId))}
                                                aria-expanded={activeOptionDistractorId === optionPreviewId}
                                                aria-label={`View distractor errors for option ${optionLabel}`}
                                              >
                                                <Info size={12} strokeWidth={2.2} />
                                              </button>
                                              {activeOptionDistractorId === optionPreviewId ? (
                                                <span className="question-bank-option-distractor-tooltip" role="tooltip">
                                                  <strong>Distractor Error</strong>
                                                  <span>{(option.distractorErrors ?? [])[0] ?? 'No distractor error selected'}</span>
                                                </span>
                                              ) : null}
                                            </span>
                                          </span>
                                        )
                                      })}
                                  </div>
                                </div>
                              ) : null}
                              {stripHtml(question.answerKey) ? (
                                <div className="assessment-page-table-inline-section assessment-page-table-answer">
                                  <span>{stripHtml(question.answerKey)}</span>
                                </div>
                              ) : null}
                              {tagGroups.length ? (
                                <div className="assessment-page-table-inline-section assessment-page-table-tags-line">
                                  <span className="assessment-page-question-tags-wrap">
                                    <button
                                      type="button"
                                      className="assessment-page-question-tags-btn"
                                      onClick={() => setActiveTagsId(isTagsOpen ? '' : tableTagsId)}
                                      aria-expanded={isTagsOpen}
                                    >
                                      <Info size={13} strokeWidth={2.2} />
                                      View Tags
                                    </button>
                                    {isTagsOpen ? (
                                      <span className="assessment-page-question-tags-popover" role="tooltip">
                                        {tagGroups.map((group) => (
                                          <span key={group.label} className="assessment-page-question-tags-group">
                                            <strong>{group.label}</strong>
                                            <span>
                                              {group.values.map((value) => (
                                                <span key={value}>{value}</span>
                                              ))}
                                            </span>
                                          </span>
                                        ))}
                                      </span>
                                    ) : null}
                                  </span>
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ) : (
          !publishedQuestions.length ? (
          <section className="assessment-page-grid" aria-label="Question bank Overall Question overview">
            {nonCreateHighlights.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="assessment-page-card">
                  <span className="assessment-page-card-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              )
            })}
          </section>
          ) : null
        )}

        {!publishedQuestions.length ? (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No sent questions yet</strong>
            <p>Approved questions sent to Question Bank will appear here.</p>
          </section>
        ) : null}
      </div>
    </section>
  )
}
