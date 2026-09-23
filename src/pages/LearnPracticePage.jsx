import PracticeFeaturedCard from '../components/PracticeFeaturedCard'
import { getPracticeOverview } from '../services/practiceOverview'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { useEffect, useMemo, useState } from 'react'
import { Activity, Bone, FlaskConical, Microscope, ScanLine, Stethoscope, Pill, Users, Brain, Eye, Ear, Baby, BarChart3, BookOpenCheck, CheckCircle2, Clock3, LayoutGrid, Play, Search, Trash2, X } from 'lucide-react'
import { corelationRatingRows } from './corelationRatingData'
import { APP_PAGES } from '../config/appPages'
import '../styles/medsy/question-sort-tokens.css'
import '../styles/ospe-activity.css'
import '../styles/my-skills.css'
import './LogbookPage.css'
import '../components/logbook/LogbookStatus.css'
import './LearnPracticePage.css'

const PRACTICE_SUBJECT_ICONS = {
  AN: [Bone, 'amber'], PY: [Activity, 'green'], BI: [FlaskConical, 'teal'],
  PA: [Microscope, 'violet'], MI: [Microscope, 'amber'], PH: [Pill, 'violet'],
  RD: [ScanLine, 'violet'], CM: [Users, 'green'], PS: [Brain, 'violet'],
  OP: [Eye, 'teal'], EN: [Ear, 'amber'], PE: [Baby, 'green'],
}
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
const getCardSubject = (card) => (
  card?.subject
  || getCardFirstQuestionValue(card, 'subject')
  || getCompetencyRow(card?.competencyCode)?.subject
  || 'Human Anatomy'
)
/** Resolve the assigned year, falling back to the competency curriculum. */
const getCardYear = (card) => (
  card?.assignment?.year || card?.year || getCardFirstQuestionValue(card, 'year')
  || getCompetencyRow(card?.competencyCode)?.year || 'Year not specified'
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
          sharedToStudents: _sharedToStudents,
          shareToStudents: _shareToStudents,
          isSharedToStudents: _isSharedToStudents,
          sharedWithStudents: _sharedWithStudents,
          sharedStudentIds: _sharedStudentIds,
          studentShareIds: _studentShareIds,
          sharedToStudentsAt: _sharedToStudentsAt,
          sharedAssignment: _sharedAssignment,
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

function LearnPracticePage({ onNavigate, onOpenAnalytics }) {
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

  const overview = getPracticeOverview(practiceCards)
  const metrics = [
    { label: 'Available practice', value: overview.available, icon: BookOpenCheck, tone: 'amber' },
    { label: 'In progress', value: overview.inProgress, icon: Clock3, tone: 'green' },
    { label: 'Completed', value: overview.completed, icon: CheckCircle2, tone: 'teal' },
    { label: 'Questions to practise', value: overview.remaining, icon: LayoutGrid, tone: 'violet' },
  ]
  const featuredItems = practiceCards.map((card, index) => {
    const summary = getPracticeOverview([card])
    const dates = [card.lastSharedAt, card.sharedAt, card.createdAt, ...(card.practiceSessions || []).map(session => session.sharedAt || session.createdAt)]
    return { key: String(card.id || card.competencyCode || index), card, subject: getCardSubject(card), year: getCardYear(card), started: summary.inProgress > 0, remaining: summary.remaining, shared: Math.max(0, ...dates.map(date => Date.parse(date) || 0)) }
  }).filter(item => item.remaining > 0).sort((a, b) => b.shared - a.shared).slice(0, 4)
  const hasSearch = Boolean(query.trim())
  const filterOptions = [
    { key: 'in-progress', label: 'Live practice', count: practiceStatusCounts.inProgress },
    { key: 'completed', label: 'Completed', count: practiceStatusCounts.completed },
    { key: 'all', label: 'All practice', count: practiceStatusCounts.all },
  ]
  const openPracticeCard = (card, analytics = false) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(START_PRACTICE_SELECTED_CARD_KEY, JSON.stringify(card))
      window.sessionStorage.setItem(
        START_PRACTICE_DEFAULT_FILTER_KEY,
        getPracticeCardStatus(card) === 'In Progress' ? 'in-progress' : 'all',
      )
    }
    if (analytics) {
      onOpenAnalytics?.({ card, filter: 'all', page: 0 })
    } else {
      onNavigate?.(APP_PAGES.START_PRACTICE)
    }
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
    <section className="vx-content ospe-page my-skills-page logbook-scope lb-page learn-practice-page">
      <div className="ospe-shell my-skills-shell lb-shell learn-practice-shell">
        <PageNavigationHeader items={['My Pages', 'Learn & Practice']} />
        <header className="my-skills-overview lb-page-head learn-practice-page-head">
          <div className="my-skills-overview-main">
            <span className="ospe-kicker">My learning</span>
            <div className="my-skills-overview-copy"><h1>Learn & Practice</h1><p>Practise shared questions, build your understanding and follow your progress.</p></div>
          </div>
          <PracticeFeaturedCard items={featuredItems} onOpen={openPracticeCard} />
        </header>
        <section className="learn-practice-metrics" aria-label="Practice overview">
          {metrics.map(({ label, value, icon, tone }) => {
            const MetricIcon = icon
            return <div className="learn-practice-metric" data-tone={tone} key={label}>
            <span className="learn-practice-metric-icon"><MetricIcon size={18} aria-hidden="true" /></span>
            <div><strong>{value}</strong><span>{label}</span></div>
          </div>})}
        </section>
        <div className="learn-practice-filter-bar" aria-label="Shared practice filters">
          <div className="learn-practice-filter-group" role="group" aria-label="Filter practice cards by status">
            {filterOptions.map(option => {
              const FilterIcon = { 'in-progress': Clock3, completed: CheckCircle2, all: LayoutGrid }[option.key]
              return <button key={option.key} type="button" className={'my-skills-filter-chip learn-practice-filter-btn' + (statusFilter === option.key ? ' is-active' : '')} onClick={() => setStatusFilter(option.key)} aria-pressed={statusFilter === option.key}><FilterIcon size={15} aria-hidden="true" />{option.label}<span>{option.count}</span></button>
            })}
          </div>
          <div className="learn-practice-toolbar">
            <label className="lb-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search practice" value={query} placeholder="Search competency or subject" onChange={event => setQuery(event.target.value)} /></label>
            {practiceCards.length > 0 && <button type="button" className="lb-icon-btn learn-practice-delete-btn" onClick={deleteAllPracticeCards} aria-label="Delete all shared practice cards" title="Delete all shared practice cards"><Trash2 size={16} aria-hidden="true" /></button>}
            {hasSearch && <button type="button" className="lb-btn" onClick={() => setQuery('')}><X size={14} aria-hidden="true" />Clear</button>}
          </div>
        </div>
        <section className="learn-practice-results" aria-label="Shared practice">
          <div className="learn-practice-card-grid">
            {filteredCards.map(card => {
              const competencyName = card.competencyName || ('Competency ' + card.competencyCode)
              const pendingCounts = getPendingPracticeTypeCounts(card)
              const [SubjectIcon, subjectTone] = PRACTICE_SUBJECT_ICONS[String(card.competencyCode || '').match(/^[a-z]+/i)?.[0]?.toUpperCase()] || [Stethoscope, 'teal']
              const cardOverview = getPracticeOverview([card])
              const cardStatus = cardOverview.completed ? 'Completed' : cardOverview.inProgress ? 'In progress' : getPracticeCardStatus(card) === 'Complete' ? 'Expired' : 'Not started'
              return <article key={card.id ?? card.competencyCode} className="learn-practice-card" data-tone={subjectTone}>
                <div className="learn-practice-card-head"><span className="learn-practice-card-icon"><SubjectIcon size={20} aria-hidden="true" /></span><span className="learn-practice-card-context"><span>{getCardSubject(card)}</span><span className="learn-practice-card-year">{getCardYear(card)}</span></span><span className={'lb-status ' + (cardStatus === 'Completed' ? 'is-approved' : 'is-pending')}>{cardStatus}</span></div>
                <div className="learn-practice-card-title"><h3 title={card.competencyCode + ": " + competencyName}><span className="learn-practice-title-code">{card.competencyCode}</span>{" "}{competencyName}</h3></div>
                <div className="learn-practice-question-mix" aria-label={card.competencyCode + ' question type counts'}>
                  {[['mcq', 'MCQ'], ['saqs', 'SAQs'], ['laqs', 'LAQs']].map(([key, label]) => <div className="learn-practice-question-type" key={key}><span className="learn-practice-question-total"><strong>{card[key] || '-'}</strong><span>{label}</span></span>{pendingCounts[key] > 0 && <span className="learn-practice-notification-badge" title={pendingCounts[key] + ' questions in live practice'} aria-label={pendingCounts[key] + ' ' + label + ' questions in live practice'}>{pendingCounts[key]}</span>}</div>)}
                </div>
                <footer className="learn-practice-footer"><button type="button" className="lb-btn learn-practice-analytics-btn" aria-label={'View analytics for ' + card.competencyCode} onClick={() => openPracticeCard(card, true)}><BarChart3 size={16} aria-hidden="true" />Analytics</button><button type="button" className="lb-btn lb-primary learn-practice-start-btn" onClick={() => openPracticeCard(card)}><Play size={14} aria-hidden="true" />Start practice</button></footer>
              </article>
            })}
            {!filteredCards.length && <div className="lb-card lb-empty learn-practice-empty"><BookOpenCheck size={28} aria-hidden="true" /><h3>{practiceCards.length ? 'No matching practice' : 'No shared practice yet'}</h3><p>{practiceCards.length ? 'Try another search or status filter.' : 'Practice shared by your faculty will appear here.'}</p></div>}
          </div>
        </section>
      </div>
    </section>
  )
}

export default LearnPracticePage
