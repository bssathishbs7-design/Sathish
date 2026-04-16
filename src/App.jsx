import { useEffect, useState } from 'react'
import './App.css'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SkillManagementPage from './pages/SkillManagementPage'
import SkillAssessmentPage from './pages/SkillAssessmentPage'
import CompletedEvaluationPage from './pages/CompletedEvaluationPage'
import DashboardSummaryPage from './pages/DashboardSummaryPage'
import StartEvaluationPage from './pages/StartEvaluationPage'
import ExamLogPage from './pages/ExamLogPage'
import MySkillActivityPage from './pages/MySkillActivityPage'
import ProgressTrackingPage from './pages/ProgressTrackingPage'
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
  [APP_PAGES.COMPLETED_EVALUATION]: '/skills/completed-evaluation',
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
    activityName: assignment.title ?? 'Untitled Activity',
    activityType: assignment.type ?? 'Activity',
    studentCount: assignment.studentCount ?? estimateStudentCount(year, sgt),
    year,
    sgt,
    attemptCount: assignment.attemptCount ?? '0 / 1',
    createdDate: assignment.createdDate ?? new Date().toLocaleDateString('en-GB'),
    evaluationStatus: assignment.evaluationStatus ?? 'Pending Evaluation',
    questionCount: assignment.questionCount ?? getAssignmentQuestionCount(assignment),
    certifiable: isAssignmentCertifiable(assignment),
    thresholds: assignment.thresholds ?? assignment.examData?.thresholds ?? [],
    examData: assignment.examData ?? null,
    activityData: assignment.activityData ?? null,
  }
}

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
  const [assignedSkillActivities, setAssignedSkillActivities] = useState([])
  const [evaluationRecords, setEvaluationRecords] = useState([])
  const [examMonitoringLogs, setExamMonitoringLogs] = useState([])
  const [selectedStudentExamAssignment, setSelectedStudentExamAssignment] = useState(null)
  const [selectedEvaluationRecord, setSelectedEvaluationRecord] = useState(null)
  const [selectedEvaluationStudentId, setSelectedEvaluationStudentId] = useState('')
  const [selectedCompletedEvaluationActivityId, setSelectedCompletedEvaluationActivityId] = useState(null)
  const [completedEvaluationRows, setCompletedEvaluationRows] = useState([])
  const [selectedExamLogContext, setSelectedExamLogContext] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
  const [alerts, setAlerts] = useState([])
  const isExamMode = activePage === APP_PAGES.STUDENT_EXAM
  const profileUser = {
    name: 'Karthik Subramanian',
    registerId: 'MC2568',
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
    const normalizedAssignment = {
      ...assignment,
      year,
      sgt,
      studentCount: assignment.studentCount ?? estimateStudentCount(year, sgt),
    }

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
    setSelectedStudentExamAssignment(assignment)
    navigateToPage(APP_PAGES.STUDENT_EXAM)
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
    const linkedSubmission = linkedAssignment?.answers ? linkedAssignment : null
    const linkedCompletedRow = studentId
      ? completedEvaluationRows.find((row) => row.activityId === recordId && row.studentId === studentId)
      : null

    setSelectedEvaluationStudentId(studentId)
    setSelectedEvaluationRecord({
      ...record,
      id: recordId,
      assignment: linkedAssignment ?? record.assignment ?? record ?? null,
      latestSubmission: linkedSubmission,
      editingStudentDraft: linkedCompletedRow?.evaluationDraft ?? null,
      editingDecisionId: linkedCompletedRow?.decisionId ?? '',
    })
    navigateToPage(APP_PAGES.START_EVALUATION)
  }

  const handleOpenExamLog = (context) => {
    if (!context) return
    setSelectedExamLogContext(context)
    navigateToPage(APP_PAGES.EXAM_LOG)
  }

  const handleSaveCompletedEvaluation = (row) => {
    if (!row?.activityId || !row?.studentId) return

    const compositeId = `${row.activityId}:${row.studentId}`
    setCompletedEvaluationRows((current) => [
      { ...row, id: compositeId },
      ...current.filter((item) => item.id !== compositeId),
    ])
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
            attemptCount: '0 / 1',
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
            attemptCount: '0 / 1',
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
            attemptCount: '0 / 1',
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
              onStartEvaluation={handleOpenStartEvaluation}
            />
          ) : activePage === APP_PAGES.COMPLETED_EVALUATION ? (
            <CompletedEvaluationPage
              completedEvaluationRows={completedEvaluationRows}
              activityId={selectedCompletedEvaluationActivityId}
              activityRecord={evaluationRecords.find((record) => record.id === selectedCompletedEvaluationActivityId) ?? selectedEvaluationRecord}
              onBackToEvaluation={() => navigateToPage(APP_PAGES.START_EVALUATION, { replace: true })}
              onOpenEvaluation={handleOpenStartEvaluation}
            />
          ) : activePage === APP_PAGES.START_EVALUATION ? (
            <StartEvaluationPage
              evaluationRecord={selectedEvaluationRecord}
              initialSelectedStudentId={selectedEvaluationStudentId}
              completedEvaluationRows={completedEvaluationRows}
              onBackToEvaluation={handleBackToEvaluationList}
              onOpenCompletedEvaluation={(record) => {
                setSelectedCompletedEvaluationActivityId(record?.id ?? selectedEvaluationRecord?.id ?? null)
                navigateToPage(APP_PAGES.COMPLETED_EVALUATION)
              }}
              onOpenExamLog={handleOpenExamLog}
              onSaveCompletedEvaluation={handleSaveCompletedEvaluation}
              onAlert={showAlert}
            />
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
          ) : activePage === APP_PAGES.STUDENT_EXAM ? (
            <StudentExamPage
              assignment={selectedStudentExamAssignment}
              onBackToActivities={() => navigateToPage(APP_PAGES.MY_SKILL_ACTIVITY)}
              onSubmitExam={handleSubmitStudentExam}
              onAlert={showAlert}
              onRecordExamLog={handleRecordExamLog}
            />
          ) : activePage === APP_PAGES.PROGRESS_TRACKING ? (
            <ProgressTrackingPage />
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


