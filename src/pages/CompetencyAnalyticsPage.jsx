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
    setData(null)
    setError(false)
    const load = async () => {
      try {
        const selected = card ?? JSON.parse(sessionStorage.getItem('vx-start-practice-selected-card') || '{}')
        const result = await getCompetencyAnalytics(selected || {})
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) setError(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [card, reload])
  const attempts = data?.attempts ?? []
  const latest = attempts.at(-1)
  const best = attempts.filter((attempt) => percentage(attempt) !== null).reduce((current, attempt) => !current || percentage(attempt) > percentage(current) ? attempt : current, null)
  const totals = ['mcq', 'saqs', 'laqs'].map((key) => attempts.reduce((sum, attempt) => sum + attempt[key], 0))
  const maxType = Math.max(1, ...totals)

  return (
    <main className="vx-content competency-analytics">
      <header className="competency-analytics-header">
        <button className="ca-back" type="button" title="Back to practice" aria-label="Back to practice" onClick={() => onNavigate(APP_PAGES.START_PRACTICE)}><ArrowLeft size={20} /></button>
        <div><h1>Competency analytics{data?.code ? ` / ${data.code}` : ''}</h1>{data?.name && <p>{data.name}</p>}</div>
      </header>
      {error ? <div className="ca-empty" role="alert"><h2>Analytics could not be loaded</h2><button type="button" onClick={() => setReload((value) => value + 1)}><RefreshCw size={16} />Retry</button></div>
        : !data ? <p role="status">Loading analytics...</p> : <>
          <dl className="ca-metrics">
            {[['Practices', data.practiceCount], ['Completed attempts', attempts.length], ['Latest score', score(latest)], ['Best score', score(best)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {!attempts.length ? <section className="ca-empty"><BarChart3 size={32} /><h2>No completed attempts yet</h2><p>{data.code ? 'Submit a practice to see your results here.' : 'Choose a competency from the practice list to view its results.'}</p><button type="button" onClick={() => onNavigate(APP_PAGES.START_PRACTICE)}>Back to practice</button></section> : <>
            <div className="ca-charts">
              <section><h2>Score trend</h2><p className="ca-caption">Score percentage by completed attempt</p>
                <div className="ca-trend" role="list" aria-label="Scores in chronological order">
                  {attempts.map((attempt, index) => <div className="ca-trend-item" key={attempt.id} role="listitem" tabIndex={0} aria-label={`Attempt ${index + 1}, ${attempt.practice}, ${date(attempt.attemptedAt)}, ${score(attempt)}, ${percentage(attempt) ?? 'unavailable'} percent`}>
                    <span className="ca-number">{percentage(attempt) === null ? '-' : `${percentage(attempt)}%`}</span>
                    <div className="ca-bar-track"><div className="ca-bar" style={{ height: `${Math.min(100, percentage(attempt) ?? 0)}%` }} /></div>
                    <span className="ca-number">{index + 1}</span>
                    <span className="ca-tooltip">{attempt.practice} · {date(attempt.attemptedAt)} · {score(attempt)}</span>
                  </div>)}
                </div>
              </section>
              <section><h2>Question type breakdown</h2><p className="ca-caption">Total earned marks across completed attempts</p>
                <div className="ca-breakdown">{['MCQ', 'SAQ', 'LAQ'].map((label, index) => <div key={label}><div className="ca-breakdown-label"><span>{label}</span><strong className="ca-number">{totals[index]} marks</strong></div><meter min="0" max={maxType} value={totals[index]} aria-label={`${label}: ${totals[index]} earned marks`} /></div>)}</div>
              </section>
            </div>
            <section className="ca-history"><h2>Attempt history</h2><div className="ca-table-scroll" tabIndex={0} role="region" aria-label="Attempt history"><table><thead><tr>{['Practice', 'Submitted', 'Question types', 'Marks', 'Score'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{[...attempts].reverse().map((attempt) => <tr key={attempt.id}><td>{attempt.practice}</td><td>{date(attempt.attemptedAt)}</td><td>{attempt.types || '-'}</td><td className="ca-number">{score(attempt)}</td><td className="ca-number">{percentage(attempt) === null ? '-' : `${percentage(attempt)}%`}</td></tr>)}</tbody></table></div></section>
          </>}
        </>}
    </main>
  )
}
