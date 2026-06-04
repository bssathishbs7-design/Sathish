import { useState } from 'react'
import { ArrowRight, BadgeCheck, ChevronDown, ClipboardPlus, Clock3, FileWarning, FolderPlus, Plus, Trash2 } from 'lucide-react'
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

const requiredAssessmentFields = ['collegeName', 'assessmentName', 'academicYear', 'examCategory', 'course', 'year']

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'
const CREATE_ASSESSMENT_INITIAL_TAB_KEY = 'vx-create-assessment-initial-tab'
const ASSESSMENT_DRAFTS_STORAGE_KEY = 'vx-assessment-drafts'

const toCapitalizedCase = (value) =>
  value.replace(/[A-Za-z]+/g, (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)

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

function SelectField({ label, value, options, placeholder, onChange, className = '' }) {
  return (
    <label className={`assessment-create-field ${className}`.trim()}>
      <span>{label}</span>
      <span className="assessment-create-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">{placeholder || label}</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
    </label>
  )
}

function UploadImageIcon() {
  return (
    <svg className="assessment-create-upload-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M11 10h34a7 7 0 0 1 7 7v20.2a15.6 15.6 0 0 0-4-2V17a3 3 0 0 0-3-3H11a3 3 0 0 0-3 3v29.4l12.2-12.2a4 4 0 0 1 5.6 0l5.1 5.1 8.6-8.6a4 4 0 0 1 5.7 0l.7.7a15.7 15.7 0 0 0-9.4 20.6H11a7 7 0 0 1-7-7V17a7 7 0 0 1 7-7Z" />
      <circle cx="19" cy="24" r="6" />
      <circle cx="48" cy="48" r="13" />
      <path d="M48 56a2 2 0 0 1-2-2V45.8l-3 3a2 2 0 1 1-2.8-2.8l6.4-6.4a2 2 0 0 1 2.8 0l6.4 6.4a2 2 0 0 1-2.8 2.8l-3-3V54a2 2 0 0 1-2 2Z" fill="#fff" />
    </svg>
  )
}

export default function AssessmentCreatePage({ onNavigate }) {
  const [form, setForm] = useState(initialForm)
  const [activeAssessmentTab, setActiveAssessmentTab] = useState('create')
  const [draftAssessments, setDraftAssessments] = useState(readAssessmentDrafts)
  const isCreateDisabled = requiredAssessmentFields.some((field) => !String(form[field] ?? '').trim())
  const metrics = assessmentMetrics.map((metric) => (
    metric.tone === 'draft' ? { ...metric, count: draftAssessments.length } : metric
  ))

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const clearForm = () => {
    setForm(initialForm)
  }

  const uploadLogo = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      updateForm('logoName', file.name)
      updateForm('logoPreview', String(reader.result ?? ''))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    updateForm('logoName', '')
    updateForm('logoPreview', '')
  }

  const createAssessment = () => {
    if (isCreateDisabled) return

    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify({
      ...form,
      assessmentId: `assessment-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }))
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const continueDraftAssessment = (draft) => {
    if (!draft?.setup) return
    window.localStorage.setItem(CREATE_ASSESSMENT_SETUP_KEY, JSON.stringify(draft.setup))
    window.localStorage.setItem(CREATE_ASSESSMENT_INITIAL_TAB_KEY, 'preview')
    onNavigate?.(APP_PAGES.CREATE_ASSESSMENT)
  }

  const deleteDraftAssessment = (draftId) => {
    setDraftAssessments((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== draftId)
      window.localStorage.setItem(ASSESSMENT_DRAFTS_STORAGE_KEY, JSON.stringify(nextDrafts))
      if (!nextDrafts.length && activeAssessmentTab === 'draft') {
        setActiveAssessmentTab('create')
      }
      return nextDrafts
    })
  }

  return (
    <section className="vx-content assessment-page">
      <div className={`assessment-page-shell assessment-create-page-shell ${activeAssessmentTab === 'draft' ? 'is-draft-tab' : ''}`}>
        <div className="assessment-create-page-header">
          <PageNavigationHeader items={['My Pages', 'Assessment', 'Create']} />
          <button
            type="button"
            className={`assessment-create-new-btn ${activeAssessmentTab === 'create' ? 'is-active' : ''}`}
            onClick={() => setActiveAssessmentTab('create')}
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
                      <span>{draft.questionCount ?? 0} Questions · {draft.totalMarks ?? 0} Marks</span>
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
        ) : (
        <section className="assessment-create-form-shell" aria-label="Create assessment setup">
          <form className="assessment-create-form" onSubmit={(event) => event.preventDefault()}>
           
              <section className="assessment-create-setup-card">
                <div className="assessment-create-card-heading">
                  <h2>Create Assessment</h2>
                </div>

                <div className="assessment-create-setup-top">
                  <label
                    className="assessment-create-field assessment-create-upload"
                    data-tooltip="Upload logo in PNG, JPG, or SVG format. Square or 1:1 aspect ratio recommended. Max 2MB."
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => uploadLogo(event.target.files?.[0])}
                    />
                    <strong>
                      {form.logoPreview ? (
                        <img src={form.logoPreview} alt={form.logoName || 'Uploaded logo'} />
                      ) : (
                        <UploadImageIcon />
                      )}
                    </strong>
                    {form.logoPreview ? (
                      <button type="button" onClick={removeLogo} aria-label="Remove logo">
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </label>

                  <SelectField
                    className="assessment-create-college-field"
                    label="Select College Name"
                    value={form.collegeName}
                    options={selectOptions.colleges}
                    placeholder="Select College Name"
                    onChange={(value) => updateForm('collegeName', value)}
                  />

                  <SelectField
                    className="assessment-create-year-field"
                    label="Academic Year"
                    value={form.academicYear}
                    options={selectOptions.academicYears}
                    placeholder="Academic Year"
                    onChange={(value) => updateForm('academicYear', value)}
                  />

                  <label className="assessment-create-field assessment-create-name-field">
                    <span>Assessment Name</span>
                    <input
                      type="text"
                      value={form.assessmentName}
                      placeholder="Assessment Name"
                      onChange={(event) => updateForm('assessmentName', toCapitalizedCase(event.target.value))}
                    />
                  </label>

                  <div className="assessment-create-side-fields">
                    <SelectField
                      label="Exam Category"
                      value={form.examCategory}
                      options={selectOptions.examCategories}
                      placeholder="Exam Category"
                      onChange={(value) => updateForm('examCategory', value)}
                    />

                    <SelectField
                      label="Select Course"
                      value={form.course}
                      options={selectOptions.courses}
                      placeholder="Select Course"
                      onChange={(value) => updateForm('course', value)}
                    />

                    <SelectField
                      label="Select Year"
                      value={form.year}
                      options={selectOptions.years}
                      placeholder="Select Year"
                      onChange={(value) => updateForm('year', value)}
                    />
                  </div>
                </div>

                <div className="assessment-create-setup-divider" />

                <div className="assessment-create-form-actions">
                  <button type="button" className="is-clear" onClick={clearForm}>Clear</button>
                  <button
                    type="button"
                    className="is-primary"
                    onClick={createAssessment}
                    disabled={isCreateDisabled}
                  >
                    <ClipboardPlus size={16} strokeWidth={2.3} />
                    Create Assessment
                  </button>
                </div>
              </section>
              <aside className="assessment-create-guidance">
                <p>
                 <b>Helper Notes:</b>After clicking <strong>Create Assessment</strong>, you will be taken to the complete assessment setup page where you can configure exam pattern & sections, question distribution, online/offline settings, scheduling, evaluation rules, and security & approval workflow.
                </p>

              </aside>
          </form>
        </section>
        )}
      </div>
    </section>
  )
}
