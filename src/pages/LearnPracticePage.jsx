import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Info, Play, Search, Trash2, X } from 'lucide-react'
import { corelationRatingRows } from './corelationRatingData'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'
import './LearnPracticePage.css'

const LEARN_PRACTICE_SHARED_CARDS_KEY = 'vx-learn-practice-shared-cards'
const START_PRACTICE_SELECTED_CARD_KEY = 'vx-start-practice-selected-card'
const START_PRACTICE_DEFAULT_FILTER_KEY = 'vx-start-practice-default-filter'
const QUESTION_BANK_STORAGE_KEYS = [
  'vx-question-bank-published-questions',
  'vx-question-bank-uploaded-questions',
  'vx-question-bank-questions',
]

const readSharedPracticeCards = () => {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEARN_PRACTICE_SHARED_CARDS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getCardFirstQuestionValue = (card, key) => (
  (Array.isArray(card?.questions) ? card.questions : []).find((question) => question?.[key])?.[key] ?? ''
)

const normalizeCompetencyCode = (value) => String(value ?? '').replace(/\s+/g, '').toUpperCase()
const getCompetencyRow = (code) => corelationRatingRows.find((row) => (
  normalizeCompetencyCode(row.code) === normalizeCompetencyCode(code)
))
const getCardYear = (card) => card?.assignment?.year || card?.year || 'Not assigned'
const getCardSubject = (card) => (
  card?.subject
  || getCardFirstQuestionValue(card, 'subject')
  || getCompetencyRow(card?.competencyCode)?.subject
  || 'Human Anatomy'
)
const FINISHED_PRACTICE_STATUSES = new Set(['complete', 'completed', 'expired'])
const getCardPracticeSessions = (card = {}) => {
  if (Array.isArray(card.practiceSessions) && card.practiceSessions.length) return card.practiceSessions
  return Array.isArray(card.questions) && card.questions.length
    ? [{
        status: card.status || 'In Progress',
        questions: card.questions,
        mcq: Number(card.mcq || 0),
        saqs: Number(card.saqs || 0),
        laqs: Number(card.laqs || 0),
      }]
    : []
}
const getPracticeQuestionType = (question = {}) => {
  const type = String(question.type ?? question.questionType ?? '').toLowerCase()
  if (type.includes('mcq') || type.includes('multiple')) return 'mcq'
  if (type.includes('laq') || type.includes('long')) return 'laqs'
  if (type.includes('saq') || type.includes('short')) return 'saqs'
  return question.options?.length ? 'mcq' : ''
}
const getSessionTypeCount = (session = {}, typeKey = '') => {
  const directValue = Number(session[typeKey] || 0)
  if (directValue > 0) return directValue

  const questions = Array.isArray(session.questions) ? session.questions : []
  return questions.filter((question) => getPracticeQuestionType(question) === typeKey).length
}
const getPendingPracticeTypeCounts = (card = {}) => {
  const sessions = getCardPracticeSessions(card)
  return sessions.reduce((counts, session) => {
    const status = String(session?.status ?? 'In Progress').trim().toLowerCase()
    if (FINISHED_PRACTICE_STATUSES.has(status)) return counts

    return {
      mcq: counts.mcq + getSessionTypeCount(session, 'mcq'),
      saqs: counts.saqs + getSessionTypeCount(session, 'saqs'),
      laqs: counts.laqs + getSessionTypeCount(session, 'laqs'),
    }
  }, { mcq: 0, saqs: 0, laqs: 0 })
}
const getPracticeCardStatus = (card = {}) => {
  const sessions = getCardPracticeSessions(card)
  const isComplete = sessions.length > 0 && sessions.every((session) => (
    FINISHED_PRACTICE_STATUSES.has(String(session?.status ?? '').trim().toLowerCase())
  ))

  return isComplete ? 'Complete' : 'In Progress'
}

const clearQuestionShareState = (questionIds = []) => {
  if (typeof window === 'undefined' || !questionIds.length) return

  const questionIdSet = new Set(questionIds.map((id) => String(id ?? '').trim()).filter(Boolean))
  QUESTION_BANK_STORAGE_KEYS.forEach((storageKey) => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
      if (!Array.isArray(parsed)) return

      let didUpdate = false
      const nextQuestions = parsed.map((question) => {
        if (!questionIdSet.has(String(question?.id ?? ''))) return question
        didUpdate = true
        const {
          sharedToStudents,
          shareToStudents,
          isSharedToStudents,
          sharedWithStudents,
          sharedStudentIds,
          studentShareIds,
          sharedToStudentsAt,
          sharedAssignment,
          ...restQuestion
        } = question

        return restQuestion
      })

      if (didUpdate) window.localStorage.setItem(storageKey, JSON.stringify(nextQuestions))
    } catch {
      // Ignore malformed storage entries so deleting the practice card still succeeds.
    }
  })

  window.dispatchEvent(new Event('question-bank-published-questions'))
  window.dispatchEvent(new Event('question-bank-uploaded-questions'))
}

function LearnPracticePage({ onNavigate }) {
  const [practiceCards, setPracticeCards] = useState(() => readSharedPracticeCards())
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('in-progress')

  useEffect(() => {
    const syncCards = () => setPracticeCards(readSharedPracticeCards())

    window.addEventListener('storage', syncCards)
    window.addEventListener('learn-practice-shared-cards', syncCards)

    return () => {
      window.removeEventListener('storage', syncCards)
      window.removeEventListener('learn-practice-shared-cards', syncCards)
    }
  }, [])

  const practiceStatusCounts = useMemo(() => practiceCards.reduce((counts, card) => {
    const status = getPracticeCardStatus(card)
    if (status === 'Complete') {
      counts.completed += 1
    } else {
      counts.inProgress += 1
    }
    counts.all += 1
    return counts
  }, { all: 0, inProgress: 0, completed: 0 }), [practiceCards])

  useEffect(() => {
    if (statusFilter === 'in-progress' && practiceStatusCounts.inProgress === 0) {
      setStatusFilter('all')
    }
  }, [practiceStatusCounts.inProgress, statusFilter])

  const filteredCards = useMemo(() => {
    const searchText = query.trim().toLowerCase()
    const statusFilteredCards = practiceCards.filter((card) => {
      const status = getPracticeCardStatus(card)
      if (statusFilter === 'completed') return status === 'Complete'
      if (statusFilter === 'in-progress') return status === 'In Progress'
      return true
    })

    if (!searchText) return statusFilteredCards

    return statusFilteredCards.filter((card) => (
      String(card?.competencyCode ?? '').toLowerCase().includes(searchText)
      || String(card?.competencyName ?? '').toLowerCase().includes(searchText)
      || String(getCardSubject(card)).toLowerCase().includes(searchText)
      || String(getCardFirstQuestionValue(card, 'topic')).toLowerCase().includes(searchText)
      || String(getCardFirstQuestionValue(card, 'topics')).toLowerCase().includes(searchText)
    ))
  }, [practiceCards, query, statusFilter])

  const hasSearch = Boolean(query.trim())
  const filterOptions = [
    { key: 'in-progress', label: 'In Progress', count: practiceStatusCounts.inProgress },
    { key: 'completed', label: 'Completed', count: practiceStatusCounts.completed },
    { key: 'all', label: 'All Practice', count: practiceStatusCounts.all },
  ]
  const startPractice = (card) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(card))
      window.sessionStorage.setItem(
        START_PRACTICE_DEFAULT_FILTER_KEY,
        getPracticeCardStatus(card) === 'In Progress' ? 'in-progress' : 'all',
      )
    }
    onNavigate?.(APP_PAGES.START_PRACTICE)
  }
  const deleteAllPracticeCards = () => {
    const deletedQuestionIds = practiceCards.flatMap((card) => [
      ...(Array.isArray(card?.questions) ? card.questions.map((question) => question?.id) : []),
      ...(Array.isArray(card?.practiceSessions)
        ? card.practiceSessions.flatMap((session) => (
            Array.isArray(session?.questions) ? session.questions.map((question) => question?.id) : []
          ))
        : []),
    ])
    setPracticeCards([])
    window.localStorage.setItem(LEARN_PRACTICE_SHARED_CARDS_KEY, JSON.stringify([]))
    clearQuestionShareState(deletedQuestionIds)
    window.dispatchEvent(new Event('learn-practice-shared-cards'))
  }

  return (
    <section className="vx-content assessment-page is-my-assessment learn-practice-page">
      <div className="assessment-page-shell">
        <section className="assessment-create-draft-shell assessment-create-published-shell my-assessment-published-shell learn-practice-shell" aria-label="Learn and practice shared cards">
          <>
            <div className="assessment-create-card-heading learn-practice-title-row">
              <h2>Shared Practice</h2>
            </div>
            {practiceCards.length ? (
              <div className="learn-practice-filter-bar" aria-label="Shared practice filters">
                <div className="learn-practice-filter-group" role="group" aria-label="Filter practice cards by status">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`learn-practice-filter-btn ${statusFilter === option.key ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter(option.key)}
                      aria-pressed={statusFilter === option.key}
                    >
                      {option.label}
                      <span>{option.count}</span>
                    </button>
                  ))}
                </div>
                <div className="assessment-create-published-toolbar my-assessment-toolbar learn-practice-toolbar">
                <label className="assessment-create-published-search">
                  <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search Practice..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                {hasSearch ? (
                  <button type="button" className="assessment-create-published-clear-btn" onClick={() => setQuery('')}>
                    <X size={14} strokeWidth={2.3} />
                    Clear
                  </button>
                ) : null}
                </div>
              </div>
            ) : null}
          </>

          {practiceCards.length ? (
            <>
              <div className="assessment-create-draft-grid my-assessment-published-grid learn-practice-card-grid">
                {filteredCards.length ? filteredCards.map((card) => {
                  const competencyName = card.competencyName || `Competency ${card.competencyCode}`
                  const pendingCounts = getPendingPracticeTypeCounts(card)
                  const cardStatus = getPracticeCardStatus(card)

                  return (
                    <article
                      key={card.id ?? card.competencyCode}
                      className={`assessment-create-draft-card assessment-create-published-card learn-practice-card ${cardStatus === 'In Progress' ? 'is-in-progress' : 'is-complete'}`}
                    >
                      <div className="assessment-create-published-head">
                        <div className="learn-practice-card-title">
                          <small className="learn-practice-card-context">
                            {getCardSubject(card)}
                          </small>
                          <strong>{competencyName}</strong>
                        </div>
                      </div>

                      <span className="assessment-create-published-status-row">
                        <span
                          className="assessment-create-published-schedule-badge learn-practice-code-badge"
                          tabIndex={0}
                          aria-label={`${card.competencyCode} ${competencyName}`}
                          data-tooltip={competencyName}
                        >
                          {card.competencyCode}
                          <Info size={11} strokeWidth={2.4} />
                        </span>
                        <span className={`learn-practice-status-badge ${cardStatus === 'Complete' ? 'is-complete' : 'is-progress'}`}>
                          {cardStatus}
                        </span>
                      </span>

                      <div className="learn-practice-question-mix" aria-label={`${card.competencyCode} question type counts`}>
                        <span>
                          {pendingCounts.mcq > 0 ? <b className="learn-practice-notification-badge">{pendingCounts.mcq}</b> : null}
                          <strong>{card.mcq || 0}</strong>
                          <em>MCQ</em>
                        </span>
                        <span>
                          {pendingCounts.saqs > 0 ? <b className="learn-practice-notification-badge">{pendingCounts.saqs}</b> : null}
                          <strong>{card.saqs || 0}</strong>
                          <em>SAQs</em>
                        </span>
                        <span>
                          {pendingCounts.laqs > 0 ? <b className="learn-practice-notification-badge">{pendingCounts.laqs}</b> : null}
                          <strong>{card.laqs || 0}</strong>
                          <em>LAQs</em>
                        </span>
                      </div>

                      <div className="assessment-create-draft-footer assessment-create-published-footer learn-practice-footer">
                        <button type="button" className="my-assessment-card-action is-start" onClick={() => startPractice(card)}>
                          <Play size={14} strokeWidth={2.3} />
                          Start Practice
                        </button>
                      </div>
                    </article>
                  )
                }) : (
                  <div className="assessment-create-placeholder my-assessment-empty-state">
                    <p>No practice cards match your search.</p>
                  </div>
                )}
              </div>
              <div className="learn-practice-bottom-actions">
                <button
                  type="button"
                  className="learn-practice-delete-btn learn-practice-delete-all-btn"
                  onClick={deleteAllPracticeCards}
                  aria-label="Delete all shared practice cards"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                </button>
              </div>
            </>
          ) : (
            <div className="assessment-create-placeholder my-assessment-empty-state learn-practice-empty">
              <span aria-hidden="true"><CheckCircle2 size={24} strokeWidth={2.2} /></span>
              <p>No shared practice cards yet.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default LearnPracticePage
