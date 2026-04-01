import { useState } from 'react'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import { ClipboardCheck } from 'lucide-react'
import '../styles/evaluation.css'
import {
  assessmentSgtMap,
  assessmentYearOptions,
  createStudentAssessmentState,
  evaluationStudents,
  gradingChecklistItems,
  gradingQuestions,
  gradingTabs,
  skillAssessmentActivities,
} from './skillAssessmentData'

/**
 * SkillAssessmentPage Implementation Contract
 * Structure:
 * - Evaluation workflow with search filters, activity selection, and learner-level assessment state.
 * Dependencies:
 * - React local state
 * - Shared data from skillAssessmentData.js
 * Props / Data:
 * - onOpenDashboardSummary triggers the summary page from the evaluation flow
 * State:
 * - Owns filter selections, preview state, evaluation progress, and per-student assessment updates
 * Hooks / Providers:
 * - No global provider required because evaluation state is page-scoped
 * Required assets:
 * - Consumes shared mock data and grading structures from skillAssessmentData.js
 * Responsive behavior:
 * - Filter bar, student panels, and grading layouts should stack cleanly without losing context
 * Placement:
 * - Page-level workflow in src/pages/
 */
function SkillAssessmentPage({ onAlert }) {
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSgt, setSelectedSgt] = useState('')
  const [attemptCount, setAttemptCount] = useState('')
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [previewAssessment, setPreviewAssessment] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isEvaluationStarted, setIsEvaluationStarted] = useState(false)
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null)
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const [studentAssessments, setStudentAssessments] = useState(() => Object.fromEntries(
    evaluationStudents.map((student) => [student.id, createStudentAssessmentState()])
  ))

  const availableSgtOptions = selectedYear
    ? assessmentSgtMap[selectedYear] ?? []
    : Object.values(assessmentSgtMap).flat()

  const filteredActivities = skillAssessmentActivities.filter((activity) => {
    const matchesYear = !selectedYear || activity.year === selectedYear
    const matchesSgt = !selectedSgt || activity.sgt === selectedSgt
    const attemptNumber = Number(attemptCount)
    const matchesAttempt = !attemptCount || !activity.completedAttempts.includes(attemptNumber)

    return matchesYear && matchesSgt && matchesAttempt
  })

  const selectedActivity = filteredActivities.find((activity) => activity.id === selectedActivityId) ?? null
  const selectedStudent = selectedStudentIndex !== null ? evaluationStudents[selectedStudentIndex] ?? null : null
  const selectedStudentAssessment = selectedStudent ? studentAssessments[selectedStudent.id] ?? createStudentAssessmentState() : null
  const selectedStudentEvalNumber = selectedStudentIndex !== null ? selectedStudentIndex + 1 : 1
  const selectedStudentTotal = 12
  const obtainedMarks = selectedStudentAssessment
    ? Object.values(selectedStudentAssessment.checklist).filter((status) => status === 'pass').length * 2
    : 0
  const checklistCompleted = selectedStudentAssessment
    ? Object.values(selectedStudentAssessment.checklist).filter((status) => status !== 'pending').length
    : 0
  const evaluationStatus = selectedStudentAssessment?.submitted ? 'Complete' : 'Incomplete'

  const findYearForSgt = (sgt) => (
    assessmentYearOptions.find((year) => (assessmentSgtMap[year] ?? []).includes(sgt)) ?? ''
  )

  const updateStudentAssessment = (studentId, updater) => {
    setStudentAssessments((current) => {
      const existing = current[studentId] ?? createStudentAssessmentState()
      const next = typeof updater === 'function' ? updater(existing) : updater
      return { ...current, [studentId]: { ...existing, ...next, lastSavedAt: Date.now() } }
    })
  }

  const clearDerivedState = () => {
    setSelectedActivityId('')
    setPreviewAssessment(null)
    setIsEvaluationStarted(false)
  }

  const handleYearChange = (value) => {
    setSelectedYear(value)
    setSelectedSgt('')
    clearDerivedState()
  }

  const handleSgtChange = (value) => {
    setSelectedSgt(value)
    if (value) {
      const derivedYear = findYearForSgt(value)
      if (derivedYear) {
        setSelectedYear(derivedYear)
      }
    }
    clearDerivedState()
  }

  const handleAttemptChange = (value) => {
    setAttemptCount(value)
    clearDerivedState()
  }

  const handleActivityChange = (value) => {
    setSelectedActivityId(value)
    setPreviewAssessment(null)
    setIsEvaluationStarted(false)
  }

  const handleResetSearch = () => {
    setSelectedYear('')
    setSelectedSgt('')
    setAttemptCount('')
    setSelectedActivityId('')
    setPreviewAssessment(null)
    setIsSearching(false)
    setIsEvaluationStarted(false)
    setSelectedStudentIndex(null)
    setIsLoadingStudent(false)
  }

  const handleSearchAssessment = () => {
    if (!selectedYear && !selectedSgt) {
      onAlert?.({ tone: 'warning', message: 'Select a Year or SGT to continue.' })
      return
    }

    if (!attemptCount) {
      onAlert?.({ tone: 'warning', message: 'Enter an attempt count to continue.' })
      return
    }

    if (!selectedActivityId) {
      onAlert?.({ tone: 'warning', message: 'Choose a competency activity before searching.' })
      return
    }

    if (!selectedActivity) {
      onAlert?.({ tone: 'danger', message: 'The chosen activity is not available for the current filter set.' })
      return
    }

    setIsSearching(true)
    window.setTimeout(() => {
      setIsSearching(false)
      setPreviewAssessment(selectedActivity)
      setIsEvaluationStarted(false)
      onAlert?.({ tone: 'primary', message: 'Evaluation flow loaded successfully.' })
    }, 650)
  }

  const handleStartEvaluation = () => {
    if (!previewAssessment) {
      onAlert?.({ tone: 'warning', message: 'Search and preview an activity before starting evaluation.' })
      return
    }
    setIsEvaluationStarted(true)
    setSelectedStudentIndex(0)
    onAlert?.({ tone: 'primary', message: 'Evaluation started for the selected activity.' })
  }

  const handleSelectStudent = (index) => {
    setIsLoadingStudent(true)
    window.setTimeout(() => {
      setSelectedStudentIndex(index)
      setIsLoadingStudent(false)
      const student = evaluationStudents[index]
      if (student) {
        setStudentAssessments((current) => ({
          ...current,
          [student.id]: current[student.id] ?? createStudentAssessmentState(),
        }))
      }
    }, 180)
  }

  const handleChecklistStatus = (itemId, status) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [itemId]: status,
      },
      submitted: false,
    }))
  }

  const handleTabChange = (tabId) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      activeTab: tabId,
    }))
  }

  const handleStudentFieldChange = (field, value) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      [field]: value,
      submitted: false,
    }))
  }

  const handleQuestionChange = (questionKey, value) => {
    if (!selectedStudent) return
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      questionAnswers: {
        ...current.questionAnswers,
        [questionKey]: value,
      },
      submitted: false,
    }))
  }

  const handleSaveEvaluation = () => {
    if (!selectedStudent) {
      onAlert?.({ tone: 'warning', message: 'Select a student before saving the evaluation.' })
      return
    }
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      lastSavedAt: Date.now(),
    }))
    onAlert?.({ tone: 'secondary', message: 'Evaluation saved successfully.' })
  }

  const handleSubmitEvaluation = () => {
    if (!selectedStudent) {
      onAlert?.({ tone: 'warning', message: 'Select a student before submitting the evaluation.' })
      return
    }
    updateStudentAssessment(selectedStudent.id, (current) => ({
      ...current,
      submitted: true,
      activeTab: current.activeTab,
    }))
    onAlert?.({ tone: 'secondary', message: 'Evaluation submitted successfully.' })
  }

  const handleStepStudent = (direction) => {
    if (selectedStudentIndex === null) return
    const nextIndex = selectedStudentIndex + direction
    if (nextIndex < 0 || nextIndex >= evaluationStudents.length) return
    handleSelectStudent(nextIndex)
  }

  return (
    <section className="vx-content forms-page skill-assessment-page">
      <div className="skill-assessment-shell">
        <PageBreadcrumbs items={[{ label: 'Skills' }, { label: 'Evaluation' }]} />
        <div className="vx-page-intro">
          <div className="vx-page-intro-title">
            <ClipboardCheck size={18} strokeWidth={2} className="vx-page-intro-icon" aria-hidden="true" />
            <h1>Evaluation</h1>
          </div>
        </div>

        <div className={`skill-assessment-stage ${previewAssessment ? 'has-preview' : ''}`}>
          <section className="skill-assessment-panel skill-assessment-config">
            <div className="skill-assessment-panel-head">
              <div>
                <h2>Configuration</h2>
                <p>Set the narrow filters before loading the available competency activities.</p>
              </div>
              <span className="skill-assessment-panel-pill">Step 1 - 2</span>
            </div>

            <div className="skill-assessment-form-grid">
              <label className="forms-field">
                <span>Year</span>
                <div className="forms-select-wrap">
                  <select value={selectedYear} onChange={(event) => handleYearChange(event.target.value)}>
                    <option value="">Select year</option>
                    {assessmentYearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="forms-field">
                <span>SGT</span>
                <div className="forms-select-wrap">
                  <select value={selectedSgt} onChange={(event) => handleSgtChange(event.target.value)}>
                    <option value="">Select SGT</option>
                    {availableSgtOptions.map((sgt) => (
                      <option key={sgt} value={sgt}>{sgt}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="forms-field">
                <span>Attempt Count</span>
                <input
                  type="number"
                  min="1"
                  max="3"
                  inputMode="numeric"
                  value={attemptCount}
                  onChange={(event) => handleAttemptChange(event.target.value)}
                  placeholder="1, 2, or 3"
                />
              </label>

              <label className="forms-field forms-field-full">
                <span>Select Competency Activity</span>
                <div className="forms-select-wrap">
                  <select value={selectedActivityId} onChange={(event) => handleActivityChange(event.target.value)}>
                    <option value="">Choose activity</option>
                    {filteredActivities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.competency} - {activity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div className="skill-assessment-actions">
              <button
                type="button"
                className="tool-btn green skill-assessment-search-btn"
                onClick={handleSearchAssessment}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <span className="skill-assessment-spinner" aria-hidden="true" />
                    Searching...
                  </>
                ) : (
                  'Search Activity'
                )}
              </button>
              <button type="button" className="ghost" onClick={handleResetSearch}>Reset Search</button>
            </div>

          </section>

          {previewAssessment ? (
            <aside className="skill-assessment-panel skill-assessment-preview-panel">
              <div className="skill-assessment-panel-head">
                <div>
                  <h2>Evaluation Preview</h2>
                  <p>Confirm the activity before entering the grading workspace.</p>
                </div>
                <span className="skill-assessment-panel-pill is-live">Ready</span>
              </div>

              <div className="skill-assessment-preview-card">
                <div className="skill-assessment-preview-head">
                  <span className="skill-assessment-badge is-competency">{previewAssessment.competency}</span>
                  <span className="skill-assessment-badge is-skill">{previewAssessment.skillType}</span>
                </div>

                <strong>{previewAssessment.name}</strong>

                <div className="skill-assessment-preview-meta">
                  <div>
                    <span>Year / SGT</span>
                    <strong>{previewAssessment.year} • {previewAssessment.sgt}</strong>
                  </div>
                  <div>
                    <span>No. of Students</span>
                    <strong>{previewAssessment.students}</strong>
                  </div>
                  <div>
                    <span>Attempt Count</span>
                    <strong>{attemptCount}</strong>
                  </div>
                </div>

                <p>The selected activity is ready for evaluation. Review the summary and then start the grading flow.</p>

                <div className="skill-assessment-preview-actions">
                  <button type="button" className="tool-btn green" onClick={handleStartEvaluation}>
                    Start Evaluation
                  </button>
                  <button type="button" className="ghost" onClick={handleResetSearch}>
                    Reset Search
                  </button>
                </div>
              </div>
            </aside>
          ) : null}
        </div>

        {isEvaluationStarted && previewAssessment ? (
          <section className="skill-assessment-panel skill-assessment-execution-panel">
            <div className="skill-assessment-panel-head">
              <div>
                <h2>Grading Workspace</h2>
                <p>Click a student to open the assessment flow, then move between tabs without losing progress.</p>
              </div>
              <span className="skill-assessment-panel-pill is-live">Live session</span>
            </div>

            <div className="skill-assessment-execution-summary">
              <div>
                <span>Activity</span>
                <strong>{previewAssessment.name}</strong>
              </div>
              <div>
                <span>Competency</span>
                <strong>{previewAssessment.competency}</strong>
              </div>
              <div>
                <span>Skill Type</span>
                <strong>{previewAssessment.skillType}</strong>
              </div>
            </div>

            <div className="skill-assessment-grading-layout">
              <aside className="skill-assessment-grading-list-panel">
                <div className="skill-assessment-list-head">
                  <strong>Student list</strong>
                  <span>{evaluationStudents.length} students</span>
                </div>
                <div className="skill-assessment-student-list">
                  {evaluationStudents.map((student, index) => {
                    const studentState = studentAssessments[student.id] ?? createStudentAssessmentState()
                    const isActive = selectedStudent?.id === student.id

                    return (
                      <article
                        key={student.id}
                        className={`skill-assessment-student-row ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleSelectStudent(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleSelectStudent(index)
                          }
                        }}
                      >
                        <div className="skill-assessment-student-index">{index + 1}</div>
                        <div className="skill-assessment-student-main">
                          <strong>{student.name}</strong>
                          <span>{student.id}</span>
                        </div>
                        <div className="skill-assessment-student-actions">
                          <div className={`skill-assessment-student-status ${studentState.submitted ? 'is-complete' : ''}`}>
                            {studentState.submitted ? 'Complete' : 'Pending'}
                          </div>
                          <button type="button" className="skill-assessment-grade-btn" onClick={() => handleSelectStudent(index)}>
                            Grade
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </aside>

              <section className="skill-assessment-grading-workspace">
                {isLoadingStudent ? (
                  <div className="skill-assessment-loading-state">
                    <span className="skill-assessment-spinner" aria-hidden="true" />
                    Loading student workspace...
                  </div>
                ) : selectedStudent && selectedStudentAssessment ? (
                  <div className="skill-assessment-grading-card" key={selectedStudent.id}>
                    <div className="skill-assessment-grading-header">
                      <div>
                        <h3>{selectedStudent.id} - {selectedStudent.name}</h3>
                        <p>Activity synced for focused grading in a single workspace.</p>
                      </div>
                      <div className="skill-assessment-grading-header-badges">
                        <span className="skill-assessment-badge is-competency">{previewAssessment.competency}</span>
                        <span className="skill-assessment-badge is-skill">{previewAssessment.skillType}</span>
                      </div>
                    </div>

                    <div className="skill-assessment-grading-metrics">
                      <div>
                        <span>Eval Count</span>
                        <strong>{selectedStudentEvalNumber} Out of {selectedStudentTotal}</strong>
                      </div>
                      <div>
                        <span>Eval Status</span>
                        <strong>{evaluationStatus}</strong>
                      </div>
                      <div>
                        <span>Obtained Marks</span>
                        <strong>{String(obtainedMarks).padStart(2, '0')} / 10</strong>
                      </div>
                      <div>
                        <span>Checklist Done</span>
                        <strong>{checklistCompleted} / {gradingChecklistItems.length}</strong>
                      </div>
                    </div>

                    <div className="skill-assessment-tab-list" role="tablist" aria-label="Assessment phases">
                      {gradingTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          className={selectedStudentAssessment.activeTab === tab.id ? 'active' : ''}
                          aria-selected={selectedStudentAssessment.activeTab === tab.id}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="skill-assessment-tab-panel">
                      {selectedStudentAssessment.activeTab === 'checklist' ? (
                        <div className="skill-assessment-checklist">
                          {gradingChecklistItems.map((item) => {
                            const status = selectedStudentAssessment.checklist[item.id] ?? 'pending'
                            return (
                              <article key={item.id} className={`skill-assessment-checklist-item is-${status}`}>
                                <div>
                                  <strong>{item.label}</strong>
                                  <span>{item.hint}</span>
                                </div>
                                <div className="skill-assessment-checklist-actions">
                                  <button
                                    type="button"
                                    className={status === 'pass' ? 'is-active pass' : 'pass'}
                                    onClick={() => handleChecklistStatus(item.id, 'pass')}
                                  >
                                    Pass
                                  </button>
                                  <button
                                    type="button"
                                    className={status === 'fail' ? 'is-active fail' : 'fail'}
                                    onClick={() => handleChecklistStatus(item.id, 'fail')}
                                  >
                                    Fail
                                  </button>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      ) : null}

                      {selectedStudentAssessment.activeTab === 'form' ? (
                        <div className="skill-assessment-form-panel">
                          <label className="skill-assessment-textarea-field">
                            <span>Activity Form Notes</span>
                            <textarea
                              rows="7"
                              value={selectedStudentAssessment.formNotes}
                              onChange={(event) => handleStudentFieldChange('formNotes', event.target.value)}
                              placeholder="Capture observed technique, sequence, and guidance points..."
                            />
                          </label>
                        </div>
                      ) : null}

                      {selectedStudentAssessment.activeTab === 'questions' ? (
                        <div className="skill-assessment-question-list">
                          {gradingQuestions.map((question, index) => {
                            const keyName = `question-${index + 1}`
                            return (
                              <label key={keyName} className="skill-assessment-textarea-field">
                                <span>{question}</span>
                                <textarea
                                  rows="4"
                                  value={selectedStudentAssessment.questionAnswers[keyName] ?? ''}
                                  onChange={(event) => handleQuestionChange(keyName, event.target.value)}
                                  placeholder="Enter the student response or your evaluation notes..."
                                />
                              </label>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>

                    <label className="skill-assessment-remarks-field">
                      <span>Enter your remarks...</span>
                      <textarea
                        rows="4"
                        value={selectedStudentAssessment.remarks}
                        onChange={(event) => handleStudentFieldChange('remarks', event.target.value)}
                        placeholder="Add constructive remarks for the student report..."
                      />
                    </label>

                    <div className="skill-assessment-footer-bar">
                      <div className="skill-assessment-save-state">
                        <span>Auto-save</span>
                        <strong>Saved just now</strong>
                      </div>
                      <div className="skill-assessment-footer-actions">
                        <button type="button" className="ghost" onClick={() => handleStepStudent(-1)} disabled={selectedStudentIndex === 0}>
                          Previous
                        </button>
                        <button type="button" className="ghost" onClick={handleSaveEvaluation}>
                          Save Evaluation
                        </button>
                        <button type="button" className="tool-btn green" onClick={handleSubmitEvaluation}>
                          Submit Evaluation
                        </button>
                        <button type="button" className="ghost" onClick={() => handleStepStudent(1)} disabled={selectedStudentIndex === evaluationStudents.length - 1}>
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="skill-assessment-empty-state">
                    <strong>Select a student to begin grading</strong>
                    <p>Choose a name from the left panel to open the assessment workspace with synced activity details, count tracking, and tabs.</p>
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}


export default SkillAssessmentPage


