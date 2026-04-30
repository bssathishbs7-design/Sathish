import { useEffect, useState } from 'react'
import './App.css'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SkillManagementPage from './pages/SkillManagementPage'
import SkillAssessmentPage from './pages/SkillAssessmentPage'
import CompletedEvaluationPage from './pages/CompletedEvaluationPage'
import ReviewApprovePage from './pages/ReviewApprovePage'
import ApprovalViewPage from './pages/ApprovalViewPage'
import DashboardSummaryPage from './pages/DashboardSummaryPage'
import StartEvaluationPage from './pages/StartEvaluationPage'
import ExamLogPage from './pages/ExamLogPage'
import MySkillActivityPage from './pages/MySkillActivityPage'
import ProgressTrackingPage from './pages/ProgressTrackingPage'
import ActivityResultPage from './pages/ActivityResultPage'
import StudentExamPage from './pages/StudentExamPage'
import FacultyManagementPageV2 from './pages/FacultyManagementPageV2'
import StudentManagementPage from './pages/StudentManagementPage'
import ImageActivityPage from './pages/ImageActivityPage'
import InterpretationActivityPage from './pages/InterpretationActivityPage'
import OspeActivityPage from './pages/OspeActivityPage'
import { APP_PAGES } from './config/appPages'

const PAGE_PATHS = {
  [APP_PAGES.DASHBOARD]: '/',
  [APP_PAGES.CONFIGURATION]: '/skills/configuration',
  [APP_PAGES.EVALUATION]: '/skills/evaluation',
  [APP_PAGES.ACTIVITY_RESULT]: '/skills/activity-result',
  [APP_PAGES.COMPLETED_EVALUATION]: '/skills/completed-evaluation',
  [APP_PAGES.REVIEW_APPROVE]: '/skills/review-approve',
  [APP_PAGES.APPROVAL_VIEW]: '/skills/approvalview',
  [APP_PAGES.START_EVALUATION]: '/skills/start-evaluation',
  [APP_PAGES.EXAM_LOG]: '/skills/exam-log',
  [APP_PAGES.OSPE_ACTIVITY]: '/skills/ospe-activity',
  [APP_PAGES.IMAGE_ACTIVITY]: '/skills/image-activity',
  [APP_PAGES.INTERPRETATION_ACTIVITY]: '/skills/interpretation-activity',
  [APP_PAGES.MY_SKILL_ACTIVITY]: '/my-skills/activity',
  [APP_PAGES.STUDENT_EXAM]: '/my-skills/exam',
  [APP_PAGES.PROGRESS_TRACKING]: '/my-skills/progress',
  [APP_PAGES.FACULTY_MANAGEMENT]: '/faculty-management',
  [APP_PAGES.STUDENT_MANAGEMENT]: '/student-management',
  [APP_PAGES.DASHBOARD_SUMMARY]: '/skills/dashboard-summary',
  [APP_PAGES.PROFILE_SETTINGS]: '/profile/settings',
  [APP_PAGES.LOGIN]: '/login',
}

const PATH_PAGES = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page]),
)

const getPageFromPath = (pathname) => PATH_PAGES[pathname] ?? APP_PAGES.DASHBOARD

const START_EVALUATION_STORAGE_KEY = 'vx-start-evaluation-record'
const ASSIGNED_SKILL_ACTIVITIES_STORAGE_KEY = 'vx-assigned-skill-activities'
const EVALUATION_RECORDS_STORAGE_KEY = 'vx-evaluation-records'
const COMPLETED_EVALUATIONS_STORAGE_KEY = 'vx-completed-evaluation-rows'
const APPROVAL_QUEUE_STORAGE_KEY = 'vx-approval-queue-rows'
const APPROVAL_VIEW_STORAGE_KEY = 'vx-approval-view-record'
const PROGRESS_RESULT_STORAGE_KEY = 'vx-progress-result-record'
const ACTIVITY_RESULT_STORAGE_KEY = 'vx-activity-result-record'

const readStoredStartEvaluationRecord = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(START_EVALUATION_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const storeStartEvaluationRecord = (record) => {
  if (!record) return

  try {
    window.sessionStorage.setItem(START_EVALUATION_STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.warn('Unable to persist start evaluation record in session storage.', error)
  }
}

const readStoredApprovalViewRecord = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(APPROVAL_VIEW_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const storeApprovalViewRecord = (record) => {
  if (!record) return

  try {
    window.sessionStorage.setItem(APPROVAL_VIEW_STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.warn('Unable to persist approval view record in session storage.', error)
  }
}

const readStoredProgressResultRecord = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(PROGRESS_RESULT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const storeProgressResultRecord = (record) => {
  if (!record) return

  try {
    window.sessionStorage.setItem(PROGRESS_RESULT_STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.warn('Unable to persist progress result record in session storage.', error)
  }
}

const readStoredActivityResultRecord = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(ACTIVITY_RESULT_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const storeActivityResultRecord = (record) => {
  if (!record) return

  try {
    window.sessionStorage.setItem(ACTIVITY_RESULT_STORAGE_KEY, JSON.stringify(record))
  } catch (error) {
    console.warn('Unable to persist activity result record in session storage.', error)
  }
}

const readStoredRows = (key) => {
  try {
    const rows = JSON.parse(window.sessionStorage.getItem(key) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

const storeRows = (key, rows) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []))
  } catch (error) {
    console.warn(`Unable to persist session rows for ${key}.`, error)
  }
}

const STUDENT_COUNT_BY_YEAR_AND_SGT = {
  'First Year': { 'SGT A': 42, 'SGT B': 38, 'SGT C': 40 },
  'Second Year': { 'SGT A': 36, 'SGT B': 34, 'SGT C': 32 },
  'Third Year': { 'SGT A': 28, 'SGT B': 30, 'SGT C': 26 },
  'Final Year': { 'SGT A': 24, 'SGT B': 22, 'SGT C': 20 },
}

const parseAssignmentTarget = (assignedTo = '') => {
  const [year = 'First Year', sgt = 'SGT A'] = String(assignedTo)
    .split(/\s*(?:•|·|â€¢)\s*/)
    .map((part) => part.trim())
    .filter(Boolean)

  return { year, sgt }
}

const estimateStudentCount = (year, sgt) => (
  STUDENT_COUNT_BY_YEAR_AND_SGT[year]?.[sgt]
  ?? Object.values(STUDENT_COUNT_BY_YEAR_AND_SGT[year] ?? {}).reduce((sum, count) => sum + count, 0)
  ?? 30
)

const getAssignmentQuestionCount = (assignment) => (
  (assignment.examData?.modules?.questions?.length ?? 0)
  + (assignment.examData?.modules?.form?.length ?? 0)
  + (assignment.examData?.modules?.scaffolding?.length ?? 0)
)

const isAssignmentCertifiable = (assignment) => Boolean(
  assignment?.certifiable
  ?? assignment?.isCertifiable
  ?? assignment?.examData?.certifiable
  ?? assignment?.examData?.isCertifiable
  ?? assignment?.activityData?.activity?.certifiable
  ?? assignment?.activityData?.activity?.isCertifiable
)

const buildEvaluationRecordFromAssignment = (assignment) => {
  const { year, sgt } = parseAssignmentTarget(assignment.assignedTo)

  return {
    id: assignment.id,
    sourceActivityId: assignment.sourceActivityId ?? assignment.id,
    activityName: assignment.title ?? 'Untitled Activity',
    activityType: assignment.type ?? 'Activity',
    studentCount: assignment.studentCount ?? estimateStudentCount(year, sgt),
    year,
    sgt,
    attemptCount: assignment.attemptCount ?? '1 / 1',
    createdDate: assignment.createdDate ?? new Date().toLocaleDateString('en-GB'),
    evaluationStatus: assignment.evaluationStatus ?? 'Pending Evaluation',
    questionCount: assignment.questionCount ?? getAssignmentQuestionCount(assignment),
    certifiable: isAssignmentCertifiable(assignment),
    thresholds: assignment.thresholds ?? assignment.examData?.thresholds ?? [],
    examData: assignment.examData ?? null,
    activityData: assignment.activityData ?? null,
  }
}

const getLatestActivityResultRows = (activityId, rows = []) => {
  const latestRows = new Map()

  rows
    .filter((row) => String(row.activityId ?? '') === String(activityId ?? ''))
    .forEach((row) => {
      const key = row.studentId ?? row.registerId ?? row.id
      if (!key) return

      const current = latestRows.get(key)
      const rowAttempt = Number(row.attemptNumber) || 1
      const currentAttempt = Number(current?.attemptNumber) || 0

      if (!current || rowAttempt >= currentAttempt) {
        latestRows.set(key, row)
      }
    })

  return [...latestRows.values()]
}

const getReattemptRows = (activityId, rows = []) => getLatestActivityResultRows(activityId, rows)
  .filter((row) => ['repeat', 'remedial'].includes(String(row.resultStatus ?? '').trim().toLowerCase()))

const idsMatch = (left, right) => String(left ?? '') === String(right ?? '')

const baseRows = [
  ['1', 'Mark', 'Otto', '@mdo'],
  ['2', 'Jacob', 'Thornton', '@fat'],
  ['3', 'Larry', 'Bird', '@twitter'],
]

function TableCard({ title, helper, className = '', rows = baseRows }) {
  return (
    <section className={`vx-card ${className}`}>
      <header className="vx-card-head">
        <div>
          <h3>{title}</h3>
          <p>{helper}</p>
        </div>
        <button type="button" className="vx-dots" aria-label="More options">
          ...
        </button>
      </header>
      <div className="vx-table-wrap">
        <table className="vx-table">
          <thead>
            <tr>
              <th>#</th>
              <th>First</th>
              <th>Last</th>
              <th>Handle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={`${row[0]}-${cell}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AppAlert({ alert }) {
  const config = {
    primary: { icon: Info, className: 'vx-alert-primary' },
    secondary: { icon: CheckCircle2, className: 'vx-alert-secondary' },
    warning: { icon: AlertTriangle, className: 'vx-alert-warning' },
    danger: { icon: OctagonAlert, className: 'vx-alert-danger' },
  }[alert.tone] ?? { icon: Info, className: 'vx-alert-primary' }

  const Icon = config.icon

  return (
    <article className={`vx-alert ${config.className}`} role="status" aria-live="polite">
      <span className="vx-alert-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <p>{alert.message}</p>
    </article>
  )
}

/**
 * App Shell Implementation Contract
 * Structure:
 * - Owns global shell orchestration, active page selection, theme, and sidebar state.
 * Dependencies:
 * - React state/effect hooks
 * - Shared page ids from src/config/appPages.js
 * - Shared shell components: Navbar and Sidebar
 * Props / Data:
 * - No incoming props; this is the top-level application container.
 * State:
 * - Shell state: sidebarCollapsed, mobileSidebarOpen, theme, isFullscreen
 * - Navigation state: activePage, selectedImageActivity
 * - Profile UI state: isProfileMenuOpen, profileToast
 * Hooks / Browser APIs:
 * - fullscreenchange listener for fullscreen sync
 * - pointerdown listener for profile menu dismissal
 * Responsive behavior:
 * - Desktop uses a collapsible sidebar
 * - Mobile uses an overlay sidebar and bottom nav affordance
 * Placement:
 * - Must remain the app entry shell because all page-level routing-like behavior depends on it.
 */
function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => window.localStorage.getItem('vx-theme') ?? 'light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const useCompactLogo = sidebarCollapsed
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname))
  const [selectedImageActivity, setSelectedImageActivity] = useState(null)
  const [selectedInterpretationActivity, setSelectedInterpretationActivity] = useState(null)
  const [selectedOspeActivity, setSelectedOspeActivity] = useState(null)
  const [selectedDashboardData, setSelectedDashboardData] = useState(null)
  const [savedImageActivities, setSavedImageActivities] = useState({})
  const [assignedSkillActivities, setAssignedSkillActivities] = useState(() => readStoredRows(ASSIGNED_SKILL_ACTIVITIES_STORAGE_KEY))
  const [evaluationRecords, setEvaluationRecords] = useState(() => readStoredRows(EVALUATION_RECORDS_STORAGE_KEY))
  const [examMonitoringLogs, setExamMonitoringLogs] = useState([])
  const [selectedStudentExamAssignment, setSelectedStudentExamAssignment] = useState(null)
  const [selectedEvaluationRecord, setSelectedEvaluationRecord] = useState(() => readStoredStartEvaluationRecord())
  const [selectedEvaluationStudentId, setSelectedEvaluationStudentId] = useState('')
  const [selectedCompletedEvaluationActivityId, setSelectedCompletedEvaluationActivityId] = useState(null)
  const [completedEvaluationRows, setCompletedEvaluationRows] = useState(() => readStoredRows(COMPLETED_EVALUATIONS_STORAGE_KEY))
  const [approvalQueueRows, setApprovalQueueRows] = useState(() => readStoredRows(APPROVAL_QUEUE_STORAGE_KEY))
  const [selectedApprovalViewRecord, setSelectedApprovalViewRecord] = useState(() => readStoredApprovalViewRecord())
  const [selectedProgressResultRecord, setSelectedProgressResultRecord] = useState(() => readStoredProgressResultRecord())
  const [selectedActivityResultRecord, setSelectedActivityResultRecord] = useState(() => readStoredActivityResultRecord())
  const [selectedExamLogContext, setSelectedExamLogContext] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
  const [alerts, setAlerts] = useState([])
  const isExamMode = activePage === APP_PAGES.STUDENT_EXAM
  const activeEvaluationRecord = selectedEvaluationRecord
    ?? evaluationRecords.find((record) => idsMatch(record.id, selectedCompletedEvaluationActivityId))
    ?? readStoredStartEvaluationRecord()
    ?? completedEvaluationRows.find((row) => row.activityRecord)?.activityRecord
    ?? null
  const profileUser = {
    name: 'Karthik Subramanian',
    registerId: 'MC2568',
    designation: 'Admin',
    role: 'Admin',
  }

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!event.target.closest?.('.vx-profile-menu')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!profileToast) return undefined
    const timer = window.setTimeout(() => setProfileToast(''), 1800)
    return () => window.clearTimeout(timer)
  }, [profileToast])

  useEffect(() => {
    window.localStorage.setItem('vx-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!selectedEvaluationRecord) return
    storeStartEvaluationRecord(selectedEvaluationRecord)
  }, [selectedEvaluationRecord])

  useEffect(() => {
    storeRows(ASSIGNED_SKILL_ACTIVITIES_STORAGE_KEY, assignedSkillActivities)
  }, [assignedSkillActivities])

  useEffect(() => {
    storeRows(EVALUATION_RECORDS_STORAGE_KEY, evaluationRecords)
  }, [evaluationRecords])

  useEffect(() => {
    storeRows(COMPLETED_EVALUATIONS_STORAGE_KEY, completedEvaluationRows)
  }, [completedEvaluationRows])

  useEffect(() => {
    storeRows(APPROVAL_QUEUE_STORAGE_KEY, approvalQueueRows)
  }, [approvalQueueRows])

  useEffect(() => {
    if (!selectedApprovalViewRecord) return
    storeApprovalViewRecord(selectedApprovalViewRecord)
  }, [selectedApprovalViewRecord])

  useEffect(() => {
    if (!selectedProgressResultRecord) return
    storeProgressResultRecord(selectedProgressResultRecord)
  }, [selectedProgressResultRecord])

  useEffect(() => {
    if (!selectedActivityResultRecord) return
    storeActivityResultRecord(selectedActivityResultRecord)
  }, [selectedActivityResultRecord])

  useEffect(() => {
    const resolvedPage = getPageFromPath(window.location.pathname)
    if (!PATH_PAGES[window.location.pathname]) {
      window.history.replaceState({ page: resolvedPage }, '', PAGE_PATHS[resolvedPage])
    }

    const handlePopState = () => {
      setActivePage(getPageFromPath(window.location.pathname))
      setMobileSidebarOpen(false)
      setIsProfileMenuOpen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!alerts.length) return undefined

    const timers = alerts.map((alert) => window.setTimeout(() => {
      setAlerts((current) => current.filter((item) => item.id !== alert.id))
    }, alert.duration ?? 3200))

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [alerts])

  const showAlert = ({ tone = 'primary', message, duration } = {}) => {
    if (!message) return

    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setAlerts([{ id, tone, message, duration }])
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const navigateToPage = (page, options = {}) => {
    const { replace = false } = options
    const nextPath = PAGE_PATHS[page] ?? PAGE_PATHS[APP_PAGES.DASHBOARD]
    const historyMethod = replace ? 'replaceState' : 'pushState'

    if (window.location.pathname !== nextPath || replace) {
      window.history[historyMethod]({ page }, '', nextPath)
    }

    setActivePage(page)
    setMobileSidebarOpen(false)
    setIsProfileMenuOpen(false)
  }

  const handleEditProfile = () => {
    navigateToPage(APP_PAGES.PROFILE_SETTINGS)
    showAlert({ tone: 'primary', message: 'Profile settings opened.' })
  }

  const handleSignOut = () => {
    setIsProfileMenuOpen(false)
    setProfileToast('Logging out...')
    navigateToPage(APP_PAGES.LOGIN)
    showAlert({ tone: 'warning', message: 'You have been signed out of the current session.' })
  }

  const openDashboardSummaryPage = (dashboardData) => {
    setSelectedDashboardData(dashboardData ?? null)
    navigateToPage(APP_PAGES.DASHBOARD_SUMMARY)
  }

  const handleAssignSkillActivity = (assignment) => {
    if (!assignment?.id) return
    const { year, sgt } = parseAssignmentTarget(assignment.assignedTo)
    const assignmentInstanceId = assignment.assignmentInstanceId
      ?? `${assignment.id}-assigned-${Date.now()}`
    const normalizedAssignment = {
      ...assignment,
      id: assignmentInstanceId,
      sourceActivityId: assignment.id,
      year,
      sgt,
      studentCount: assignment.studentCount ?? estimateStudentCount(year, sgt),
      status: 'Assigned',
      action: 'Start Activity',
      tone: 'primary',
      evaluationStatus: 'Pending Evaluation',
    }

    setApprovalQueueRows((current) => current.filter((item) => String(item.activityId ?? '') !== String(assignmentInstanceId)))
    setCompletedEvaluationRows((current) => current.filter((item) => String(item.activityId ?? '') !== String(assignmentInstanceId)))
    setSelectedApprovalViewRecord((current) => (
      String(current?.activityId ?? '') === String(assignmentInstanceId) ? null : current
    ))

    setAssignedSkillActivities((current) => {
      const next = current.filter((item) => item.id !== assignment.id)
      return [normalizedAssignment, ...next]
    })
    setEvaluationRecords((current) => [
      buildEvaluationRecordFromAssignment(normalizedAssignment),
      ...current.filter((item) => item.id !== normalizedAssignment.id),
    ])
    showAlert({ tone: 'secondary', message: 'Activity assigned successfully. It is now available in My Skill Activity.' })
    navigateToPage(APP_PAGES.MY_SKILL_ACTIVITY)
  }

  const handleStartAssignedSkillActivity = (assignment) => {
    if (!assignment) return
    const actionLabel = String(assignment.action ?? '').trim().toLowerCase()

    if (actionLabel === 'view results' || String(assignment.status ?? '').trim().toLowerCase() === 'completed') {
      const activityId = assignment.id ?? assignment.activityId
      const linkedEvaluationRecord = evaluationRecords.find((item) => String(item.id ?? item.activityId) === String(activityId))
      const activityRows = completedEvaluationRows
        .filter((row) => String(row.activityId ?? '') === String(activityId ?? ''))
        .sort((left, right) => {
          const leftAttempt = Number(left.attemptNumber) || 0
          const rightAttempt = Number(right.attemptNumber) || 0
          const attemptDiff = rightAttempt - leftAttempt

          if (attemptDiff !== 0) return attemptDiff

          return (Date.parse(right.submittedAt ?? '') || 0) - (Date.parse(left.submittedAt ?? '') || 0)
        })
      const matchedRow = activityRows.find((row) => (
        String(row.studentId ?? row.registerId ?? '').trim().toLowerCase() === String(assignment.studentId ?? '').trim().toLowerCase()
        || String(row.studentName ?? '').trim().toLowerCase() === String(assignment.studentName ?? '').trim().toLowerCase()
      )) ?? activityRows[0] ?? null

      const progressContext = {
        ...assignment,
        activityId,
        evaluationRecord: linkedEvaluationRecord ?? null,
        latestCompletedRow: matchedRow,
      }

      setSelectedProgressResultRecord(progressContext)
      navigateToPage(APP_PAGES.PROGRESS_TRACKING)
      return
    }

    setSelectedStudentExamAssignment(assignment)
    navigateToPage(APP_PAGES.STUDENT_EXAM)
  }

  const handleOpenActivityResult = (record) => {
    if (!record) return

    setSelectedActivityResultRecord(record)
    navigateToPage(APP_PAGES.ACTIVITY_RESULT)
  }

  const handleSubmitStudentExam = (submission) => {
    if (!submission?.id) return

    setAssignedSkillActivities((current) => current.map((item) => (
      item.id === submission.id
        ? {
            ...item,
            ...submission,
            status: 'Completed',
            action: 'View Results',
            tone: 'secondary',
          }
        : item
    )))

    setSelectedStudentExamAssignment(submission)
  }

  const handleRecordExamLog = (entry) => {
    if (!entry?.activityId || !entry?.studentId || !entry?.eventType) return

    setExamMonitoringLogs((current) => [
      {
        id: entry.id ?? `exam-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        severity: entry.severity ?? 'info',
        ...entry,
      },
      ...current,
    ])
  }

  const handleOpenStartEvaluation = (record, options = {}) => {
    if (!record) return
    const { studentId = '' } = options
    const recordId = record.id ?? record.activityId
    if (!recordId) return

    const linkedAssignment = assignedSkillActivities.find((item) => item.id === recordId)
    const linkedApprovalRow = approvalQueueRows.find((item) => String(item.activityId ?? '') === String(recordId))
    const linkedSubmission = linkedAssignment?.answers ? linkedAssignment : null
    const linkedCompletedRow = studentId
      ? completedEvaluationRows.find((row) => row.id === options.completedRowId)
        ?? [...completedEvaluationRows]
          .filter((row) => row.activityId === recordId && row.studentId === studentId)
          .sort((left, right) => (Number(right.attemptNumber) || 0) - (Number(left.attemptNumber) || 0))[0]
      : null
    const nextAttemptStudentIds = linkedApprovalRow?.nextAttemptStudentIds
      ?? record.nextAttemptStudentIds
      ?? record.approvalRecord?.nextAttemptStudentIds
      ?? []
    const nextAttemptNumber = linkedApprovalRow?.nextAttemptNumber
      ?? record.nextAttemptNumber
      ?? record.approvalRecord?.nextAttemptNumber
      ?? null
    const nextAttemptStatus = linkedApprovalRow?.nextAttemptStatus
      ?? record.nextAttemptStatus
      ?? record.approvalRecord?.nextAttemptStatus
      ?? ''
    const nextAttemptStudents = nextAttemptStudentIds.map((studentKey) => {
      const matchedCompletedRow = [...completedEvaluationRows]
        .filter((row) => (
          String(row.activityId ?? '') === String(recordId)
          && (
            String(row.studentId ?? '') === String(studentKey)
            || String(row.registerId ?? '') === String(studentKey)
          )
        ))
        .sort((left, right) => (Number(right.attemptNumber) || 0) - (Number(left.attemptNumber) || 0))[0]

      return matchedCompletedRow
        ? {
            id: matchedCompletedRow.studentId ?? studentKey,
            name: matchedCompletedRow.studentName ?? 'Student',
            registerId: matchedCompletedRow.registerId ?? String(studentKey),
          }
        : null
    }).filter(Boolean)

    const nextEvaluationRecord = {
      ...record,
      id: recordId,
      assignment: linkedAssignment ?? record.assignment ?? record ?? null,
      approvalRecord: linkedApprovalRow ?? record.approvalRecord ?? null,
      latestSubmission: linkedSubmission,
      nextAttemptStudentIds,
      nextAttemptStudents,
      nextAttemptNumber,
      nextAttemptStatus,
      editingStudentDraft: linkedCompletedRow?.evaluationDraft ?? null,
      editingDecisionId: linkedCompletedRow?.decisionId ?? '',
      editingAttemptNumber: linkedCompletedRow?.attemptNumber ?? null,
      editingCompletedRowId: linkedCompletedRow?.id ?? '',
    }

    setSelectedEvaluationStudentId(studentId)
    setSelectedEvaluationRecord(nextEvaluationRecord)
    storeStartEvaluationRecord(nextEvaluationRecord)
    navigateToPage(APP_PAGES.START_EVALUATION)
  }

  const handleOpenExamLog = (context) => {
    if (!context) return
    setSelectedExamLogContext(context)
    navigateToPage(APP_PAGES.EXAM_LOG)
  }

  const handleSaveCompletedEvaluation = (row) => {
    if (!row?.activityId || !row?.studentId) return

    setCompletedEvaluationRows((current) => {
      const isEditingExistingCompletedRow = Boolean(row.id)
        && current.some((item) => item.id === row.id)

      if (isEditingExistingCompletedRow) {
        const attemptNumber = Number(row.attemptNumber) || Number(current.find((item) => item.id === row.id)?.attemptNumber) || 1
        const normalizedRow = {
          ...row,
          attemptNumber,
          attemptLabel: row.attemptLabel ?? `Attempt ${attemptNumber}`,
        }

        return [
          normalizedRow,
          ...current.filter((item) => item.id !== row.id),
        ]
      }

      const sameStudentRows = current.filter((item) => (
        item.activityId === row.activityId && item.studentId === row.studentId
      ))
      const isCompletedRow = String(row.rowStatus ?? '').trim().toLowerCase() === 'completed'
      const completedAttempts = sameStudentRows
        .filter((item) => String(item.rowStatus ?? '').trim().toLowerCase() === 'completed')
        .map((item) => Number(item.attemptNumber) || 1)
      const nextAttemptNumber = isCompletedRow
        ? Math.min(Math.max(0, ...completedAttempts) + 1, 10)
        : Number(row.attemptNumber) || Math.max(1, Math.max(0, ...completedAttempts) + 1)
      const compositeId = `${row.activityId}:${row.studentId}:attempt-${nextAttemptNumber}`
      const normalizedRow = {
        ...row,
        id: compositeId,
        attemptNumber: nextAttemptNumber,
        attemptLabel: `Attempt ${nextAttemptNumber}`,
      }

      return [
        normalizedRow,
        ...current.filter((item) => (
          item.id !== compositeId
          && !(isCompletedRow
            && item.activityId === row.activityId
            && item.studentId === row.studentId
            && String(item.rowStatus ?? '').trim().toLowerCase() === 'pending')
        )),
      ]
    })
  }

  const handleSendToApproval = (payload) => {
    if (!payload?.activityId) return
    const approvalTimestamp = new Date().toISOString()

    const approvalRow = {
      ...payload,
      id: `approval-${payload.activityId}`,
      senderName: profileUser.name,
      senderId: profileUser.registerId,
      senderDesignation: profileUser.designation ?? profileUser.role,
      sentAt: approvalTimestamp,
      receivedAt: approvalTimestamp,
    }

    setApprovalQueueRows((current) => [
      approvalRow,
      ...current.filter((item) => item.activityId !== payload.activityId),
    ])
    showAlert({ tone: 'secondary', message: `${payload.activityName ?? 'Activity'} sent to approval.` })
  }

  const handleOpenApprovalView = (record) => {
    if (!record) return
    setSelectedApprovalViewRecord(record)
    storeApprovalViewRecord(record)
    navigateToPage(APP_PAGES.APPROVAL_VIEW)
  }

  const handleApprovalReviewAction = (reviewedRecord) => {
    if (!reviewedRecord?.activityId) return

    const existingApprovalRow = approvalQueueRows.find((item) => item.activityId === reviewedRecord.activityId)
    const nextReviewedRecord = {
      ...(existingApprovalRow ?? {}),
      ...reviewedRecord,
      attemptCount: existingApprovalRow?.attemptCount ?? reviewedRecord.attemptCount,
      attemptNumber: existingApprovalRow?.attemptNumber ?? reviewedRecord.attemptNumber,
      attemptLabel: existingApprovalRow?.attemptLabel ?? reviewedRecord.attemptLabel,
    }

    setApprovalQueueRows((current) => current.map((item) => (
      item.activityId === reviewedRecord.activityId ? nextReviewedRecord : item
    )))
    setSelectedApprovalViewRecord(nextReviewedRecord)
    storeApprovalViewRecord(nextReviewedRecord)
    showAlert({
      tone: nextReviewedRecord.approvalStatus === 'Approved' ? 'secondary' : 'warning',
      message: `${nextReviewedRecord.activityName ?? 'Activity'} ${nextReviewedRecord.approvalStatus === 'Approved' ? 'approved' : 'rejected'}${nextReviewedRecord.reviewRemarks ? ' with remarks' : ''}.`,
    })
    navigateToPage(APP_PAGES.EVALUATION)
  }

  const handlePublishEvaluation = (record) => {
    const activityId = record?.id ?? record?.activityId
    if (!activityId) return

    const publishedAt = new Date().toISOString()
    const reattemptRows = getReattemptRows(activityId, completedEvaluationRows)
    const nextAttemptCount = reattemptRows.length
    const nextAttemptNumber = nextAttemptCount
      ? Math.max(
        1,
        ...getLatestActivityResultRows(activityId, completedEvaluationRows).map((row) => Number(row.attemptNumber) || 1),
      ) + 1
      : null
    const existingApprovalRow = approvalQueueRows.find((item) => item.activityId === activityId)
    const nextPublishedRecord = {
      ...(existingApprovalRow ?? {}),
      ...record,
      activityId,
      status: 'Published',
      approvalStatus: 'Published',
      reviewStatus: 'Published',
      publishedAt,
      nextAttemptCount,
      nextAttemptNumber,
      nextAttemptStudentIds: reattemptRows.map((row) => row.studentId ?? row.registerId).filter(Boolean),
      nextAttemptStatus: nextAttemptCount ? 'needs_schedule' : 'completed',
      scheduledAt: null,
      scheduledDate: '',
      scheduledTime: '',
    }

    setApprovalQueueRows((current) => current.map((item) => (
      item.activityId === activityId ? nextPublishedRecord : item
    )))

    if (nextAttemptCount && nextAttemptNumber) {
      setCompletedEvaluationRows((current) => current.filter((row) => !(
        String(row.activityId ?? '') === String(activityId)
        && (Number(row.attemptNumber) || 0) === nextAttemptNumber
      )))
    }

    setAssignedSkillActivities((current) => {
      const existingActivity = current.find((item) => item.id === activityId)
      const publishedActivity = {
        ...(existingActivity ?? {}),
        id: activityId,
        title: existingActivity?.title ?? record?.activityName ?? 'Untitled Activity',
        type: existingActivity?.type ?? record?.activityType ?? 'Activity',
        year: existingActivity?.year ?? record?.year ?? 'Not set',
        sgt: existingActivity?.sgt ?? record?.sgt ?? 'Not set',
        studentCount: existingActivity?.studentCount ?? record?.studentCount ?? 0,
        attemptCount: nextAttemptCount && nextAttemptNumber ? `${nextAttemptNumber} / ${nextAttemptNumber}` : (existingActivity?.attemptCount ?? record?.attemptCount ?? '1 / 1'),
        createdDate: existingActivity?.createdDate ?? record?.createdDate ?? new Date().toLocaleDateString('en-GB'),
        status: nextAttemptCount ? 'Assigned' : 'Completed',
        action: nextAttemptCount ? 'Yet to Start' : 'View Results',
        tone: nextAttemptCount ? 'secondary' : 'secondary',
        publishedAt,
        nextAttemptCount,
        nextAttemptNumber,
        nextAttemptStatus: nextAttemptCount ? 'needs_schedule' : 'completed',
        scheduledAt: null,
        scheduledDate: '',
        scheduledTime: '',
      }

      if (existingActivity) {
        return current.map((item) => (item.id === activityId ? publishedActivity : item))
      }

      return [publishedActivity, ...current]
    })

    setEvaluationRecords((current) => current.map((item) => (
      String(item.id ?? item.activityId) === String(activityId)
        ? {
            ...item,
            nextAttemptCount,
            nextAttemptNumber,
            nextAttemptStatus: nextAttemptCount ? 'needs_schedule' : 'completed',
            publishedAt,
            evaluationStatus: nextAttemptCount ? 'Completed Evaluation' : 'Completed Evaluation',
          }
        : item
    )))

    setSelectedApprovalViewRecord((current) => (
      current?.activityId === activityId ? nextPublishedRecord : current
    ))

    showAlert({
      tone: 'secondary',
      message: nextAttemptCount
        ? `${nextPublishedRecord.activityName ?? 'Activity'} published. Attempt ${nextAttemptNumber} is ready to schedule for ${nextAttemptCount} repeat/remedial students.`
        : `${nextPublishedRecord.activityName ?? 'Activity'} published successfully. View Results is now enabled in My Skill Activity.`,
    })
  }

  const handleSchedulePublishedAttempt = (record, schedule) => {
    const activityId = record?.id ?? record?.activityId
    if (!activityId) return

    const date = String(schedule?.date ?? '').trim()
    const time = String(schedule?.time ?? '').trim()
    if (!date || !time) return

    const scheduledAt = new Date(`${date}T${time}`).toISOString()

    setApprovalQueueRows((current) => current.map((item) => (
      String(item.activityId ?? '') === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'scheduled',
            scheduledDate: date,
            scheduledTime: time,
            scheduledAt,
          }
        : item
    )))

    setEvaluationRecords((current) => current.map((item) => (
      String(item.id ?? item.activityId) === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'scheduled',
            scheduledDate: date,
            scheduledTime: time,
            scheduledAt,
          }
        : item
    )))

    setAssignedSkillActivities((current) => current.map((item) => (
      String(item.id ?? '') === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'scheduled',
            scheduledDate: date,
            scheduledTime: time,
            scheduledAt,
            action: 'Yet to Start',
            tone: 'secondary',
            status: 'Assigned',
          }
        : item
    )))

    showAlert({
      tone: 'secondary',
      message: `${record?.activityName ?? 'Activity'} Attempt ${record?.nextAttemptNumber ?? 2} scheduled for ${date} ${time}.`,
    })
  }

  const handleClearPublishedAttemptSchedule = (record) => {
    const activityId = record?.id ?? record?.activityId
    if (!activityId) return

    setApprovalQueueRows((current) => current.map((item) => (
      String(item.activityId ?? '') === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'needs_schedule',
            scheduledDate: '',
            scheduledTime: '',
            scheduledAt: null,
          }
        : item
    )))

    setEvaluationRecords((current) => current.map((item) => (
      String(item.id ?? item.activityId) === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'needs_schedule',
            scheduledDate: '',
            scheduledTime: '',
            scheduledAt: null,
          }
        : item
    )))

    setAssignedSkillActivities((current) => current.map((item) => (
      String(item.id ?? '') === String(activityId)
        ? {
            ...item,
            nextAttemptStatus: 'needs_schedule',
            scheduledDate: '',
            scheduledTime: '',
            scheduledAt: null,
            action: 'Yet to Start',
            tone: 'secondary',
          }
        : item
    )))
  }

  const handleBackToEvaluationList = () => {
    setSelectedEvaluationRecord(null)
    setSelectedEvaluationStudentId('')
    navigateToPage(APP_PAGES.EVALUATION, { replace: true })
  }

  const handleResetExamActivity = (context) => {
    const activityId = context?.evaluationRecord?.id ?? context?.activityId
    if (!activityId) return

    setAssignedSkillActivities((current) => current.map((item) => (
      item.id === activityId
        ? {
            ...item,
            status: 'Assigned',
            action: 'Start Activity',
            tone: 'primary',
            attemptCount: '1 / 1',
            submittedAt: null,
            answers: null,
            proctoring: null,
          }
        : item
    )))

    setEvaluationRecords((current) => current.map((item) => (
      item.id === activityId
        ? {
            ...item,
            evaluationStatus: 'Pending Evaluation',
            attemptCount: '1 / 1',
          }
        : item
    )))

    setSelectedStudentExamAssignment((current) => (
      current?.id === activityId
        ? {
            ...current,
            status: 'Assigned',
            action: 'Start Activity',
            tone: 'primary',
            attemptCount: '1 / 1',
            submittedAt: null,
            answers: null,
            proctoring: null,
          }
        : current
    ))

    setExamMonitoringLogs((current) => current.filter((item) => item.activityId !== activityId))
    setCompletedEvaluationRows((current) => current.filter((item) => item.activityId !== activityId))

    setSelectedExamLogContext((current) => (
      current?.evaluationRecord?.id === activityId
        ? {
            ...current,
            student: current.student
              ? {
                  ...current.student,
                  evaluationStatus: 'Pending',
                  submission: current.student.submission
                    ? {
                        ...current.student.submission,
                        submittedAt: null,
                      }
                    : current.student.submission,
                }
              : current.student,
            obtainedMarks: 0,
          }
        : current
    ))

    showAlert({
      tone: 'secondary',
      message: 'Activity reset successfully. Returning to Start Evaluation.',
      duration: 3600,
    })
  }

  return (
    <div className={`vx-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${theme === 'dark' ? 'theme-dark' : ''} ${isExamMode ? 'is-exam-mode' : ''}`}>
      {!isExamMode ? (
        <div
          className={`vx-overlay ${mobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {!isExamMode ? (
        <Sidebar
          mobileSidebarOpen={mobileSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          theme={theme}
          useCompactLogo={useCompactLogo}
          activePage={activePage}
          onSelectPage={navigateToPage}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <main className={`vx-main ${isExamMode ? 'is-exam-main' : ''}`}>
        {alerts.length ? (
          <div className="vx-alert-stack">
            {alerts.map((alert) => (
              <AppAlert key={alert.id} alert={alert} />
            ))}
          </div>
        ) : null}

        {!isExamMode ? (
          <Navbar
            sidebarCollapsed={sidebarCollapsed}
            onOpenSidebar={() => setMobileSidebarOpen(true)}
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onOpenNotifications={() => showAlert({ tone: 'primary', message: 'No new notifications right now.' })}
            theme={theme}
            onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
            isProfileMenuOpen={isProfileMenuOpen}
            onToggleProfileMenu={() => setIsProfileMenuOpen((open) => !open)}
            profileUser={profileUser}
            onEditProfile={handleEditProfile}
            onSignOut={handleSignOut}
            profileToast={profileToast}
          />
        ) : null}

        <div key={activePage} className={`vx-page-surface vx-page-dissolve ${isExamMode ? 'is-exam-surface' : ''}`}>
          {activePage === APP_PAGES.DASHBOARD ? (
            <DashboardSummaryPage
              onBackToAssessment={() => navigateToPage(APP_PAGES.EVALUATION)}
              assignedActivities={assignedSkillActivities}
              evaluationRecords={evaluationRecords}
              completedEvaluationRows={completedEvaluationRows}
            />
          ) : activePage === APP_PAGES.CONFIGURATION ? (
            <SkillManagementPage
              onGenerateComplete={navigateToPage}
              onAlert={showAlert}
              savedImageActivities={savedImageActivities}
              onOpenOspeActivity={(activity) => {
                setSelectedOspeActivity(activity)
                navigateToPage(APP_PAGES.OSPE_ACTIVITY)
              }}
              onOpenImageActivity={(activity) => {
                setSelectedImageActivity(activity)
                navigateToPage(APP_PAGES.IMAGE_ACTIVITY)
                showAlert({ tone: 'primary', message: 'Image activity workspace opened.' })
              }}
              onOpenInterpretationActivity={(activity) => {
                setSelectedInterpretationActivity(activity)
                navigateToPage(APP_PAGES.INTERPRETATION_ACTIVITY)
                showAlert({ tone: 'primary', message: 'Interpretation activity workspace opened.' })
              }}
            />
          ) : activePage === APP_PAGES.EVALUATION ? (
            <SkillAssessmentPage
              onOpenDashboardSummary={() => navigateToPage(APP_PAGES.DASHBOARD_SUMMARY)}
              onAlert={showAlert}
              evaluationRecords={evaluationRecords}
              completedEvaluationRows={completedEvaluationRows}
              approvalQueueRows={approvalQueueRows}
              onStartEvaluation={handleOpenStartEvaluation}
              onOpenActivityResult={handleOpenActivityResult}
              onPublishEvaluation={handlePublishEvaluation}
              onScheduleAttempt={handleSchedulePublishedAttempt}
              onClearAttemptSchedule={handleClearPublishedAttemptSchedule}
            />
          ) : activePage === APP_PAGES.COMPLETED_EVALUATION ? (
            <CompletedEvaluationPage
              completedEvaluationRows={completedEvaluationRows}
              activityId={selectedCompletedEvaluationActivityId}
              activityRecord={evaluationRecords.find((record) => idsMatch(record.id, selectedCompletedEvaluationActivityId)) ?? selectedEvaluationRecord}
              onBackToEvaluation={() => navigateToPage(APP_PAGES.START_EVALUATION, { replace: true })}
              onOpenEvaluation={handleOpenStartEvaluation}
              onSendToApproval={handleSendToApproval}
            />
          ) : activePage === APP_PAGES.REVIEW_APPROVE ? (
            <ReviewApprovePage
              approvalQueueRows={approvalQueueRows}
              completedEvaluationRows={completedEvaluationRows}
              onAlert={showAlert}
              onViewApproval={handleOpenApprovalView}
            />
          ) : activePage === APP_PAGES.APPROVAL_VIEW ? (
            <ApprovalViewPage
              approvalRecord={selectedApprovalViewRecord ?? readStoredApprovalViewRecord()}
              completedEvaluationRows={completedEvaluationRows}
              onBack={() => navigateToPage(APP_PAGES.REVIEW_APPROVE)}
              onAlert={showAlert}
              onApprovalAction={handleApprovalReviewAction}
            />
          ) : activePage === APP_PAGES.START_EVALUATION ? (
            activeEvaluationRecord ? (
              <StartEvaluationPage
                evaluationRecord={activeEvaluationRecord}
                initialSelectedStudentId={selectedEvaluationStudentId}
                completedEvaluationRows={completedEvaluationRows}
                approvalQueueRows={approvalQueueRows}
                onBackToEvaluation={handleBackToEvaluationList}
                onOpenCompletedEvaluation={(record) => {
                  setSelectedCompletedEvaluationActivityId(record?.id ?? activeEvaluationRecord?.id ?? null)
                  navigateToPage(APP_PAGES.COMPLETED_EVALUATION)
                }}
                onOpenExamLog={handleOpenExamLog}
                onSaveCompletedEvaluation={handleSaveCompletedEvaluation}
                onSendToApproval={handleSendToApproval}
                onAlert={showAlert}
              />
            ) : (
              <section className="vx-content forms-page start-evaluation-page">
                <div className="start-eval-shell">
                  <section className="start-eval-empty-state">
                    <strong>No evaluation selected</strong>
                    <p>Open an activity from the evaluation list to start or review evaluations.</p>
                    <button type="button" className="tool-btn green" onClick={handleBackToEvaluationList}>
                      Back to Evaluation
                    </button>
                  </section>
                </div>
              </section>
            )
          ) : activePage === APP_PAGES.EXAM_LOG ? (
            <ExamLogPage
              examLogContext={selectedExamLogContext}
              examMonitoringLogs={examMonitoringLogs}
              onBackToEvaluation={() => navigateToPage(APP_PAGES.START_EVALUATION)}
              onResetActivity={handleResetExamActivity}
            />
          ) : activePage === APP_PAGES.OSPE_ACTIVITY ? (
            <OspeActivityPage
              key={`${selectedOspeActivity?.activity?.id ?? selectedOspeActivity?.id ?? 'ospe-activity'}-${selectedOspeActivity?.generatedModes?.join('-') ?? 'checklist'}`}
              activityData={selectedOspeActivity}
              onAlert={showAlert}
              onAssignActivity={handleAssignSkillActivity}
            />
          ) : activePage === APP_PAGES.IMAGE_ACTIVITY ? (
            <ImageActivityPage
              key={selectedImageActivity?.activity?.id ?? selectedImageActivity?.id ?? 'image-activity'}
              activityData={selectedImageActivity}
              onAlert={showAlert}
              onAssignActivity={handleAssignSkillActivity}
              onSaveSkillActivity={(savedActivity) => {
                if (!savedActivity?.activity?.id) return
                setSavedImageActivities((current) => ({
                  ...current,
                  [savedActivity.activity.id]: savedActivity,
                }))
                setSelectedImageActivity(savedActivity)
              }}
            />
          ) : activePage === APP_PAGES.INTERPRETATION_ACTIVITY ? (
            <InterpretationActivityPage
              key={selectedInterpretationActivity?.activity?.id ?? selectedInterpretationActivity?.id ?? 'interpretation-activity'}
              activityData={selectedInterpretationActivity}
              onAlert={showAlert}
              onAssignActivity={handleAssignSkillActivity}
              onSaveSkillActivity={(savedActivity) => {
                setSelectedInterpretationActivity(savedActivity)
              }}
            />
          ) : activePage === APP_PAGES.MY_SKILL_ACTIVITY ? (
            <MySkillActivityPage assignedActivities={assignedSkillActivities} onStartActivity={handleStartAssignedSkillActivity} />
          ) : activePage === APP_PAGES.ACTIVITY_RESULT ? (
            <ActivityResultPage
              resultRecord={selectedActivityResultRecord ?? readStoredActivityResultRecord()}
              completedEvaluationRows={completedEvaluationRows}
              onBack={() => navigateToPage(APP_PAGES.EVALUATION)}
            />
          ) : activePage === APP_PAGES.STUDENT_EXAM ? (
            <StudentExamPage
              assignment={selectedStudentExamAssignment}
              onBackToActivities={() => navigateToPage(APP_PAGES.MY_SKILL_ACTIVITY)}
              onSubmitExam={handleSubmitStudentExam}
              onAlert={showAlert}
              onRecordExamLog={handleRecordExamLog}
            />
          ) : activePage === APP_PAGES.PROGRESS_TRACKING ? (
            <ProgressTrackingPage
              resultRecord={selectedProgressResultRecord ?? readStoredProgressResultRecord()}
              completedEvaluationRows={completedEvaluationRows}
              onBackToActivities={() => navigateToPage(APP_PAGES.MY_SKILL_ACTIVITY)}
            />
          ) : activePage === APP_PAGES.FACULTY_MANAGEMENT ? (
            <FacultyManagementPageV2 onAlert={showAlert} />
          ) : activePage === APP_PAGES.STUDENT_MANAGEMENT ? (
            <StudentManagementPage onAlert={showAlert} />
          ) : activePage === APP_PAGES.DASHBOARD_SUMMARY ? (
            <DashboardSummaryPage
              dashboardData={selectedDashboardData}
              onBackToAssessment={() => navigateToPage(APP_PAGES.EVALUATION)}
              assignedActivities={assignedSkillActivities}
              evaluationRecords={evaluationRecords}
              completedEvaluationRows={completedEvaluationRows}
            />
          ) : activePage === APP_PAGES.PROFILE_SETTINGS ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Profile settings</span>
                <h1>{profileUser.name}</h1>
                <p>{profileUser.registerId} • {profileUser.role}</p>
                <div className="profile-settings-actions">
                  <button type="button" className="tool-btn green" onClick={() => navigateToPage(APP_PAGES.DASHBOARD_SUMMARY)}>Back to Dashboard</button>
                  <button type="button" className="ghost" onClick={() => navigateToPage(APP_PAGES.CONFIGURATION)}>Close</button>
                </div>
              </div>
            </section>
          ) : activePage === APP_PAGES.LOGIN ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Signed out</span>
                <h1>Logging out...</h1>
                <p>You have been redirected to the login experience.</p>
                <button type="button" className="tool-btn green" onClick={() => navigateToPage(APP_PAGES.CONFIGURATION)}>Return to app</button>
              </div>
            </section>
          ) : (
            <section className="vx-content">
              <div className="vx-breadcrumb">Apps / Tables / Default Tables</div>
              <div className="vx-title-row">
                <div>
                  <h1>Tables</h1>
                  <p>A collection of table styles similar to Valex bootstrap template.</p>
                </div>
                <div className="vx-title-actions">
                  <button type="button">Export</button>
                  <button type="button">Add New</button>
                </div>
              </div>

              <div className="vx-grid">
                <TableCard title="Basic Table" helper="Using simple default table styles." />
                <TableCard title="Bordered Table" helper="Use borders around rows and columns." className="is-bordered" />
                <TableCard title="Borderless Table" helper="Remove borders to create cleaner table." className="is-borderless" />
                <TableCard title="Striped Rows" helper="Alternating row backgrounds for readability." className="is-striped" />
                <TableCard title="Hoverable Rows" helper="Rows are highlighted on hover." className="is-hover" />
                <TableCard
                  title="Contextual Table"
                  helper="Context colors for different row types."
                  className="is-context"
                  rows={[
                    ['1', 'Primary', 'Row', '@primary'],
                    ['2', 'Success', 'Row', '@success'],
                    ['3', 'Warning', 'Row', '@warning'],
                  ]}
                />
              </div>
            </section>
          )}
        </div>

      </main>

      {!isExamMode ? (
        <nav className="vx-mobile-nav">
          <button type="button" onClick={() => setMobileSidebarOpen(true)}>Menu</button>
          <button
            type="button"
            className={activePage === APP_PAGES.DASHBOARD ? 'active' : ''}
            onClick={() => navigateToPage(APP_PAGES.DASHBOARD)}
          >
            {APP_PAGES.DASHBOARD}
          </button>
          <button
            type="button"
            className={activePage === APP_PAGES.PROFILE_SETTINGS ? 'active' : ''}
            onClick={handleEditProfile}
          >
            Profile
          </button>
        </nav>
      ) : null}
    </div>
  )
}

export default App


