import { useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  Rows3,
  Search,
  Shapes,
  Users,
} from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/evaluation.css'
import { skillAssessmentActivities } from './skillAssessmentData'

const normalizeDate = (value) => (value ? String(value).split(',')[0].trim() : '')

const buildFallbackRecords = () => skillAssessmentActivities.slice(0, 8).map((activity, index) => ({
  id: `evaluation-${activity.id}`,
  activityName: activity.name,
  activityType: activity.skillType,
  studentCount: 24 + (index * 4),
  year: activity.year,
  sgt: activity.sgt,
  attemptCount: `${(index % 3) + 1} / 3`,
  createdDate: `0${(index % 8) + 1}/04/2026`,
  evaluationStatus: index % 3 === 0 ? 'Completed Evaluation' : 'Pending Evaluation',
  questionCount: 2 + (index % 4),
}))

function EvaluationCard({ record, onOpenEvaluation }) {
  const isCompleted = record.evaluationStatus === 'Completed Evaluation'
  const statusLabel = isCompleted ? 'Completed' : 'Pending'

  return (
    <article className="eval-card">
      <div className="eval-card-top">
        <div className="eval-card-topline">
          <span className="eval-type-chip">{record.activityType}</span>
          <span className={`eval-status-pill ${isCompleted ? 'is-complete' : 'is-pending'}`}>
            {statusLabel}
          </span>
        </div>

        <div className="eval-card-title">
          <h3>{record.activityName}</h3>
          <p>{record.year || 'Not set'} • {record.sgt || 'Not set'} • {record.studentCount ?? 0} students</p>
        </div>
      </div>

      <div className="eval-card-meta">
        <div className="eval-card-meta-item">
          <span><Users size={12} strokeWidth={2} /> Students</span>
          <strong>{record.studentCount ?? 0}</strong>
        </div>
        <div className="eval-card-meta-item">
          <span><GraduationCap size={12} strokeWidth={2} /> Year</span>
          <strong>{record.year || 'Not set'}</strong>
        </div>
        <div className="eval-card-meta-item">
          <span><FolderKanban size={12} strokeWidth={2} /> SGT</span>
          <strong>{record.sgt || 'Not set'}</strong>
        </div>
        <div className="eval-card-meta-item">
          <span><Shapes size={12} strokeWidth={2} /> Attempt</span>
          <strong>{record.attemptCount || 'Not set'}</strong>
        </div>
      </div>

      <div className="eval-card-foot">
        <div className="eval-card-foot-copy">
          <span><CalendarDays size={12} strokeWidth={2} /> {normalizeDate(record.createdDate) || 'Not set'}</span>
          <small>{record.questionCount ?? 0} checkpoints</small>
        </div>
        <button type="button" className="tool-btn green eval-action-btn" onClick={() => onOpenEvaluation(record)}>
          {isCompleted ? 'View' : 'Start'}
        </button>
      </div>
    </article>
  )
}

function EvaluationTable({ records, onOpenEvaluation }) {
  return (
    <div className="eval-table-wrap">
      <table className="eval-table">
        <thead>
          <tr>
            <th>Activity</th>
            <th>Type</th>
            <th>Year</th>
            <th>SGT</th>
            <th>Students</th>
            <th>Attempt</th>
            <th>Created</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const isCompleted = record.evaluationStatus === 'Completed Evaluation'

            return (
              <tr key={record.id}>
                <td>
                  <div className="eval-table-title">
                    <strong>{record.activityName}</strong>
                    <span>{record.questionCount ?? 0} checkpoints</span>
                  </div>
                </td>
                <td><span className="eval-type-chip">{record.activityType}</span></td>
                <td>{record.year || 'Not set'}</td>
                <td>{record.sgt || 'Not set'}</td>
                <td>{record.studentCount ?? 0}</td>
                <td>{record.attemptCount || 'Not set'}</td>
                <td>{normalizeDate(record.createdDate) || 'Not set'}</td>
                <td>
                  <span className={`eval-status-pill ${isCompleted ? 'is-complete' : 'is-pending'}`}>
                    {isCompleted ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td>
                  <button type="button" className="tool-btn green eval-table-action" onClick={() => onOpenEvaluation(record)}>
                    {isCompleted ? 'View' : 'Start'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function SkillAssessmentPage({ onAlert, evaluationRecords = [] }) {
  const [viewMode, setViewMode] = useState('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSgt, setSelectedSgt] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedActivityType, setSelectedActivityType] = useState('')

  const sourceRecords = evaluationRecords.length ? evaluationRecords : buildFallbackRecords()

  const yearOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.year).filter(Boolean))], [sourceRecords])
  const sgtOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.sgt).filter(Boolean))], [sourceRecords])
  const activityTypeOptions = useMemo(() => [...new Set(sourceRecords.map((record) => record.activityType).filter(Boolean))], [sourceRecords])

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return sourceRecords.filter((record) => {
      const matchesSearch = !normalizedSearch || [
        record.activityName,
        record.activityType,
        record.year,
        record.sgt,
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))

      return (
        matchesSearch
        && (!selectedYear || record.year === selectedYear)
        && (!selectedSgt || record.sgt === selectedSgt)
        && (!selectedStatus || record.evaluationStatus === selectedStatus)
        && (!selectedActivityType || record.activityType === selectedActivityType)
      )
    })
  }, [sourceRecords, searchQuery, selectedYear, selectedSgt, selectedStatus, selectedActivityType])

  const metrics = useMemo(() => ({
    total: filteredRecords.length,
    pending: filteredRecords.filter((record) => record.evaluationStatus === 'Pending Evaluation').length,
    completed: filteredRecords.filter((record) => record.evaluationStatus === 'Completed Evaluation').length,
    years: new Set(filteredRecords.map((record) => record.year).filter(Boolean)).size,
    sgts: new Set(filteredRecords.map((record) => `${record.year}-${record.sgt}`).filter(Boolean)).size,
  }), [filteredRecords])

  const metricItems = [
    { label: 'Total', value: metrics.total, icon: ClipboardCheck, tone: 'is-total' },
    { label: 'Pending', value: metrics.pending, icon: Activity, tone: 'is-pending' },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle2, tone: 'is-complete' },
    { label: 'Years', value: metrics.years, icon: GraduationCap, tone: 'is-years' },
    { label: 'SGTs', value: metrics.sgts, icon: FolderKanban, tone: 'is-sgts' },
  ]

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedYear('')
    setSelectedSgt('')
    setSelectedStatus('')
    setSelectedActivityType('')
  }

  const activeFilterChips = [
    selectedYear ? { key: 'year', label: `Year: ${selectedYear}` } : null,
    selectedSgt ? { key: 'sgt', label: `SGT: ${selectedSgt}` } : null,
    selectedActivityType ? { key: 'type', label: `Type: ${selectedActivityType}` } : null,
    selectedStatus ? { key: 'status', label: selectedStatus === 'Pending Evaluation' ? 'Pending' : 'Completed' } : null,
  ].filter(Boolean)

  const clearSingleFilter = (key) => {
    if (key === 'year') setSelectedYear('')
    if (key === 'sgt') setSelectedSgt('')
    if (key === 'type') setSelectedActivityType('')
    if (key === 'status') setSelectedStatus('')
  }

  const handleOpenEvaluation = (record) => {
    onAlert?.({
      tone: 'primary',
      message: `Evaluation workspace opened for ${record.activityName} (${record.year} - ${record.sgt}).`,
    })
  }

  return (
    <section className="vx-content eval-page">
      <div className="eval-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'Evaluation' }]} />

        <header className="eval-header">
          <div className="eval-header-copy">
            <span className="eval-kicker">2026 Review Workspace</span>
            <h1>Evaluation</h1>
            <p>Clean batch review for year and SGT level assessments.</p>
            <div className="eval-header-inline">
              <span><strong>{metrics.pending}</strong> Pending</span>
              <span><strong>{metrics.completed}</strong> Completed</span>
              <span><strong>{metrics.years}</strong> Years</span>
            </div>
          </div>
          <div className="eval-header-side">
            <span>{metrics.pending} pending</span>
            <strong>{metrics.total} live records</strong>
          </div>
        </header>

        <section className="eval-stats">
          {metricItems.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.label} className={`eval-stat ${item.tone}`}>
                <span className="eval-stat-icon"><Icon size={14} strokeWidth={2.1} /></span>
                <div className="eval-stat-copy">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </article>
            )
          })}
        </section>

        <section className="eval-toolbar">
          <div className="eval-toolbar-top">
            <div className="eval-toolbar-title">
              <h2>{viewMode === 'card' ? 'Evaluation Cards' : 'Evaluation Table'}</h2>
              <span>{filteredRecords.length} results</span>
            </div>

            <label className="eval-search">
              <Search size={15} strokeWidth={2} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search activity, year, SGT"
              />
            </label>

            <div className="eval-view-switch" role="tablist" aria-label="Evaluation layout">
              <button type="button" className={`eval-view-btn ${viewMode === 'card' ? 'is-active' : ''}`} onClick={() => setViewMode('card')}>
                <LayoutGrid size={14} strokeWidth={2} />
                Cards
              </button>
              <button type="button" className={`eval-view-btn ${viewMode === 'table' ? 'is-active' : ''}`} onClick={() => setViewMode('table')}>
                <Rows3 size={14} strokeWidth={2} />
                Table
              </button>
            </div>

            <button type="button" className="ghost eval-reset-btn" onClick={resetFilters}>
              <Filter size={14} strokeWidth={2} />
              Clear filters
            </button>
          </div>

          <div className="eval-filters">
            <label className="eval-filter-chip">
              <span>Year</span>
              <div className="forms-select-wrap">
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                  <option value="">All years</option>
                  {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>

            <label className="eval-filter-chip">
              <span>SGT</span>
              <div className="forms-select-wrap">
                <select value={selectedSgt} onChange={(event) => setSelectedSgt(event.target.value)}>
                  <option value="">All SGTs</option>
                  {sgtOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>

            <label className="eval-filter-chip">
              <span>Type</span>
              <div className="forms-select-wrap">
                <select value={selectedActivityType} onChange={(event) => setSelectedActivityType(event.target.value)}>
                  <option value="">All types</option>
                  {activityTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </label>

            <label className="eval-filter-chip">
              <span>Status</span>
              <div className="forms-select-wrap">
                <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="Pending Evaluation">Pending Evaluation</option>
                  <option value="Completed Evaluation">Completed Evaluation</option>
                </select>
              </div>
            </label>
          </div>

          <div className="eval-filter-actions">
            <button type="button" className="tool-btn green eval-apply-btn">
              Apply
            </button>
            <button type="button" className="ghost eval-clear-btn" onClick={resetFilters}>
              Clear filter
            </button>
          </div>

          {activeFilterChips.length ? (
            <div className="eval-active-filters" aria-label="Active filters">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="eval-active-chip"
                  onClick={() => clearSingleFilter(chip.key)}
                >
                  {chip.label}
                  <span aria-hidden="true">x</span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {filteredRecords.length ? (
          <section className="eval-content">
            {viewMode === 'card' ? (
              <div className="eval-card-grid">
                {filteredRecords.map((record) => (
                  <EvaluationCard key={record.id} record={record} onOpenEvaluation={handleOpenEvaluation} />
                ))}
              </div>
            ) : (
              <EvaluationTable records={filteredRecords} onOpenEvaluation={handleOpenEvaluation} />
            )}
          </section>
        ) : (
          <section className="eval-empty">
            <CheckCircle2 size={22} strokeWidth={2} />
            <strong>No evaluation records match these filters.</strong>
            <p>Try a broader search or clear the active filters.</p>
          </section>
        )}
      </div>
    </section>
  )
}
