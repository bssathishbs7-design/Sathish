import { useState } from 'react'
import { ArrowRight, BadgeCheck, Clock3, FileWarning, FolderPlus, Plus, Trash2 } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const assessmentMetrics = [
  {
    label: 'Draft Assessment',
    count: 0,
    icon: FolderPlus,
    tone: 'draft',
  },
  {
    label: 'Pending Approval',
    count: 0,
    icon: Clock3,
    tone: 'pending',
  },
  {
    label: 'Approved Assessment',
    count: 0,
    icon: BadgeCheck,
    tone: 'approved',
  },
  {
    label: 'Approval Rejected',
    count: 0,
    icon: FileWarning,
    tone: 'rejected',
  },
  {
    label: 'Published Assessment',
    count: 0,
    icon: BadgeCheck,
    tone: 'published',
  },
]

const selectOptions = {
  colleges: [
    'Sri Ramachandra Institute of Higher Education and Research',
    'Saveetha Institute of Medical and Technical Sciences',
    'SRM Medical College Hospital and Research Centre',
    'Sri Manakula Vinayagar Medical College and Hospital',
  ],
  examCategories: [
    'Internal Assessment',
    'University Exam',
    'Formative Assessment',
    'Summative Assessment',
    'Theory Exam',
    'Practical Exam',
    'Viva Voce',
    'Mock Test',
    'Entrance/Screening Test',
  ],
  courses: ['India MBBS (NMC Syllabus)'],
  years: ['First Year', 'Second Year', 'Third Year', 'Fourth Year'],
  academicYears: ['2024 - 2025', '2025 - 2026', '2026 - 2027', '2027 - 2028'],
}

const initialForm = {
  collegeName: '',
  logoName: '',
  logoPreview: '',
  assessmentName: '',
  academicYear: '2025 - 2026',
  examCategory: '',
  course: '',
  year: '',
}

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'

const formatYearLabel = (value) => {
  const yearMap = {
    'Year 1': 'First Year',
    'Year 2': 'Second Year',
    'Year 3': 'Third Year',
    'Year 4': 'Fourth Year',
  }
  return yearMap[value] || value || '-'
}

const readAssessmentDrafts = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_DRAFTS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function AssessmentCreatePage({ onNavigate }) {
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const [activeAssessmentTab, setActiveAssessmentTab] = useState(() => (
    readAssessmentDrafts().length ? 'draft' : ''
  ))
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft' ? { ...metric, count: draftAssessments.length } : metric
  ))

  const createAssessment = () => {
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...initialForm,
      assessmentId: `assessment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'create')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const continueDraftAssessment = (draft) => {
    if (!draft?.setup) return
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...draft.setup,
      sourceDraftId: draft.id,
      sourceDraftName: draft.assessmentName || draft.setup?.assessmentName || 'Untitled Assessment',
    }))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deleteDraftAssessment = (draftId) => {
    setDraftAssessments((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== draftId)
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
      if (!nextDrafts.length && activeAssessmentTab === 'draft') {
        setActiveAssessmentTab('')
      }
      return nextDrafts
    })
  }

  return (
    <section className="vx-content assessment-page assessment-create-tracker-page">
      <div className={`assessment-page-shell assessment-create-page-shell ${activeAssessmentTab === 'draft' ? 'is-draft-tab' : ''}`}>
        <div className="assessment-create-page-header">
          <PageNavigationHeader items={['My Pages', 'Assessment', 'My Progress']} />
          <button
            type="button"
            className={`assessment-create-new-btn ${activeAssessmentTab === 'create' ? 'is-active' : ''}`}
            onClick={createAssessment}
          >
            <Plus size={17} strokeWidth={2.4} />
            Create Assessment
          </button>
        </div>

        <section className="assessment-create-toolbar" aria-label="Assessment create actions">
          <div className="assessment-create-metrics" aria-label="Assessment create metrics">
            {metrics.map((metric) => {
              const Icon = metric.icon
              const isDisabledMetric = metric.count <= 0
              const isActiveMetric = activeAssessmentTab === metric.tone && !isDisabledMetric

              return (
                <button
                  key={metric.label}
                  type="button"
                  className={`assessment-create-metric is-${metric.tone} ${isActiveMetric ? 'is-active' : ''}`}
                  onClick={() => {
                    if (isDisabledMetric) return
                    setActiveAssessmentTab(metric.tone)
                  }}
                  disabled={isDisabledMetric}
                  aria-disabled={isDisabledMetric}
                >
                  <span className="assessment-create-metric-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.2} />
                  </span>
                  <span className="assessment-create-metric-copy">
                    <strong>{metric.count}</strong>
                    <span>{metric.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {activeAssessmentTab === 'draft' ? (
          <section className="assessment-create-draft-shell" aria-label="Draft assessments">
            <div className="assessment-create-card-heading">
              <h2>Draft Assessment</h2>
            </div>
            {draftAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {draftAssessments.map((draft) => (
                  <article key={draft.id} className="assessment-create-draft-card">
                    <div className="assessment-create-draft-profile">
                      <div>
                      <strong>{draft.assessmentName || 'Untitled Assessment'}</strong>
                      <span className="assessment-create-draft-category">{draft.examCategory || 'Assessment'}</span>
                      <span>{draft.questionCount ?? 0} Questions | {draft.totalMarks ?? 0} Marks</span>
                      </div>
                      <button
                        type="button"
                        className="assessment-create-draft-delete"
                        onClick={() => deleteDraftAssessment(draft.id)}
                        aria-label={`Delete ${draft.assessmentName || 'draft assessment'}`}
                      >
                        <Trash2 size={15} strokeWidth={2.1} />
                      </button>
                    </div>
                    <div className="assessment-create-draft-stats" aria-label="Draft summary">
                      <span>
                        <strong>{draft.questionCount ?? 0}</strong>
                        <em>Questions</em>
                      </span>
                      <span>
                        <strong>{draft.totalMarks ?? 0}</strong>
                        <em>Total Marks</em>
                      </span>
                      <span>
                        <strong>{formatYearLabel(draft.year)}</strong>
                        <em>Year</em>
                      </span>
                    </div>
                    <div className="assessment-create-draft-chips">
                      <span>{draft.academicYear || '-'}</span>
                      <span>{(draft.course || '-').replace(/\s*\(NMC Syllabus\)\s*/i, '').trim() || '-'}</span>
                    </div>
                    <div className="assessment-create-draft-footer">
                      <span>{draft.updatedAt ? `Saved ${new Date(draft.updatedAt).toLocaleDateString()}` : 'Draft saved'}</span>
                      <button type="button" onClick={() => continueDraftAssessment(draft)}>
                        Continue
                        <ArrowRight size={14} strokeWidth={2.3} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No draft assessments available.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </section>
  )
}
