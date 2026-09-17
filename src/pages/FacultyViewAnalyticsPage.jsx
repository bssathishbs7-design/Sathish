import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, ChevronDown, Search } from 'lucide-react'
import FloatingTooltip from '../components/FloatingTooltip'
import CompetencyLearningGraphs from '../components/CompetencyLearningGraphs'
import { facultyStudentCard, getFacultyAnalytics } from '../services/facultyAnalytics'
import { getFacultyDisplayAnalytics } from '../services/facultyStudentSamples'
import './CompetencyAnalyticsPage.css'
import './FacultyViewAnalyticsPage.css'

const emptyCard = Object.freeze({})

const score = value => value === null ? '-' : `${Math.round(value)}%`
const marks = value => value === null ? '-' : Number(value.toFixed(1))

/** @param {{card?: object, onBack: function, onViewStudent: function}} props App-owned competency context and navigation. */
export default function FacultyViewAnalyticsPage({ card: selectedCard, onBack, onViewStudent, initialState }) {
  const card = selectedCard ?? emptyCard
  const [practiceId, setPracticeId] = useState(initialState?.practiceId ?? 'all')
  const [query, setQuery] = useState(initialState?.query ?? '')
  const [status, setStatus] = useState(initialState?.status ?? 'all')
  const [page, setPage] = useState(initialState?.page ?? 1)
  const [result, setResult] = useState(null)
  const [reload, setReload] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    let request = 0
    const load = () => {
      const id = ++request
      getFacultyAnalytics(card, practiceId).then(data => {
        if (!cancelled && id === request) { setResult({ card, practiceId, data }); setError(false) }
      }).catch(() => { if (!cancelled && id === request) setError(true) })
    }
    const events = ['storage', 'learn-practice-shared-cards', 'vx-learn-practice-shared-cards', 'focus']
    load()
    events.forEach(event => window.addEventListener(event, load))
    return () => { cancelled = true; events.forEach(event => window.removeEventListener(event, load)) }
  }, [card, practiceId, reload])
  const sourceData = result?.card === card && result.practiceId === practiceId ? result.data : null
  const data = useMemo(() => sourceData ? getFacultyDisplayAnalytics(sourceData) : null, [sourceData])
  const selectedPracticeId = data?.practiceId ?? practiceId
  const displayedCard = data?.card ?? card
  const students = (data?.students ?? []).filter(student => `${student.name} ${student.rollNo}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'all' || student.status === status))
  const pages = Math.max(1, Math.ceil(students.length / 10))
  const currentPage = Math.min(page, pages)
  const visible = students.slice((currentPage - 1) * 10, currentPage * 10)
  return <main className="vx-content competency-analytics faculty-analytics">
    <header className="competency-analytics-header">
      <button type="button" className="ca-back" onClick={onBack}><ArrowLeft size={16} />Back</button>
      <div className="fa-title"><div className="fa-header-meta"><span className="ca-code">{displayedCard.competencyCode}</span><h1>{displayedCard.subject}</h1><span className="fa-header-year">{displayedCard.assignment?.year || displayedCard.year || 'All assigned years'}</span></div><FloatingTooltip className="fa-description" content={displayedCard.competencyName}>{displayedCard.competencyName}</FloatingTooltip></div>
      <label className="fa-practice">Practice<select aria-label="Filter analytics by practice" value={selectedPracticeId} onChange={event => { setPracticeId(event.target.value); setPage(1) }}><option value="all">All practices</option>{(displayedCard.practiceSessions ?? []).map((practice, index) => <option key={practice.id ?? index} value={String(practice.id ?? index)}>Practice {practice.practiceNo ?? index + 1}</option>)}</select></label>
    </header>
    {data?.isSample && <p className="fa-notice" role="status">Sample analytics · These students and scores are demonstration data.</p>}
    {error ? <section className="ca-empty" role="alert"><p>Analytics could not be loaded.</p><button type="button" onClick={() => setReload(value => value + 1)}>Retry</button></section> : !data ? <p role="status">Loading faculty analytics…</p> : <>
      {!data.rosterAvailable && <p className="fa-notice">A complete student roster is not connected. Summary totals use identified submissions saved in this browser; assigned and pending totals are unavailable.</p>}
      <dl className="ca-metrics">{[
        ['Assigned students', data.assigned ?? '-', 'Unique students'],
        ['Students who submitted', data.submitted ?? '-', 'At least one completed attempt'],
        ['Pending students', data.pending ?? '-', 'One or more practices outstanding'],
        ['Average score', score(data.average), 'Latest result per student per practice'],
      ].map(([label, value, hint]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><span className="ca-metric-hint">{hint}</span></div>)}</dl>
      <section className="ca-breakdown-card"><h2>Question type breakdown</h2><p className="ca-caption">Shared question counts and average student marks from latest completed attempts</p><div className="ca-breakdown">{data.breakdown.map(item => <div key={item.label}><div className="ca-breakdown-label"><span>{item.label} · {item.count} {item.count === 1 ? 'question' : 'questions'}</span><strong className="ca-number">{marks(item.obtained)} / {marks(item.total)}</strong></div><meter min="0" max="100" value={Math.min(100, Math.max(0, item.percentage ?? 0))} aria-label={`${item.label} average: ${score(item.percentage)}`} /></div>)}</div></section>
      <CompetencyLearningGraphs analytics={data.tagAnalytics} />
      <section className="fa-students">
        <div className="fa-students-heading"><div className="fa-students-title"><h2>Student performance <span className="ca-code">{students.length}</span></h2><p className="fa-sample-caption">Totals include the students shown for the selected practice.</p></div><div className="fa-student-filters"><label className="fa-search"><Search size={16} /><input type="search" aria-label="Search students by name or ID" placeholder="Search student name or ID..." value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label><div className="fa-status-filter"><select aria-label="Filter students by status" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="all">All statuses</option>{['Submitted', 'In Progress', 'Pending'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div></div></div>
        <div className="fa-table-scroll" tabIndex={0} role="region" aria-label="Student performance table"><table><thead><tr>{['Student Name', 'Roll No./ ID', 'Attempt Status', 'Latest Score', 'Best Score', 'View'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{visible.map(student => <tr key={student.id}><td>{student.name || 'Name unavailable'}</td><td>{student.rollNo || student.id}</td><td><span className="ca-code">{student.status}</span></td><td>{score(student.latestScore)}</td><td>{score(student.bestScore)}</td><td><button type="button" title={`View ${student.name}'s analytics`} aria-label={`View ${student.name}'s analytics`} onClick={() => onViewStudent({ card: { ...facultyStudentCard(displayedCard, student, selectedPracticeId), isFacultyDemo: Boolean(student.isSample) }, name: student.isSample ? `${student.name} (Sample)` : student.name, rollNo: student.rollNo, returnState: { practiceId: selectedPracticeId, query, status, page } })}><BarChart3 size={17} /></button></td></tr>)}{!visible.length && <tr><td colSpan={6} className="fa-no-students">{data.students.length ? 'No students match these filters.' : 'No identified student submissions available.'}</td></tr>}</tbody></table></div>
        <nav className="fa-pagination" aria-label="Student performance pagination"><span>{students.length} {students.length === 1 ? 'student' : 'students'}</span><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></nav>
      </section>
    </>}
  </main>
}

