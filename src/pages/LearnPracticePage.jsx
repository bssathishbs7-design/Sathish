import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Info, Play, Search, Trash2, X } from 'lucide-react'
import { corelationRatingRows } from './corelationRatingData'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'
import './LearnPracticePage.css'

const LEARN_PRACTICE_SHARED_CARDS_KEY = 'vx-learn-practice-shared-cards'
const START_PRACTICE_SELECTED_CARD_KEY = 'vx-start-practice-selected-card'
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

  useEffect(() => {
    const syncCards = () => setPracticeCards(readSharedPracticeCards())

    window.addEventListener('storage', syncCards)
    window.addEventListener('learn-practice-shared-cards', syncCards)

    return () => {
      window.removeEventListener('storage', syncCards)
      window.removeEventListener('learn-practice-shared-cards', syncCards)
    }
  }, [])

  const filteredCards = useMemo(() => {
    const searchText = query.trim().toLowerCase()
    if (!searchText) return practiceCards

    return practiceCards.filter((card) => (
      String(card?.competencyCode ?? '').toLowerCase().includes(searchText)
      || String(card?.competencyName ?? '').toLowerCase().includes(searchText)
    ))
  }, [practiceCards, query])

  const hasSearch = Boolean(query.trim())
  const startPractice = (card) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(card))
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
          <div className="assessment-create-card-heading">
            <h2>Shared Practice</h2>
            {practiceCards.length ? (
              <div className="assessment-create-published-toolbar my-assessment-toolbar learn-practice-toolbar">
                <label className="assessment-create-published-search">
                  <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search competency..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                {hasSearch ? (
                  <button type="button" className="assessment-create-published-clear-btn" onClick={() => setQuery('')}>
                    <X size={14} strokeWidth={2.3} />
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  className="learn-practice-delete-btn learn-practice-delete-all-btn"
                  onClick={deleteAllPracticeCards}
                  aria-label="Delete all shared practice cards"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          {practiceCards.length ? (
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
