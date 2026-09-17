import CompetencyLearningGraphs from '../components/CompetencyLearningGraphs'
import AttemptBloomDialog from '../components/AttemptBloomDialog'
import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import { getCompetencyAnalytics } from '../services/competencyAnalytics'
import './CompetencyAnalyticsPage.css'

const percentage = (attempt) => attempt?.total > 0 ? Math.round(attempt.obtained / attempt.total * 100) : null
const score = (attempt) => attempt ? `${attempt.obtained}/${attempt.total}` : '-'
const date = (value) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Date unavailable'

/** @param {{card?: object, onNavigate: function}} props Selected competency and app-owned navigation. */
export default function CompetencyAnalyticsPage({ card, onNavigate, onBack, studentLabel }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  useEffect(() => {
    let cancelled = false
    let requestId = 0
    setData(null)
    setError(false)
    setSelectedAttempt(null)
    const load = async () => {
      const currentRequest = ++requestId
      try {
        const selected = card ?? JSON.parse(sessionStorage.getItem('vx-start-practice-selected-card') || '{}')
        const result = await getCompetencyAnalytics(selected || {})
        if (!cancelled && currentRequest === requestId) { setData(result); setError(false) }
      } catch {
        if (!cancelled && currentRequest === requestId) setError(true)
      }
    }
    load()
    const sourceEvents = ['question-bank-published-questions', 'question-bank-uploaded-questions', 'learn-practice-shared-cards', 'focus']
    const refreshStoredSources = (event) => {
      if (!event.key || ['vx-question-bank-published-questions', 'vx-question-bank-uploaded-questions', 'vx-question-bank-questions'].includes(event.key)) load()
    }
    sourceEvents.forEach(event => window.addEventListener(event, load))
    window.addEventListener('storage', refreshStoredSources)
    return () => {
      cancelled = true
      sourceEvents.forEach(event => window.removeEventListener(event, load))
      window.removeEventListener('storage', refreshStoredSources)
    }
  }, [card, reload])
  const practiceAttemptCounts = new Map()
  const attempts = (data?.attempts ?? []).map(attempt => {
    const practiceKey = attempt.practiceId ?? attempt.practice
    const number = (practiceAttemptCounts.get(practiceKey) ?? 0) + 1
    practiceAttemptCounts.set(practiceKey, number)
    return { ...attempt, attemptNumber: attempt.attemptNumber ?? number }
  })
  const latest = attempts.at(-1)
  const best = attempts.filter((attempt) => percentage(attempt) !== null).reduce((current, attempt) => !current || percentage(attempt) > percentage(current) ? attempt : current, null)

  return (
    <main className="vx-content competency-analytics">
      <header className="competency-analytics-header">
        <button className="ca-back" type="button" title={onBack ? "Back to faculty analytics" : "Back to practice"} aria-label={onBack ? "Back to faculty analytics" : "Back to practice"} onClick={() => onBack ? onBack() : onNavigate(APP_PAGES.START_PRACTICE)}><ArrowLeft size={16} /><span>Back</span></button>
        <div className="ca-heading">
          {studentLabel && <strong>{studentLabel}</strong>}
          {data?.code && <span className="ca-code">{data.code}</span>}
          {data?.name && <p className="ca-competency-description" title={data.name}>{data.name}</p>}
        </div>
      </header>
      {error ? <div className="ca-empty" role="alert"><h2>Analytics could not be loaded</h2><button type="button" onClick={() => setReload((value) => value + 1)}><RefreshCw size={16} />Retry</button></div>
        : !data ? <div className="ca-empty" role="status"><RefreshCw size={24} /><p>Loading analytics…</p></div> : <>
          <div className="ca-overview">
          <dl className="ca-metrics" aria-label="Practice summary">
            {[['Practices', data.practiceCount, 'Available practices'], ['Attempts', attempts.length, 'Completed submissions'], ['Latest score', score(latest), 'Most recent attempt'], ['Best score', score(best), 'Highest percentage']].map(([label, value, hint]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><span className="ca-metric-hint">{hint}</span></div>)}
          </dl>
              <section className="ca-breakdown-card"><h2>Question type breakdown</h2><p className="ca-caption">Marks and question counts across completed attempts</p>
                <div className="ca-breakdown">{data.breakdown.map(({ label, obtained, total, count }) => (
                  <div key={label}>
                    <div className="ca-breakdown-label">
                      <span>{label} · <span className="ca-number">{count}</span> {count === 1 ? 'question' : 'questions'}</span>
                      <strong className="ca-number">{obtained}/{total} marks</strong>
                    </div>
                    <meter min="0" max={total || 1} value={Math.min(obtained, total)} aria-label={`${label}: ${count} ${count === 1 ? 'question' : 'questions'}, ${obtained} out of ${total} marks`} />
                  </div>
                ))}</div>
              </section>
          </div>
          <CompetencyLearningGraphs analytics={data.tagAnalytics} />
          {!attempts.length ? <section className="ca-empty"><BarChart3 size={32} /><h2>No completed attempts yet</h2><p>{data.code ? (studentLabel ? 'No completed attempts are available for this student.' : 'Submit a practice to see your results here.') : 'Choose a competency from the practice list to view its results.'}</p><button type="button" onClick={() => onBack ? onBack() : onNavigate(APP_PAGES.START_PRACTICE)}>{onBack ? 'Back to faculty analytics' : 'Back to practice'}</button></section> : <>
            <section className="ca-history"><div className="ca-section-heading"><h2>Attempt history</h2><span className="ca-code">{attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}</span></div><div className="ca-table-scroll" tabIndex={0} role="region" aria-label="Attempt history"><table><thead><tr>{['Practice', 'Submitted', 'Question types', 'Attempts', 'Marks', 'Score', 'View'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{[...attempts].reverse().map((attempt) => <tr key={attempt.id}><td data-label="Practice">{attempt.practice}</td><td data-label="Submitted">{date(attempt.attemptedAt)}</td><td data-label="Question types">{attempt.types || '-'}</td><td data-label="Attempts" className="ca-number">{attempt.attemptNumber}</td><td data-label="Marks" className="ca-number">{score(attempt)}</td><td data-label="Score" className="ca-number"><span className="ca-score">{percentage(attempt) === null ? '-' : `${percentage(attempt)}%`}</span></td><td data-label="View" className="ca-view-cell"><button type="button" className="ca-view-analytics" title="View analytics" aria-label={`View analytics for ${attempt.practice}, ${date(attempt.attemptedAt)}`} onClick={() => setSelectedAttempt(attempt)}><BarChart3 size={18} aria-hidden="true" /></button></td></tr>)}</tbody></table></div></section>
          </>}
        </>}
      {selectedAttempt && <AttemptBloomDialog attempt={selectedAttempt} submittedLabel={date(selectedAttempt.attemptedAt)} onClose={() => setSelectedAttempt(null)} />}
    </main>
  )
}
