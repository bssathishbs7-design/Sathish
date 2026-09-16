import CompetencyLearningGraphs from '../components/CompetencyLearningGraphs'
import { useEffect, useState } from 'react'
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import { getCompetencyAnalytics } from '../services/competencyAnalytics'
import './CompetencyAnalyticsPage.css'

const percentage = (attempt) => attempt?.total > 0 ? Math.round(attempt.obtained / attempt.total * 100) : null
const score = (attempt) => attempt ? `${attempt.obtained}/${attempt.total}` : '-'
const date = (value) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Date unavailable'

/** @param {{card?: object, onNavigate: function}} props Selected competency and app-owned navigation. */
export default function CompetencyAnalyticsPage({ card, onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let cancelled = false
    let requestId = 0
    setData(null)
    setError(false)
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
  const attempts = data?.attempts ?? []
  const latest = attempts.at(-1)
  const best = attempts.filter((attempt) => percentage(attempt) !== null).reduce((current, attempt) => !current || percentage(attempt) > percentage(current) ? attempt : current, null)

  return (
    <main className="vx-content competency-analytics">
      <header className="competency-analytics-header">
        <button className="ca-back" type="button" title="Back to practice" aria-label="Back to practice" onClick={() => onNavigate(APP_PAGES.START_PRACTICE)}><ArrowLeft size={18} /><span>Back</span></button>
        <h1 aria-label={`Competency analytics${data?.code ? ` / ${data.code}` : ''}`}>{data?.code || 'Competency analytics'}</h1>{data?.name && <p>{data.name}</p>}
      </header>
      {error ? <div className="ca-empty" role="alert"><h2>Analytics could not be loaded</h2><button type="button" onClick={() => setReload((value) => value + 1)}><RefreshCw size={16} />Retry</button></div>
        : !data ? <p role="status">Loading analytics...</p> : <>
          <div className="ca-overview">
          <dl className="ca-metrics" aria-label="Practice summary">
            {[['Practices', data.practiceCount], ['Attempts', attempts.length], ['Latest score', score(latest)], ['Best score', score(best)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
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
          {!attempts.length ? <section className="ca-empty"><BarChart3 size={32} /><h2>No completed attempts yet</h2><p>{data.code ? 'Submit a practice to see your results here.' : 'Choose a competency from the practice list to view its results.'}</p><button type="button" onClick={() => onNavigate(APP_PAGES.START_PRACTICE)}>Back to practice</button></section> : <>
            <section className="ca-history"><h2>Attempt history</h2><div className="ca-table-scroll" tabIndex={0} role="region" aria-label="Attempt history"><table><thead><tr>{['Practice', 'Submitted', 'Question types', 'Marks', 'Score'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{[...attempts].reverse().map((attempt) => <tr key={attempt.id}><td>{attempt.practice}</td><td>{date(attempt.attemptedAt)}</td><td>{attempt.types || '-'}</td><td className="ca-number">{score(attempt)}</td><td className="ca-number">{percentage(attempt) === null ? '-' : `${percentage(attempt)}%`}</td></tr>)}</tbody></table></div></section>
          </>}
        </>}
    </main>
  )
}
