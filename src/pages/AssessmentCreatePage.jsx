import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, BadgeCheck, Clock3, EyeOff, FileWarning, FolderPlus, Info, Monitor, Pencil, Plus, Trash2, X } from 'lucide-react'
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
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'
const ASSESSMENT_PUBLISHED_STORAGE_KEY = 'vx-assessment-published'
const PUBLISHED_LOG_PAGE_SIZE = 5

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

const stripHtml = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

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

const readPublishedAssessments = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSESSMENT_PUBLISHED_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getAssessmentStorageSuffix = (setup = {}) => {
  if (setup.assessmentId) return String(setup.assessmentId)
  const signature = [
    setup.collegeName,
    setup.assessmentName,
    setup.academicYear,
    setup.examCategory,
    setup.course,
    setup.year,
  ].filter(Boolean).join('|')
  return signature ? signature.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'draft'
}

const getAssessmentQuestionsStorageKey = (setup = {}) => (
  `${CREATE_ASSESSMENT_QUESTIONS_KEY}:${getAssessmentStorageSuffix(setup)}`
)

const readDraftQuestions = (draft) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(draft?.setup ?? draft)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getDraftValue = (draft, ...keys) => {
  for (const key of keys) {
    const value = draft?.[key] ?? draft?.setup?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getQuestionMarksTotal = (item) => {
  if (isDescriptiveQuestionType(item?.type)) {
    const sections = Array.isArray(item?.descriptiveSections) ? item.descriptiveSections : []
    const sectionMarks = sections.reduce((total, section) => {
      const children = Array.isArray(section.children) ? section.children : []
      const childMarks = children.reduce((sum, child) => sum + parseMarksValue(child.marks), 0)
      const ownMarks = children.length ? 0 : parseMarksValue(section.marks)
      return total + ownMarks + childMarks
    }, 0)
    const totalMarks = (sections.length ? 0 : parseMarksValue(item?.marks)) + sectionMarks
    return totalMarks || (stripHtml(item?.questionText) ? 2 : 0)
  }

  if (item?.type === 'MCQ' && !parseMarksValue(item?.marks)) return 1
  return parseMarksValue(item?.marks)
}

const getDraftSummary = (draft) => {
  const questions = readDraftQuestions(draft)
  if (questions.length) {
    return {
      questionCount: questions.length,
      totalMarks: questions.reduce((total, item) => total + getQuestionMarksTotal(item), 0),
    }
  }

  return {
    questionCount: Number(draft?.questionCount ?? 0),
    totalMarks: Number(draft?.totalMarks ?? 0),
  }
}

const formatDraftSavedDate = (value) => {
  if (!value) return 'Draft saved'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Draft saved'
  return `Saved ${date.toLocaleDateString()}`
}

const formatDisplayDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB').replace(/\//g, '-')
}

const formatDisplayDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleDateString('en-GB').replace(/\//g, '-')} ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const getPublishedLogRows = (assessment) => {
  if (Array.isArray(assessment?.publishedLog) && assessment.publishedLog.length) return assessment.publishedLog

  return [{
    facultyId: assessment?.facultyId || assessment?.setup?.facultyId || 'MC2568',
    facultyName: assessment?.facultyName || assessment?.setup?.facultyName || 'Karthik Subramanian',
    remarks: assessment?.publishedAt ? 'Assessment published' : 'Published log not available',
    timestamp: assessment?.publishedAt || assessment?.createdAt || '',
  }]
}

export default function AssessmentCreatePage({ onNavigate }) {
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const [publishedAssessments, setPublishedAssessments] = useState(readPublishedAssessments)
  const [selectedPublishedLogAssessment, setSelectedPublishedLogAssessment] = useState(null)
  const [publishedLogPage, setPublishedLogPage] = useState(1)
  const [activeAssessmentTab, setActiveAssessmentTab] = useState(() => (
    readAssessmentDrafts().length ? 'draft' : readPublishedAssessments().length ? 'published' : ''
  ))
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft'
      ? { ...metric, count: draftAssessments.length }
      : metric.tone === 'published'
        ? { ...metric, count: publishedAssessments.length }
        : metric
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

  const editPublishedAssessment = (assessment) => {
    if (!assessment?.setup) return
    const editedAt = new Date().toISOString()
    const nextAssessment = {
      ...assessment,
      publishedLog: [
        {
          facultyId: assessment.facultyId || assessment.setup?.facultyId || 'MC2568',
          facultyName: assessment.facultyName || assessment.setup?.facultyName || 'Karthik Subramanian',
          remarks: 'Assessment opened for edit',
          timestamp: editedAt,
        },
        ...getPublishedLogRows(assessment),
      ],
    }
    setPublishedAssessments((current) => {
      const nextPublished = current.map((item) => (item.id === assessment.id ? nextAssessment : item))
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      return nextPublished
    })
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(assessment.setup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'configuration')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deletePublishedAssessment = (assessmentId) => {
    setPublishedAssessments((current) => {
      const nextPublished = current.filter((assessment) => assessment.id !== assessmentId)
      window.localStorage.setItem(ASSESSMENT_PUBLISHED_STORAGE_KEY, JSON.stringify(nextPublished))
      setSelectedPublishedLogAssessment((selected) => (selected?.id === assessmentId ? null : selected))
      if (!nextPublished.length && activeAssessmentTab === 'published') {
        setActiveAssessmentTab(draftAssessments.length ? 'draft' : '')
      }
      return nextPublished
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
                {draftAssessments.map((draft) => {
                  const assessmentName = getDraftValue(draft, 'assessmentName') || 'Untitled Assessment'
                  const examCategory = getDraftValue(draft, 'examCategory') || 'Assessment'
                  const academicYear = getDraftValue(draft, 'academicYear') || '-'
                  const course = String(getDraftValue(draft, 'course', 'assignCourse') || '-')
                    .replace(/\s*\(NMC Syllabus\)\s*/i, '')
                    .trim() || '-'
                  const year = getDraftValue(draft, 'year', 'assignYear')
                  const savedAt = getDraftValue(draft, 'updatedAt', 'savedAt', 'createdAt')
                  const draftSummary = getDraftSummary(draft)
                  const questionCount = draftSummary.questionCount
                  const totalMarks = draftSummary.totalMarks

                  return (
                    <article key={draft.id} className="assessment-create-draft-card">
                      <div className="assessment-create-draft-profile">
                        <div>
                        <strong>{assessmentName}</strong>
                        <span className="assessment-create-draft-category">{examCategory}</span>
                        <span>{questionCount} Questions | {totalMarks} Marks</span>
                        </div>
                        <button
                          type="button"
                          className="assessment-create-draft-delete"
                          onClick={() => deleteDraftAssessment(draft.id)}
                          aria-label={`Delete ${assessmentName}`}
                        >
                          <Trash2 size={15} strokeWidth={2.1} />
                        </button>
                      </div>
                      <div className="assessment-create-draft-stats" aria-label="Draft summary">
                        <span>
                          <strong>{questionCount}</strong>
                          <em>Questions</em>
                        </span>
                        <span>
                          <strong>{totalMarks}</strong>
                          <em>Total Marks</em>
                        </span>
                        <span>
                          <strong>{formatYearLabel(year)}</strong>
                          <em>Year</em>
                        </span>
                      </div>
                      <div className="assessment-create-draft-chips">
                        <span>{academicYear}</span>
                        <span>{course}</span>
                      </div>
                      <div className="assessment-create-draft-footer">
                        <span>{formatDraftSavedDate(savedAt)}</span>
                        <button type="button" onClick={() => continueDraftAssessment(draft)}>
                          Continue
                          <ArrowRight size={14} strokeWidth={2.3} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No draft assessments available.</p>
              </div>
            )}
          </section>
        ) : null}

        {activeAssessmentTab === 'published' ? (
          <section className="assessment-create-draft-shell assessment-create-published-shell" aria-label="Published assessments">
            <div className="assessment-create-card-heading">
              <h2>Published Assessment</h2>
            </div>
            {publishedAssessments.length ? (
              <div className="assessment-create-draft-grid">
                {publishedAssessments.map((assessment) => {
                  const isPracticeExam = String(assessment.supervisionType || '').toLowerCase().includes('practice')
                  const isOfflineExam = String(assessment.examMode || '').toLowerCase() === 'offline'
                  const SupervisionIcon = isPracticeExam ? EyeOff : Monitor

                  return (
                      <article key={assessment.id} className="assessment-create-draft-card assessment-create-published-card">
                        <div className="assessment-create-published-head">
                          <div>
                            <strong>{assessment.assessmentName || 'Untitled Assessment'}</strong>
                            <small>{assessment.examCategory || '-'} / {assessment.assignTo || '-'}</small>
                      </div>
                      <span className="assessment-create-published-actions">
                        <button type="button" className="assessment-create-published-icon-btn is-delete" onClick={() => deletePublishedAssessment(assessment.id)} aria-label={`Delete ${assessment.assessmentName || 'published assessment'}`}>
                          <Trash2 size={13} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="assessment-create-published-info"
                          onClick={() => {
                            setSelectedPublishedLogAssessment(assessment)
                            setPublishedLogPage(1)
                          }}
                          title="Published assessment details"
                          aria-label={`View published log for ${assessment.assessmentName || 'published assessment'}`}
                        >
                          <Info size={14} strokeWidth={2.2} />
                        </button>
                        <button type="button" className="assessment-create-published-icon-btn is-edit" onClick={() => editPublishedAssessment(assessment)} aria-label={`Edit ${assessment.assessmentName || 'published assessment'}`}>
                          <Pencil size={13} strokeWidth={2.2} />
                        </button>
                      </span>
                        </div>
                        <span className="assessment-create-published-status-row">
                          <span className={`assessment-create-published-status is-${String(assessment.examMode || '').toLowerCase() === 'offline' ? 'offline' : 'online'}`}>
                            {assessment.examMode || '-'}
                          </span>
                          {!isOfflineExam ? (
                            <span className={`assessment-create-published-supervision ${isPracticeExam ? 'is-practice' : 'is-proctored'}`}>
                              <SupervisionIcon size={13} strokeWidth={2.3} />
                              {assessment.supervisionType || '-'}
                            </span>
                          ) : null}
                        </span>
                        <div className="assessment-create-published-details" aria-label="Published assessment details">
                          <span><strong>{formatDisplayDate(assessment.startDate)}</strong><em>Start Date</em></span>
                          <span><strong>{assessment.startTime || '-'}</strong><em>Start Time</em></span>
                          <span><strong>{assessment.totalDuration || '-'}</strong><em>Total Duration</em></span>
                          <span><strong>{formatDisplayDate(assessment.endDate)}</strong><em>End Date</em></span>
                          <span><strong>{assessment.totalMarks ?? '-'}</strong><em>Total Marks</em></span>
                          <span><strong>{assessment.examType || '-'}</strong><em>Exam Type</em></span>
                        </div>
                        <div className="assessment-create-draft-footer assessment-create-published-footer">
                          <span>Created on {formatDisplayDate(assessment.createdAt)}</span>
                        </div>
                      </article>
                    )
                })}
              </div>
            ) : (
              <div className="assessment-create-placeholder">
                <p>No published assessments available.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
      {selectedPublishedLogAssessment ? createPortal((() => {
        const publishedLogRows = getPublishedLogRows(selectedPublishedLogAssessment)
        const totalPublishedLogPages = Math.max(1, Math.ceil(publishedLogRows.length / PUBLISHED_LOG_PAGE_SIZE))
        const currentPublishedLogPage = Math.min(publishedLogPage, totalPublishedLogPages)
        const pagedPublishedLogRows = publishedLogRows.slice(
          (currentPublishedLogPage - 1) * PUBLISHED_LOG_PAGE_SIZE,
          currentPublishedLogPage * PUBLISHED_LOG_PAGE_SIZE,
        )

        return (
        <div className="assessment-create-log-modal-backdrop" role="presentation" onClick={() => setSelectedPublishedLogAssessment(null)}>
          <section className="assessment-create-log-modal" role="dialog" aria-modal="true" aria-labelledby="assessment-create-log-title" onClick={(event) => event.stopPropagation()}>
            <div className="assessment-create-log-modal-head">
              <div>
                <h3 id="assessment-create-log-title">Published Log Details</h3>
                <span>{selectedPublishedLogAssessment.assessmentName || 'Untitled Assessment'}</span>
              </div>
              <button type="button" className="assessment-create-log-close" onClick={() => setSelectedPublishedLogAssessment(null)} aria-label="Close published log details">
                <X size={15} strokeWidth={2.3} />
              </button>
            </div>
            <div className="assessment-create-log-table-shell">
              <div className="assessment-create-log-grid" role="table" aria-label="Published log details">
                <div className="assessment-create-log-grid-head" role="row">
                  <span role="columnheader">Faculty ID</span>
                  <span role="columnheader">Faculty Name</span>
                  <span role="columnheader">Remarks</span>
                  <span role="columnheader">Date & Time Stamp</span>
                </div>
                {pagedPublishedLogRows.map((item, index) => (
                  <div className="assessment-create-log-grid-row" role="row" key={`${item.timestamp || 'log'}-${index}`}>
                    <span role="cell">{item.facultyId || '-'}</span>
                    <span role="cell">{item.facultyName || '-'}</span>
                    <span role="cell">{item.remarks || '-'}</span>
                    <span role="cell">{formatDisplayDateTime(item.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="assessment-create-log-pagination" aria-label="Published log pagination">
              <span>
                Page {currentPublishedLogPage} of {totalPublishedLogPages}
                {' '}| Showing {pagedPublishedLogRows.length} of {publishedLogRows.length}
              </span>
              <div>
                <button type="button" onClick={() => setPublishedLogPage((page) => Math.max(1, page - 1))} disabled={currentPublishedLogPage <= 1}>
                  Previous
                </button>
                <button type="button" onClick={() => setPublishedLogPage((page) => Math.min(totalPublishedLogPages, page + 1))} disabled={currentPublishedLogPage >= totalPublishedLogPages}>
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
        )
      })(), document.body) : null}
    </section>
  )
}
