import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import SkillManagementPage from './pages/SkillManagementPage'
import SkillAssessmentPage from './pages/SkillAssessmentPage'
import DashboardSummaryPage from './pages/DashboardSummaryPage'
import FacultyManagementPageV2 from './pages/FacultyManagementPageV2'
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

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const useCompactLogo = theme === 'light' && sidebarCollapsed
  const [activePage, setActivePage] = useState('Dashboard')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [profileToast, setProfileToast] = useState('')
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const handleEditProfile = () => {
    setIsProfileMenuOpen(false)
    setActivePage('Profile Settings')
    window.history.pushState({}, '', '/profile/settings')
  }

  const handleSignOut = () => {
    setIsProfileMenuOpen(false)
    setProfileToast('Logging out...')
    setActivePage('Login')
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
        }}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="vx-main">
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
          {activePage === 'Dashboard' ? (
            <DashboardSummaryPage onBackToAssessment={() => setActivePage('Evaluation')} />
          ) : activePage === 'Configuration' ? (
            <SkillManagementPage onGenerateComplete={(page) => setActivePage(page)} />
          ) : activePage === 'Evaluation' ? (
            <SkillAssessmentPage onOpenDashboardSummary={() => setActivePage('Dashboard Summary')} />
          ) : activePage === 'Faculty Management' ? (
            <FacultyManagementPageV2 />
          ) : activePage === 'Dashboard Summary' ? (
            <DashboardSummaryPage onBackToAssessment={() => setActivePage('Evaluation')} />
          ) : activePage === 'Profile Settings' ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Profile settings</span>
                <h1>{profileUser.name}</h1>
                <p>{profileUser.registerId} • {profileUser.role}</p>
                <div className="profile-settings-actions">
                  <button type="button" className="tool-btn green" onClick={() => setActivePage('Dashboard Summary')}>Back to Dashboard</button>
                  <button type="button" className="ghost" onClick={() => setActivePage('Configuration')}>Close</button>
                </div>
              </div>
            </section>
          ) : activePage === 'Login' ? (
            <section className="vx-content profile-settings-page">
              <div className="profile-settings-card">
                <span className="profile-settings-kicker">Signed out</span>
                <h1>Logging out...</h1>
                <p>You have been redirected to the login experience.</p>
                <button type="button" className="tool-btn green" onClick={() => setActivePage('Configuration')}>Return to app</button>
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
          className={activePage === 'Dashboard' ? 'active' : ''}
          onClick={() => setActivePage('Dashboard')}
        >
          Dashboard
        </button>
        <button type="button">Profile</button>
      </nav>
    </div>
  )
}

export default App


