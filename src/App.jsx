import { useEffect, useState } from 'react'
import './App.css'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SkillManagementPage from './pages/SkillManagementPage'
import SkillAssessmentPage from './pages/SkillAssessmentPage'
import DashboardSummaryPage from './pages/DashboardSummaryPage'
import FacultyManagementPageV2 from './pages/FacultyManagementPageV2'
import ImageActivityPage from './pages/ImageActivityPage'
import { APP_PAGES } from './config/appPages'
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
  const [theme, setTheme] = useState('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const useCompactLogo = theme === 'light' && sidebarCollapsed
  const [activePage, setActivePage] = useState(APP_PAGES.DASHBOARD)
  const [selectedImageActivity, setSelectedImageActivity] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
  const [alerts, setAlerts] = useState([])
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

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false)
    setActivePage(APP_PAGES.PROFILE_SETTINGS)
    showAlert({ tone: 'primary', message: 'Profile settings opened.' })
    window.history.pushState({}, '', '/profile/settings')
  }

  const handleSignOut = () => {
    setIsProfileMenuOpen(false)
    setProfileToast('Logging out...')
    setActivePage(APP_PAGES.LOGIN)
    showAlert({ tone: 'warning', message: 'You have been signed out of the current session.' })
    window.history.pushState({}, '', '/login')
  }

  return (
    <div className={`vx-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div
        className={`vx-overlay ${mobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        mobileSidebarOpen={mobileSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        theme={theme}
        useCompactLogo={useCompactLogo}
        activePage={activePage}
        onSelectPage={(page) => {
          setActivePage(page)
          setMobileSidebarOpen(false)
          if (window.innerWidth >= 1024) {
            setSidebarCollapsed(true)
          }
        }}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="vx-main">
        {alerts.length ? (
          <div className="vx-alert-stack">
            {alerts.map((alert) => (
              <AppAlert key={alert.id} alert={alert} />
            ))}
          </div>
        ) : null}

        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          theme={theme}
          onToggleTheme={() => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))}
          isProfileMenuOpen={isProfileMenuOpen}
          onToggleProfileMenu={() => setIsProfileMenuOpen((open) => !open)}
          profileUser={profileUser}
          onEditProfile={handleEditProfile}
          onSignOut={handleSignOut}
          profileToast={profileToast}
        />

        <div key={activePage} className="vx-page-surface vx-page-dissolve">
          {activePage === APP_PAGES.DASHBOARD ? (
            <DashboardSummaryPage onBackToAssessment={() => setActivePage(APP_PAGES.EVALUATION)} />
          ) : activePage === APP_PAGES.CONFIGURATION ? (
            <SkillManagementPage
              onGenerateComplete={(page) => setActivePage(page)}
              onAlert={showAlert}
              onOpenImageActivity={(activity) => {
                setSelectedImageActivity(activity)
                setActivePage(APP_PAGES.IMAGE_ACTIVITY)
                showAlert({ tone: 'primary', message: 'Image activity workspace opened.' })
              }}
            />
          ) : activePage === APP_PAGES.EVALUATION ? (
            <SkillAssessmentPage
              onOpenDashboardSummary={() => setActivePage(APP_PAGES.DASHBOARD_SUMMARY)}
              onAlert={showAlert}
            />
          ) : activePage === APP_PAGES.IMAGE_ACTIVITY ? (
            <ImageActivityPage activityData={selectedImageActivity} onAlert={showAlert} />
          ) : activePage === APP_PAGES.FACULTY_MANAGEMENT ? (
            <FacultyManagementPageV2 onAlert={showAlert} />
          ) : activePage === APP_PAGES.DASHBOARD_SUMMARY ? (
            <DashboardSummaryPage onBackToAssessment={() => setActivePage(APP_PAGES.EVALUATION)} />
          ) : activePage === APP_PAGES.PROFILE_SETTINGS ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Profile settings</span>
                <h1>{profileUser.name}</h1>
                <p>{profileUser.registerId} • {profileUser.role}</p>
                <div className="profile-settings-actions">
                  <button type="button" className="tool-btn green" onClick={() => setActivePage(APP_PAGES.DASHBOARD_SUMMARY)}>Back to Dashboard</button>
                  <button type="button" className="ghost" onClick={() => setActivePage(APP_PAGES.CONFIGURATION)}>Close</button>
                </div>
              </div>
            </section>
          ) : activePage === APP_PAGES.LOGIN ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Signed out</span>
                <h1>Logging out...</h1>
                <p>You have been redirected to the login experience.</p>
                <button type="button" className="tool-btn green" onClick={() => setActivePage(APP_PAGES.CONFIGURATION)}>Return to app</button>
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

      <nav className="vx-mobile-nav">
        <button type="button" onClick={() => setMobileSidebarOpen(true)}>Menu</button>
        <button
          type="button"
          className={activePage === APP_PAGES.DASHBOARD ? 'active' : ''}
          onClick={() => setActivePage(APP_PAGES.DASHBOARD)}
        >
          {APP_PAGES.DASHBOARD}
        </button>
        <button type="button">Profile</button>
      </nav>
    </div>
  )
}

export default App


