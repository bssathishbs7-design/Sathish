import { LogOut, Moon, Pencil, RotateCcw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { APP_PAGES } from '../config/appPages'
import '../styles/assessment-pages.css'

const ASSESSMENT_EVALUATION_SELECTED_KEY = 'vx-assessment-evaluation-selected'
const CREATE_ASSESSMENT_QUESTIONS_KEY = 'vx-create-assessment-questions'
const ASSESSMENT_CREATE_INITIAL_TAB_KEY = 'vx-assessment-create-initial-tab'
const STUDENT_EXAM_SESSION_KEY = 'vx-student-exam-session'
const STUDENT_EXAM_SESSION_EVENT = 'vx-student-exam-session-changed'
const STUDENT_EXAM_SUBMISSION_STATUS_KEY = 'vx-student-exam-submission-status'
const STUDENT_EXAM_SUBMISSION_STATUS_EVENT = 'vx-student-exam-submission-status-changed'
const ASSESSMENT_EVALUATION_ATTENDANCE_KEY = 'vx-assessment-evaluation-attendance'
const DEFAULT_EVALUATION_STUDENTS = [
  { id: 'MV1253', name: 'Student 1', attendance: 'P' },
  { id: 'MV1254', name: 'Student 2', attendance: 'P' },
  { id: 'MV1255', name: 'Student 3', attendance: 'P' },
  { id: 'MC2568', name: 'Karthik Subramanian', attendance: 'P' },
]

const readSelectedAssessment = () => {
  try {
    const storedAssessment = window.sessionStorage.getItem(ASSESSMENT_EVALUATION_SELECTED_KEY)
    return storedAssessment ? JSON.parse(storedAssessment) : null
  } catch {
    return null
  }
}

const readStorageObject = (key) => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeStorageObject = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const getAssessmentYear = (assessment) => assessment?.academicYear
  || assessment?.setup?.academicYear
  || '2025 - 2026'

const getAssessmentValue = (assessment, key, fallback = '-') => assessment?.[key]
  || assessment?.setup?.[key]
  || fallback

const getAssessmentLogo = (assessment) => assessment?.logoPreview
  || assessment?.setup?.logoPreview
  || ''

const getAssessmentControlId = (assessment) => (
  assessment?.id || assessment?.assessmentId || assessment?.setup?.assessmentId || 'selected-assessment'
)

const getManualAttendanceStorageKey = (assessment) => (
  `${ASSESSMENT_EVALUATION_ATTENDANCE_KEY}:${getAssessmentControlId(assessment)}`
)

const isOfflineAssessment = (assessment) => String(
  assessment?.examMode
  || assessment?.mode
  || assessment?.setup?.examMode
  || assessment?.setup?.mode
  || '',
).toLowerCase().includes('offline')

const stripHtml = (value) => String(value ?? '')
  .replace(/<\/?[A-Za-z][^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .trim()

const parseMarksValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isDescriptiveQuestionType = (type) => (
  type === 'Descriptive Question'
  || String(type ?? '').toLowerCase().includes('descriptive')
  || String(type ?? '').includes('SAQs')
  || String(type ?? '').includes('MEQs')
  || String(type ?? '').includes('LAQs')
)

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

const readAssessmentQuestions = (assessment) => {
  const attachedQuestions = [
    assessment?.questions,
    assessment?.selectedQuestions,
    assessment?.setup?.questions,
    assessment?.setup?.selectedQuestions,
  ].find((items) => Array.isArray(items))

  if (attachedQuestions) return attachedQuestions

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getAssessmentQuestionsStorageKey(assessment?.setup ?? assessment)) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatTwoDigit = (value) => String(Number(value) || 0).padStart(2, '0')

const getQuestionSummary = (assessment) => {
  const questions = readAssessmentQuestions(assessment)
  const mcqQuestions = questions.filter((item) => !isDescriptiveQuestionType(item?.type))
  const descriptiveQuestions = questions.filter((item) => isDescriptiveQuestionType(item?.type))
  const mcqMarks = mcqQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)
  const descriptiveMarks = descriptiveQuestions.reduce((total, item) => total + getQuestionMarksTotal(item), 0)

  return {
    mcqCount: mcqQuestions.length,
    descriptiveCount: descriptiveQuestions.length,
    totalCount: questions.length,
    mcqMarks,
    descriptiveMarks,
    totalMarks: mcqMarks + descriptiveMarks,
  }
}

const hasValidDateValue = (value) => {
  if (!value) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}

const readEvaluationStudents = (assessment, studentSessions = {}, submissionStatuses = {}, manualAttendance = {}) => {
  const attachedStudents = [
    assessment?.students,
    assessment?.assignedStudents,
    assessment?.studentRows,
    assessment?.setup?.students,
    assessment?.setup?.assignedStudents,
  ].find((items) => Array.isArray(items) && items.length)

  const assessmentId = getAssessmentControlId(assessment)
  const baseStudents = attachedStudents || DEFAULT_EVALUATION_STUDENTS
  const hasAttachedStudents = Boolean(attachedStudents)
  const isOffline = isOfflineAssessment(assessment)

  return baseStudents.map((student, index) => {
    const id = student.id || student.studentId || student.registerId || `ST${String(index + 1).padStart(4, '0')}`
    const session = studentSessions?.[assessmentId]?.[id] || null
    const submission = submissionStatuses?.[assessmentId]?.[id] || null
    const isPresent = hasValidDateValue(session?.loginTime) || Boolean(submission?.status)
    const savedAttendance = manualAttendance[id]

    return {
      id,
      name: student.name || student.studentName || `Student ${index + 1}`,
      attendance: isOffline ? (savedAttendance || (hasAttachedStudents ? (student.attendance || student.attendanceStatus) : '') || 'P') : (isPresent ? 'P' : 'A'),
    }
  })
}

export default function AssessmentEvaluationPage({ onNavigate, onAlert, theme = 'light', onToggleTheme }) {
  const [assessment] = useState(() => readSelectedAssessment())
  const [studentSessions, setStudentSessions] = useState(() => readStorageObject(STUDENT_EXAM_SESSION_KEY))
  const [submissionStatuses, setSubmissionStatuses] = useState(() => readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))
  const [manualAttendance, setManualAttendance] = useState(() => readStorageObject(getManualAttendanceStorageKey(readSelectedAssessment())))

  const assessmentName = getAssessmentValue(assessment, 'assessmentName', 'Assessment Evaluation')
  const academicYear = getAssessmentYear(assessment)
  const examMode = getAssessmentValue(assessment, 'examMode', 'Online')
  const examCategory = getAssessmentValue(assessment, 'examCategory', 'Assessment')
  const examYear = assessment?.assignTo || assessment?.year || assessment?.setup?.year || '-'
  const examType = getAssessmentValue(assessment, 'examType')
  const logoPreview = getAssessmentLogo(assessment)
  const logoName = getAssessmentValue(assessment, 'logoName', 'Assessment logo')
  const headerSubtitle = [examCategory, examYear, examType, academicYear]
    .map((value) => value || '-')
    .join(' / ')
  const questionSummary = getQuestionSummary(assessment)
  const isOffline = isOfflineAssessment(assessment)
  const evaluationRows = readEvaluationStudents(assessment, studentSessions, submissionStatuses, manualAttendance)
  const maxMark = questionSummary.totalMarks || Number(assessment?.totalMarks ?? assessment?.setup?.totalMarks ?? 0) || 0
  const showTableAction = (action, row) => {
    onAlert?.({
      tone: 'primary',
      message: `${action} selected for ${row.name}.`,
    })
  }

  const exitToEvaluationTab = () => {
    window.localStorage.setItem(ASSESSMENT_CREATE_INITIAL_TAB_KEY, 'evaluation')
    onNavigate?.(APP_PAGES.ASSESSMENT_CREATE)
  }

  const updateManualAttendance = (studentId, attendance) => {
    setManualAttendance((current) => {
      const nextAttendance = { ...current, [studentId]: attendance }
      writeStorageObject(getManualAttendanceStorageKey(assessment), nextAttendance)
      return nextAttendance
    })
  }

  useEffect(() => {
    const syncStudentSessions = () => setStudentSessions(readStorageObject(STUDENT_EXAM_SESSION_KEY))
    const syncSubmissionStatuses = () => setSubmissionStatuses(readStorageObject(STUDENT_EXAM_SUBMISSION_STATUS_KEY))

    const handleStorage = (event) => {
      if (event.key === STUDENT_EXAM_SESSION_KEY) syncStudentSessions()
      if (event.key === STUDENT_EXAM_SUBMISSION_STATUS_KEY) syncSubmissionStatuses()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(STUDENT_EXAM_SESSION_EVENT, syncStudentSessions)
    window.addEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, syncSubmissionStatuses)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(STUDENT_EXAM_SESSION_EVENT, syncStudentSessions)
      window.removeEventListener(STUDENT_EXAM_SUBMISSION_STATUS_EVENT, syncSubmissionStatuses)
    }
  }, [])

  return (
    <section className="assessment-evaluation-workspace">
      <header className="assessment-evaluation-top-header">
        <div className="assessment-evaluation-brand-block">
          <span className="assessment-evaluation-logo" aria-hidden="true">
            {logoPreview ? (
              <img src={logoPreview} alt={logoName} />
            ) : (
              <span>{String(assessmentName).charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="assessment-evaluation-title-block">
            <h1>{assessmentName}</h1>
            <p>
              <span className={`assessment-evaluation-mode-text is-${String(examMode).toLowerCase().includes('offline') ? 'offline' : 'online'}`}>
                {examMode}
              </span>
              {' / '}
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="assessment-evaluation-right-block">
          <div className="assessment-evaluation-summary-badges" aria-label="Assessment question and mark summary">
            <span>
              <em>Total Questions</em>
              <strong>
                {formatTwoDigit(questionSummary.totalCount)}
                <small>({formatTwoDigit(questionSummary.mcqCount)} MCQ / {formatTwoDigit(questionSummary.descriptiveCount)} Descriptive)</small>
              </strong>
            </span>
            <span>
              <em>Total Marks</em>
              <strong>
                {formatTwoDigit(questionSummary.totalMarks)}
                <small>({formatTwoDigit(questionSummary.mcqMarks)} MCQ / {formatTwoDigit(questionSummary.descriptiveMarks)} Descriptive)</small>
              </strong>
            </span>
          </div>
          <div className="assessment-evaluation-header-actions" aria-label="Evaluation actions">
            <button
              type="button"
              className="assessment-evaluation-icon-btn"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={2.3} /> : <Moon size={17} strokeWidth={2.3} />}
            </button>
            <button
              type="button"
              className="assessment-evaluation-exit-btn"
              onClick={exitToEvaluationTab}
            >
              <LogOut size={15} strokeWidth={2.4} />
              Exit
            </button>
          </div>
        </div>
      </header>

      <section className="assessment-evaluation-table-card" aria-label="Student evaluation tracking">
        <div className="assessment-evaluation-table-wrap">
          <table className="assessment-evaluation-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Attendance</th>
                <th>Student Name</th>
                <th>Eval. Status</th>
                <th>MCQ</th>
                <th>Descriptive</th>
                <th>Attempted Ques</th>
                <th>Max Mark</th>
                <th>Obt. Marks</th>
                <th>Percentage</th>
                <th>Results</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {evaluationRows.map((row) => {
                const isAbsent = String(row.attendance).toUpperCase() === 'A'
                const evalStatus = isAbsent ? 'Absent' : 'Yet to Start'
                return (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {isOffline ? (
                        <span className="assessment-evaluation-attendance-toggle" aria-label={`Attendance for ${row.name}`}>
                          <button
                            type="button"
                            className={row.attendance === 'P' ? 'is-present is-active' : 'is-present'}
                            onClick={() => updateManualAttendance(row.id, 'P')}
                            aria-label={`Mark ${row.name} present`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            className={row.attendance === 'A' ? 'is-absent is-active' : 'is-absent'}
                            onClick={() => updateManualAttendance(row.id, 'A')}
                            aria-label={`Mark ${row.name} absent`}
                          >
                            A
                          </button>
                        </span>
                      ) : (
                        <span className={`assessment-evaluation-attendance is-${String(row.attendance).toLowerCase()}`}>{row.attendance}</span>
                      )}
                    </td>
                    <td>{row.name}</td>
                    <td><span className={`assessment-evaluation-status ${isAbsent ? 'is-absent' : 'is-yet-to-start'}`}>{evalStatus}</span></td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>{formatTwoDigit(maxMark)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      <button type="button" className="assessment-evaluation-result-btn" onClick={() => showTableAction('View', row)} disabled={isAbsent}>
                        View
                      </button>
                    </td>
                    <td>
                      <div className="assessment-evaluation-row-actions">
                        <button type="button" className="is-icon" onClick={() => showTableAction('Reset', row)} aria-label={`Reset ${row.name}`} disabled={isAbsent}>
                          <RotateCcw size={14} strokeWidth={2.4} />
                        </button>
                        <button type="button" className="is-icon" onClick={() => showTableAction('Edit', row)} aria-label={`Edit ${row.name}`} disabled={isAbsent}>
                          <Pencil size={14} strokeWidth={2.4} />
                        </button>
                        <button type="button" className="is-primary" onClick={() => showTableAction('Start Evaluation', row)} disabled={isAbsent}>Start Evaluation</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
