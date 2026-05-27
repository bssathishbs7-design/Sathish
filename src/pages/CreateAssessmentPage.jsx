import { useState } from 'react'
import { CheckCircle2, Clock3, LogOut, ShieldCheck } from 'lucide-react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const CREATE_ASSESSMENT_SETUP_KEY = 'vx-create-assessment-setup'

const wizardSteps = [
  'Prepare Question',
  'Configuration Setup',
  'Review & Approval',
  'Published Assessment',
]

const readCreateAssessmentSetup = () => {
  try {
    const row = JSON.parse(window.localStorage.getItem(CREATE_ASSESSMENT_SETUP_KEY) || '{}')
    return row && typeof row === 'object' ? row : {}
  } catch {
    return {}
  }
}

export default function CreateAssessmentPage({ onNavigate }) {
  const [activeStep, setActiveStep] = useState(0)
  const [setup] = useState(readCreateAssessmentSetup)

  const detailItems = [
    setup.collegeName,
    setup.academicYear,
    setup.examCategory,
    setup.course,
    setup.year,
  ].filter(Boolean)

  return (
    <section className="create-assessment-workspace">
      <header className="create-assessment-workspace-header">
        <div className="create-assessment-title-row">
          {setup.logoPreview ? (
            <img src={setup.logoPreview} alt={setup.logoName || 'Assessment logo'} className="create-assessment-logo" />
          ) : null}

          <div className="create-assessment-title-copy">
            <h1>{setup.assessmentName || 'Untitled Assessment'}</h1>
            {detailItems.length ? (
              <p>{detailItems.join(' / ')}</p>
            ) : null}
          </div>
        </div>

        <div className="create-assessment-header-actions">
          <span className="create-assessment-header-badge">
            <CheckCircle2 size={15} strokeWidth={2.2} />
            Total Marks: 0
          </span>
          <span className="create-assessment-header-badge">
            <Clock3 size={15} strokeWidth={2.2} />
            Duration: 00:00
          </span>
          <button type="button" onClick={() => onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)}>
            <LogOut size={15} strokeWidth={2.2} />
            Exit
          </button>
        </div>
      </header>

      <main className="create-assessment-workspace-main">
        <nav className="create-assessment-wizard" aria-label="Create assessment steps">
          {wizardSteps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={index === activeStep ? 'is-active' : ''}
              onClick={() => setActiveStep(index)}
            >
              <span>{index + 1}</span>
              {step}
            </button>
          ))}
        </nav>

        <section className="create-assessment-step-panel">
          <span>
            <ShieldCheck size={15} strokeWidth={2.2} />
            Step {activeStep + 1}
          </span>
          <h2>{wizardSteps[activeStep]}</h2>
          <p>This section is ready for the next workflow details.</p>
        </section>
      </main>
    </section>
  )
}
