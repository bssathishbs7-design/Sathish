import { Fragment, useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Filter, Flag, Info, LayoutGrid, ListChecks, Plus } from 'lucide-react'
import { stripHtml } from '../utils/mathText'
import '../styles/assessment-pages.css'

const QUESTION_BANK_REPORTED_KEY = 'vx-question-bank-reported-questions'
const QUERY_REQUEST_PAGE_SIZE = 20
const filterLabels = ['Author', 'Type', 'Year', 'Subject', 'Topic', 'Competency']

const readReportedQuestionRecords = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_BANK_REPORTED_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getQuestionPreview = (question) => stripHtml(question?.questionText) || question?.title || 'Untitled question'
const descriptiveTypeLabels = new Map([
  ['desc long answer questions (laqs)', 'LAQs'],
  ['desc short answer questions (saqs)', 'SAQs'],
  ['desc modified essay questions (meqs)', 'MEQs'],
  ['descriptive question', 'SAQs'],
  ['descriptive', 'SAQs'],
])
const getQuestionTypeLabel = (type) => {
  const normalized = String(type ?? '').trim()
  return descriptiveTypeLabels.get(normalized.toLowerCase()) ?? (normalized.toLowerCase().includes('descriptive') ? 'SAQs' : normalized || 'Question')
}
const getQuestionTypeClassName = (type) => {
  const normalized = String(type ?? '').trim().toLowerCase()
  if (normalized === 'mcq') return 'is-mcq'
  if (normalized.includes('descriptive') || normalized.startsWith('desc ')) return 'is-descriptive'
  return ''
}
const getThinkingBadgeClassName = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'hot') return 'assessment-page-thinking-hot'
  if (normalized === 'lot') return 'assessment-page-thinking-lot'
  return ''
}
const getRequestStatus = (request) => {
  const normalized = String(request?.status ?? 'Open').trim().toLowerCase()
  if (normalized === 'resolved') return 'resolved'
  if (normalized === 'pending') return 'pending'
  if (request?.authorAction) return 'pending'
  return 'open'
}
const isRequestResolved = (request) => getRequestStatus(request) === 'resolved'
const isRequestPending = (request) => !isRequestResolved(request) && Boolean(request?.authorAction)
const getRequestStatusLabel = (request) => {
  const status = getRequestStatus(request)
  if (status === 'resolved') return 'Resolved'
  if (status === 'pending') return 'Pending'
  return 'Open'
}
const getOptionalTagGroups = (question) => [
  { label: 'Category', values: [question?.questionCategory].filter(Boolean) },
  { label: 'Thinking Level', values: [question?.thinkingLevel].filter(Boolean) },
  { label: 'Difficulty Level', values: [question?.difficultyLevel].filter(Boolean) },
  { label: 'Cognitive Level', values: [question?.cognitiveLevel].filter(Boolean) },
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

export default function QueryRequestPage() {
  const [reportedRequests, setReportedRequests] = useState(() => readReportedQuestionRecords())
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRequestIds, setExpandedRequestIds] = useState([])
  const [activeTagsId, setActiveTagsId] = useState('')
  const totalPages = Math.max(1, Math.ceil(reportedRequests.length / QUERY_REQUEST_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * QUERY_REQUEST_PAGE_SIZE
  const pagedRequests = reportedRequests.slice(pageStartIndex, pageStartIndex + QUERY_REQUEST_PAGE_SIZE)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncReportedRequests = () => setReportedRequests(readReportedQuestionRecords())

    window.addEventListener('storage', syncReportedRequests)
    window.addEventListener('question-bank-reported-questions', syncReportedRequests)

    return () => {
      window.removeEventListener('storage', syncReportedRequests)
      window.removeEventListener('question-bank-reported-questions', syncReportedRequests)
    }
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [reportedRequests.length])

  const resolveReport = (questionId) => {
    const resolvedAt = new Date().toISOString()
    const nextRequests = readReportedQuestionRecords().map((record) => (
      record.questionId === questionId
        ? {
            ...record,
            status: 'Resolved',
            resolvedAt,
            question: record.question ? {
              ...record.question,
              reportStatus: 'Resolved',
              resolvedAt,
            } : record.question,
          }
        : record
    ))
    window.localStorage.setItem(QUESTION_BANK_REPORTED_KEY, JSON.stringify(nextRequests))
    window.dispatchEvent(new Event('question-bank-reported-questions'))
    setReportedRequests(nextRequests)
    setExpandedRequestIds((current) => current.filter((id) => id !== questionId))
    setActiveTagsId('')
  }

  const toggleRequestExpansion = (requestId) => {
    setExpandedRequestIds((current) => (
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId]
    ))
  }

  const renderTagBadges = (question) => (
    <>
      <span className="assessment-page-grid-author-label assessment-page-source-badge is-uploaded-author">M</span>
      {question.difficultyLevel ? <span className="assessment-page-table-value-pill assessment-page-difficulty-badge">{question.difficultyLevel}</span> : null}
      {question.thinkingLevel ? <span className={`assessment-page-table-value-pill ${getThinkingBadgeClassName(question.thinkingLevel)}`}>{question.thinkingLevel}</span> : null}
    </>
  )

  const renderRequestActions = (request, questionNumber, isOpen) => (
    <span className="assessment-page-grid-row-actions" onClick={(event) => event.stopPropagation()}>
      <span className={`query-request-status-pill is-${getRequestStatus(request)}`} title={request.authorAction || 'Report request'}>
        <Flag size={14} strokeWidth={2.2} />
        {getRequestStatusLabel(request)}
      </span>
      {getRequestStatus(request) !== 'resolved' ? (
        <button
          type="button"
          className="assessment-page-grid-row-action query-request-resolve-action"
          onClick={() => resolveReport(request.questionId)}
        >
          Resolve
        </button>
      ) : null}
      <button
        type="button"
        className="assessment-page-grid-collapse-indicator"
        onClick={() => toggleRequestExpansion(request.questionId ?? request.id)}
        aria-label={`${isOpen ? 'Collapse' : 'Open'} query request ${questionNumber}`}
      >
        {isOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
      </button>
    </span>
  )

  const renderReportMetaBadges = (request) => (
    <span className="query-request-meta-badges">
      {request.reasons?.length ? (
        <span className="query-request-meta-badge is-reason">
          <strong>Reason:</strong>
          {request.reasons.join(', ')}
        </span>
      ) : null}
      {request.authorAction ? (
        <span className="query-request-meta-badge is-action">
          <strong>Action:</strong>
          {request.authorAction}
        </span>
      ) : null}
      {request.explanation ? (
        <span className="query-request-meta-badge is-note">
          <strong>Note:</strong>
          {request.explanation}
        </span>
      ) : null}
    </span>
  )

  return (
    <section className="vx-content assessment-page query-request-page">
      <div className="assessment-page-shell query-request-shell">
        <section className="assessment-page-bank-controls is-grid-attached" aria-label="Query request controls">
          <div className="assessment-page-filter-strip" aria-label="Query request filters">
            <button type="button" className="assessment-page-filter-toggle" aria-label="Filter query requests">
              <Filter size={17} strokeWidth={2.2} />
            </button>
            {filterLabels.map((label) => (
              <span key={label} className="assessment-page-filter-dropdown">
                <button type="button" aria-expanded="false">
                  <span>{label}</span>
                  <ChevronDown size={14} strokeWidth={2.4} />
                </button>
              </span>
            ))}
            <span className="assessment-page-more-filters-wrap">
              <button type="button" className="assessment-page-more-filters-btn" aria-expanded="false">
                <Plus size={15} strokeWidth={2.3} />
                More
              </button>
            </span>
            <span className="assessment-page-expand-toggle" role="group" aria-label="Expand query request rows">
              <button
                type="button"
                onClick={() => setExpandedRequestIds(reportedRequests.map((request, index) => request.questionId ?? request.id ?? `query-request-${index}`))}
                aria-label="Expand all query requests"
              >
                <ListChecks size={15} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => setExpandedRequestIds([])}
                aria-label="Collapse all query requests"
              >
                <LayoutGrid size={14} strokeWidth={2.3} />
              </button>
            </span>
          </div>
        </section>

        {reportedRequests.length ? (
          <section className="assessment-page-table-wrap" aria-label="Query request table">
            <div className="assessment-page-grid-scroll">
              <table className="assessment-page-question-table assessment-page-grid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Question</th>
                    <th>Tags</th>
                    <th aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRequests.map((request, index) => {
                    const question = request.question ?? {}
                    const questionNumber = pageStartIndex + index + 1
                    const requestId = request.questionId ?? request.id ?? `query-request-${index}`
                    const isOpen = expandedRequestIds.includes(requestId)
                    const optionRows = Array.isArray(question.options) ? question.options : []
                    const imageRows = Array.isArray(question.images) ? question.images : []
                    const curriculum = [
                      question.year,
                      question.subject,
                      ...(question.topics ?? []),
                      ...(question.competencies ?? []),
                    ].filter(Boolean)
                    const tagGroups = getOptionalTagGroups(question)
                    const tagsId = `query-request-tags-${requestId}`
                    const isTagsOpen = activeTagsId === tagsId

                    return (
                      <Fragment key={requestId}>
                        {!isOpen ? (
                          <tr
                            className={`assessment-page-grid-summary-row ${isRequestResolved(request) ? 'is-query-resolved' : ''}`}
                            onClick={() => toggleRequestExpansion(requestId)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                toggleRequestExpansion(requestId)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-expanded="false"
                          >
                            <td className="assessment-page-grid-type-cell">
                              <span className={`assessment-page-grid-type-label ${getQuestionTypeClassName(question.type)}`}>
                                {getQuestionTypeLabel(question.type)}
                              </span>
                            </td>
                            <td className="assessment-page-grid-question">
                              <span className="assessment-page-grid-row-layout">
                                <span className="assessment-page-grid-question-content">
                                  <strong>Q{questionNumber}. {getQuestionPreview(question)}</strong>
                                  {renderReportMetaBadges(request)}
                                </span>
                              </span>
                            </td>
                            <td className="assessment-page-grid-tags-cell">
                              <span className="assessment-page-grid-question-meta">
                                {renderTagBadges(question)}
                              </span>
                            </td>
                            <td className="assessment-page-grid-actions-cell">
                              {renderRequestActions(request, questionNumber, false)}
                            </td>
                          </tr>
                        ) : null}
                        {isOpen ? (
                          <tr
                            className={`assessment-page-grid-detail-row ${isRequestResolved(request) ? 'is-query-resolved' : ''}`}
                            onClick={() => toggleRequestExpansion(requestId)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                toggleRequestExpansion(requestId)
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-expanded="true"
                          >
                            <td colSpan={4}>
                              <div className="assessment-page-table-question-stack">
                                <div className="assessment-page-grid-detail-head">
                                  <span className={`assessment-page-grid-type-label ${getQuestionTypeClassName(question.type)}`}>
                                    {getQuestionTypeLabel(question.type)}
                                  </span>
                                  <div className="assessment-page-table-full-question">
                                    Q{questionNumber}. {getQuestionPreview(question)}
                                  </div>
                                  <div className="assessment-page-grid-question-meta assessment-page-grid-detail-meta">
                                    {renderTagBadges(question)}
                                  </div>
                                  {renderRequestActions(request, questionNumber, true)}
                                </div>
                                {tagGroups.length ? (
                                  <div className="assessment-page-grid-question-meta assessment-page-grid-detail-extra-tags">
                                    <span className="assessment-page-question-tags-wrap">
                                      <button
                                        type="button"
                                        className="assessment-page-question-tags-btn"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveTagsId(isTagsOpen ? '' : tagsId)
                                        }}
                                        aria-expanded={isTagsOpen}
                                      >
                                        <Info size={12} strokeWidth={2.2} />
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
                                {curriculum.length ? (
                                  <div className="assessment-page-table-curriculum">{curriculum.join(' / ')}</div>
                                ) : null}
                                {imageRows.length ? (
                                  <div className="assessment-page-table-inline-section">
                                    <div className="assessment-page-table-images" aria-label={`Images for question ${questionNumber}`}>
                                      {imageRows.map((image, imageIndex) => (
                                        <figure key={image.id ?? `${requestId}-image-${imageIndex}`}>
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

                                          return (
                                            <span key={option.id ?? `${requestId}-option-${optionIndex}`} className={isCorrect ? 'is-correct' : ''}>
                                              <strong>{optionLabel}.</strong>
                                              {stripHtml(option.label ?? option.content)}
                                              <span className="question-bank-option-distractor-preview assessment-page-table-option-info">
                                                <button type="button" aria-label={`View distractor errors for option ${optionLabel}`}>
                                                  <Info size={12} strokeWidth={2.2} />
                                                </button>
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
                                <div className="assessment-page-table-inline-section">
                                  {renderReportMetaBadges(request)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <section className="assessment-page-bank-pagination assessment-page-grid-pagination" aria-label="Query request pagination">
              <span className="assessment-page-grid-pagination-summary">
                <span>Page {safeCurrentPage} of {totalPages}</span>
                <span>Showing {pagedRequests.length} of {reportedRequests.length}</span>
              </span>
              <div>
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} strokeWidth={2.3} />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} strokeWidth={2.3} />
                </button>
              </div>
            </section>
          </section>
        ) : (
          <section className="assessment-page-empty">
            <Info size={18} strokeWidth={2.2} />
            <strong>No query requests</strong>
            <p>Reported Medsy questions will appear here.</p>
          </section>
        )}
      </div>
    </section>
  )
}
