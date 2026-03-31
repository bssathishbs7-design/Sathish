import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookCheck,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardCheck,
  Eye,
  FilePenLine,
  GripVertical,
  ListChecks,
  Plus,
  SquarePen,
  Stethoscope,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import '../styles/ospe-activity.css'

const workflowSteps = [
  {
    id: 'faculty-checklist',
    shortLabel: 'Faculty',
    title: 'Activity Checklist',
    icon: ClipboardCheck,
  },
  {
    id: 'student-form',
    shortLabel: 'Students',
    title: 'Activity Form',
    icon: FilePenLine,
  },
  {
    id: 'student-scaffold',
    shortLabel: 'Students',
    title: 'Scaffolded Questions',
    icon: WandSparkles,
  },
]

const stationSummary = {
  title: 'Checklist for diluting the given sample of blood for WBC count.',
  status: 'Ready',
  type: 'OSPE',
  competency: 'Dilution technique, sequence control, and safe specimen handling.',
}

const checklistItems = [
  {
    id: 'check-1',
    text: 'Keeping blood at 0.5 mark, draw diluting fluid up to 11 mark without introducing air bubbles. (1)',
    cognitive: 'Understand',
    affective: 'Characterization',
    psychomotor: 'Adaptation / Origination',
  },
  {
    id: 'check-2',
    text: 'Mix the pipette gently, discard the first drops, and prepare the chamber without spilling the diluted specimen. (1)',
    cognitive: 'Apply',
    affective: 'Receiving',
    psychomotor: 'Guided response',
  },
  {
    id: 'check-3',
    text: 'Maintain aseptic handling and explain one common error that alters the WBC count. (1)',
    cognitive: 'Analyze',
    affective: 'Valuing',
    psychomotor: 'Mechanism',
  },
]

const formItems = [
  {
    id: 'form-1',
    text: 'Applied the cuff correctly one inch above the cubital fossa, snug but not tight or loose with the middle portion of the rubber bladder over the brachial artery.',
    cognitive: 'Understand',
    affective: 'Characterization',
    psychomotor: 'Adaptation / Origination',
  },
  {
    id: 'form-2',
    text: 'Prepared the hemocytometer, ensured the ruling was clean, and positioned the specimen chamber without overflow.',
    cognitive: 'Apply',
    affective: 'Responding',
    psychomotor: 'Guided response',
  },
  {
    id: 'form-3',
    text: 'Verified the final reading against the expected range and documented the result in the correct field.',
    cognitive: 'Analyze',
    affective: 'Valuing',
    psychomotor: 'Precision',
  },
]

const scaffoldedQuestions = [
  {
    id: 'q-1',
    type: 'MCQ',
    prompt: 'Which of the following hormones stimulates the production of pancreatic juice and bicarbonate?',
    options: [
      { id: 'A', text: 'Insulin and glucagon' },
      { id: 'B', text: 'Cholecystokinin and secretin' },
      { id: 'C', text: 'Insulin and glucagon' },
      { id: 'D', text: 'Cholecystokinin and secretin', correct: true },
    ],
    answer: 'Cholecystokinin and Secretin',
    cognitive: 'Understand',
    affective: 'Characterization',
    psychomotor: 'Adaptation / Origination',
  },
  {
    id: 'q-2',
    type: 'Short Answer',
    prompt: 'What is the key reasoning behind discarding the first few drops before charging the chamber?',
    answer: 'It prevents inaccurate cell counts caused by unevenly mixed or non-representative fluid at the pipette tip.',
    cognitive: 'Analyze',
    affective: 'Valuing',
    psychomotor: 'Mechanism',
  },
  {
    id: 'q-3',
    type: 'True / False',
    prompt: 'Air bubbles inside the pipette do not influence the final WBC calculation.',
    answer: 'False',
    binaryOptions: ['True', 'False'],
    cognitive: 'Understand',
    affective: 'Receiving',
    psychomotor: 'Guided response',
  },
]

function StepChip({ step, isActive, isComplete, onClick }) {
  const Icon = step.icon
  return (
    <button
      type="button"
      className={`ospe-step-chip ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
      onClick={onClick}
    >
      <span className="ospe-step-chip-icon">
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="ospe-step-chip-copy">
        <small>{step.shortLabel}</small>
        <strong>{step.title}</strong>
      </span>
    </button>
  )
}

function MetaPill({ children, tone = 'default' }) {
  return <span className={`ospe-meta-pill is-${tone}`}>{children}</span>
}

function InlineTaxonomy({ cognitive, affective, psychomotor }) {
  return (
    <div className="ospe-taxonomy-inline">
      <MetaPill>{cognitive}</MetaPill>
      <MetaPill>{affective}</MetaPill>
      <MetaPill>{psychomotor}</MetaPill>
    </div>
  )
}

function OspeActivityPage({ onAlert }) {
  const [activeStep, setActiveStep] = useState(workflowSteps[0].id)
  const [isScaffoldingInfoOpen, setIsScaffoldingInfoOpen] = useState(false)
  const [openChecklistId, setOpenChecklistId] = useState(checklistItems[0].id)
  const [openFormId, setOpenFormId] = useState(formItems[0].id)
  const [openQuestionId, setOpenQuestionId] = useState(scaffoldedQuestions[0].id)

  const activeStepIndex = workflowSteps.findIndex((step) => step.id === activeStep)
  const activeStepMeta = workflowSteps[activeStepIndex] ?? workflowSteps[0]

  const completedStepIds = useMemo(
    () => workflowSteps.slice(0, activeStepIndex).map((step) => step.id),
    [activeStepIndex],
  )

  return (
    <section className="vx-content forms-page ospe-page">
      <div className="ospe-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'OSPE Activity' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <Stethoscope size={18} strokeWidth={2} className="vx-page-intro-icon" aria-hidden="true" />
            <h1>OSPE Activity</h1>
          </div>
        </div>

        <section className="vx-card ospe-header-card">
          <div className="ospe-header-topbar">
            <button type="button" className="ospe-back-btn" onClick={() => onAlert?.({ tone: 'primary', message: 'Returned to OSPE list.' })}>
              <ArrowLeft size={16} strokeWidth={2} />
              <span>Back</span>
            </button>
            <div className="ospe-header-badges">
              <MetaPill tone="success">{stationSummary.status}</MetaPill>
              <MetaPill tone="info">{stationSummary.type}</MetaPill>
            </div>
          </div>

          <div className="ospe-header-main">
            <div className="ospe-header-copy">
              <h2>{stationSummary.title}</h2>
              <p>{stationSummary.competency}</p>
            </div>

            <div className="ospe-header-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE preview opened.' })}
                title="Preview station"
              >
                <Eye size={16} strokeWidth={2} />
                <span>Preview</span>
              </button>
              <button
                type="button"
                className="tool-btn green"
                onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity saved successfully.' })}
                title="Save OSPE activity"
              >
                <BookCheck size={16} strokeWidth={2} />
                <span>Save Activity</span>
              </button>
            </div>
          </div>

          <div className="ospe-step-row">
            {workflowSteps.map((step) => (
              <StepChip
                key={step.id}
                step={step}
                isActive={step.id === activeStep}
                isComplete={completedStepIds.includes(step.id)}
                onClick={() => setActiveStep(step.id)}
              />
            ))}
          </div>
        </section>

        <section className="vx-card ospe-guidance-card">
          <div className="ospe-guidance-head">
            <div>
              <span className="ospe-guidance-kicker">{activeStepMeta.shortLabel}</span>
              <h3>{activeStepMeta.title}</h3>
            </div>
            <button
              type="button"
              className="ospe-readmore-btn"
              onClick={() => setIsScaffoldingInfoOpen((current) => !current)}
              aria-expanded={isScaffoldingInfoOpen}
            >
              <CircleHelp size={16} strokeWidth={2} />
              <span>{isScaffoldingInfoOpen ? 'Read Less' : 'Read More'}</span>
              {isScaffoldingInfoOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
            </button>
          </div>

          <p className="ospe-guidance-summary">
            AI scaffolding is optional. Use it only when the activity needs step-by-step support for learners after submission.
          </p>

          {isScaffoldingInfoOpen ? (
            <div className="ospe-guidance-details">
              <p><strong>What:</strong> Turn this on to let AI generate guided hints from the main question.</p>
              <p><strong>When:</strong> Ideal for students who need structured prompts without changing the original task.</p>
              <p><strong>Why:</strong> It breaks down complex clinical reasoning into manageable steps and reduces cognitive overload.</p>
            </div>
          ) : null}
        </section>

        {activeStep === 'faculty-checklist' ? (
          <section className="ospe-stage-panel">
            <div className="ospe-stage-list">
              {checklistItems.map((item, index) => {
                const isOpen = openChecklistId === item.id
                return (
                  <article key={item.id} className={`vx-card ospe-task-card ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="ospe-task-card-head"
                      onClick={() => setOpenChecklistId((current) => (current === item.id ? '' : item.id))}
                    >
                      <div className="ospe-task-card-title">
                        <span className="ospe-grip"><GripVertical size={15} strokeWidth={2} /></span>
                        <strong>{index + 1}. Checklist Item</strong>
                      </div>
                      <div className="ospe-task-card-actions">
                        <InlineTaxonomy cognitive={item.cognitive} affective={item.affective} psychomotor={item.psychomotor} />
                        <span className="ospe-task-iconset">
                          <span className="ospe-icon-btn" title="Edit checklist item"><SquarePen size={15} strokeWidth={2} /></span>
                          <span className="ospe-icon-btn is-danger" title="Delete checklist item"><Trash2 size={15} strokeWidth={2} /></span>
                          {isOpen ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                        </span>
                      </div>
                    </button>

                    <div className="ospe-task-primary">
                      <label className="ospe-check-radio" title="Mark item as selected">
                        <input type="radio" name="ospe-faculty-check" />
                        <span />
                      </label>
                      <p>{item.text}</p>
                    </div>

                    {isOpen ? (
                      <div className="ospe-task-expanded">
                        <div className="ospe-info-row">
                          <span>Faculty note</span>
                          <strong>Evaluator should verify fluid level and mixing before the learner proceeds.</strong>
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>

            <div className="ospe-footer-actions">
              <button type="button" className="ghost is-danger" onClick={() => onAlert?.({ tone: 'danger', message: 'Exited OSPE activity.' })}>
                Exit Page
              </button>
              <div className="ospe-footer-action-group">
                <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'primary', message: 'Checklist item added.' })}>
                  <Plus size={16} strokeWidth={2} />
                  <span>Add Checklist Item</span>
                </button>
                <button type="button" className="tool-btn green" onClick={() => setActiveStep('student-form')}>
                  Continue to Activity Form
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeStep === 'student-form' ? (
          <section className="ospe-stage-panel">
            <div className="ospe-stage-list">
              {formItems.map((item, index) => {
                const isOpen = openFormId === item.id
                return (
                  <article key={item.id} className={`vx-card ospe-task-card is-form ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="ospe-task-card-head"
                      onClick={() => setOpenFormId((current) => (current === item.id ? '' : item.id))}
                    >
                      <div className="ospe-task-card-title">
                        <span className="ospe-grip"><GripVertical size={15} strokeWidth={2} /></span>
                        <strong>{index + 1}. Student Prompt</strong>
                      </div>
                      <div className="ospe-task-card-actions">
                        <InlineTaxonomy cognitive={item.cognitive} affective={item.affective} psychomotor={item.psychomotor} />
                        <span className="ospe-task-iconset">
                          <span className="ospe-icon-btn" title="Edit prompt"><SquarePen size={15} strokeWidth={2} /></span>
                          <span className="ospe-icon-btn is-danger" title="Delete prompt"><Trash2 size={15} strokeWidth={2} /></span>
                          {isOpen ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                        </span>
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="ospe-editor-card">
                        <div className="ospe-editor-toolbar">
                          <span className="ospe-editor-tool" title="Bold">B</span>
                          <span className="ospe-editor-tool" title="Italic">I</span>
                          <span className="ospe-editor-tool" title="Underline">U</span>
                          <span className="ospe-editor-tool" title="List">•</span>
                          <span className="ospe-editor-tool" title="Highlight">A</span>
                        </div>
                        <div className="ospe-editor-body">
                          {item.text}
                        </div>
                      </div>
                    ) : (
                      <p className="ospe-collapsed-copy">{item.text}</p>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="ospe-footer-actions">
              <button type="button" className="ghost is-danger" onClick={() => onAlert?.({ tone: 'danger', message: 'Exited OSPE activity.' })}>
                Exit Page
              </button>
              <div className="ospe-footer-action-group">
                <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'primary', message: 'Question added to student form.' })}>
                  <Plus size={16} strokeWidth={2} />
                  <span>Add Question</span>
                </button>
                <button type="button" className="tool-btn green" onClick={() => setActiveStep('student-scaffold')}>
                  Continue to Scaffolding
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeStep === 'student-scaffold' ? (
          <section className="ospe-stage-panel">
            <div className="ospe-stage-list">
              {scaffoldedQuestions.map((question, index) => {
                const isOpen = openQuestionId === question.id
                return (
                  <article key={question.id} className={`vx-card ospe-task-card is-scaffold ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="ospe-task-card-head"
                      onClick={() => setOpenQuestionId((current) => (current === question.id ? '' : question.id))}
                    >
                      <div className="ospe-task-card-title">
                        <span className="ospe-grip"><GripVertical size={15} strokeWidth={2} /></span>
                        <strong>{index + 1}. {question.prompt}</strong>
                      </div>
                      <div className="ospe-task-card-actions">
                        <MetaPill tone="warning">{question.type}</MetaPill>
                        <span className="ospe-task-iconset">
                          <span className="ospe-icon-btn" title="Edit scaffolded question"><SquarePen size={15} strokeWidth={2} /></span>
                          <span className="ospe-icon-btn is-danger" title="Delete scaffolded question"><Trash2 size={15} strokeWidth={2} /></span>
                          {isOpen ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                        </span>
                      </div>
                    </button>

                    {question.type === 'MCQ' ? (
                      <div className="ospe-mcq-grid">
                        {question.options.map((option) => (
                          <div key={option.id} className={`ospe-option-card ${option.correct ? 'is-correct' : ''}`}>
                            <span>{option.id}</span>
                            <strong>{option.text}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {question.type === 'True / False' ? (
                      <div className="ospe-binary-row">
                        {question.binaryOptions.map((option) => (
                          <label key={option} className="ospe-check-radio is-binary">
                            <input type="radio" name={question.id} checked={option === question.answer} readOnly />
                            <span />
                            <strong>{option}</strong>
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {question.type === 'Short Answer' ? (
                      <div className="ospe-short-answer-line" />
                    ) : null}

                    {isOpen ? (
                      <div className="ospe-task-expanded">
                        <div className="ospe-info-row">
                          <span>Answer Key &amp; Explanation</span>
                          <strong>{question.answer}</strong>
                        </div>
                        <InlineTaxonomy
                          cognitive={question.cognitive}
                          affective={question.affective}
                          psychomotor={question.psychomotor}
                        />
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>

            <div className="ospe-footer-actions">
              <button type="button" className="ghost is-danger" onClick={() => onAlert?.({ tone: 'danger', message: 'Exited OSPE activity.' })}>
                Exit Page
              </button>
              <div className="ospe-footer-action-group">
                <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'primary', message: 'Review and assign flow opened.' })}>
                  <ListChecks size={16} strokeWidth={2} />
                  <span>Review / Assign</span>
                </button>
                <button type="button" className="ghost" onClick={() => onAlert?.({ tone: 'primary', message: 'OSPE activity switched to edit mode.' })}>
                  <SquarePen size={16} strokeWidth={2} />
                  <span>Edit Activity</span>
                </button>
                <button type="button" className="tool-btn green" onClick={() => onAlert?.({ tone: 'secondary', message: 'OSPE activity updated.' })}>
                  Update Activity
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}

export default OspeActivityPage
