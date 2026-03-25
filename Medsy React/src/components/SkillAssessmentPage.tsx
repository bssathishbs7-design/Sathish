import { useEffect, useState } from 'react'
import {
  Bell,
  Blocks,
  CalendarDays,
  ChevronFirst,
  ChevronLast,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Maximize,
  Menu,
  MessageCircle,
  Minimize,
  Moon,
  Search,
  Sun,
  Table2,
} from 'lucide-react'
// import brandLogo from '../assets/brand-logo.svg' // Will be handled after assets are moved
// import brandMark from '../assets/brand-mark.svg' // Will be handled after assets are moved
import { TableCard } from './TableCard'

const menu = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Widgets', icon: Blocks },
      { label: 'Tables', icon: Table2 },
      { label: 'Forms', icon: FileText },
    ],
  },
  {
    section: 'Apps',
    items: [
      { label: 'Mail', icon: Mail },
      { label: 'Chat', icon: MessageCircle },
      { label: 'Calendar', icon: CalendarDays },
      { label: 'File Manager', icon: FolderKanban },
    ],
  },
]

const skillRows = [
  { name: 'Checklist for diluting the given sample of blood for WBC count.', type: 'OSPE', status: 'Not Generated', action: 'Generate with Ai', tone: 'teal' },
  { name: 'Determine Blood group & RBC indices', type: 'OSCE', status: 'Not Generated', action: 'Generate with Ai', tone: 'teal' },
  { name: 'Perform Spirometry and interpret the findings (Digital / Manual)', type: 'Interpretation', status: 'Not Created', action: 'Create Manual', tone: 'purple' },
  { name: 'Describe principles and methods of artificial respiration', type: 'Image', status: 'Not Created', action: 'Create Manual', tone: 'purple' },
  { name: 'Checklist for diluting the given sample of blood for WBC count.', type: 'OSPE', status: 'Assigned', action: 'Preview', tone: 'light' },
  { name: 'Determine Blood group & RBC indices', type: 'OSCE', status: 'Generated', action: 'Preview', tone: 'light' },
]

export default function SkillAssessmentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [logoMode, setLogoMode] = useState('full')
  const isCollapsed = logoMode === 'mark'

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleFullscreen = () => setFullscreen(!fullscreen)
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  const toggleLogoMode = () => setLogoMode(logoMode === 'full' ? 'mark' : 'full')

  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen()
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }, [fullscreen])

  return (
    <div className={`vx-shell ${theme} ${sidebarOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className={`vx-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>

      <aside className={`vx-sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className="vx-logo-row">
          {logoMode === 'full' ? (
            // <img src={brandLogo} alt="Medsy" className="vx-logo-image vx-logo-full" />
            <span className="vx-logo">Medsy</span>
          ) : (
            // <img src={brandMark} alt="Medsy" className="vx-logo-image vx-logo-mark" />
            <span className="vx-logo">M</span>
          )}
          <button
            type="button"
            className="vx-sidebar-toggle"
            onClick={toggleLogoMode}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {logoMode === 'full' ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <div className="vx-search-mini">
          <Search />
          <input type="text" placeholder="Search..." />
        </div>

        <nav className="vx-menu">
          {menu.map((section, index) => (
            <div key={index} className="vx-menu-section">
              <h3>{section.section}</h3>
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} title={item.label}>
                    <item.icon />
                    <span className="vx-link-text">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="vx-sidebar-footer">
          <button onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon /> : <Sun />}
            <span className="vx-link-text">Theme</span>
          </button>
        </div>
      </aside>

      <main className="vx-main">
        <header className="vx-header">
          <button type="button" className="vx-menu-btn" onClick={toggleSidebar}>
            <Menu />
          </button>
          <div className="vx-header-actions">
            <button type="button" className="vx-action-btn">
              <Search />
            </button>
            <button type="button" className="vx-action-btn">
              <Bell />
            </button>
            <button type="button" className="vx-action-btn" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize /> : <Maximize />}
            </button>
            <div className="vx-user-menu">
              <img src="https://via.placeholder.com/32" alt="User" className="vx-user-avatar" />
            </div>
          </div>
        </header>

        <div className="vx-content">
          <section className="vx-card">
            <header className="vx-card-head">
              <div>
                <h3>Skill Assessment</h3>
                <p>Manage skill assessments and track student progress</p>
              </div>
              <button type="button" className="vx-dots" aria-label="More options">
                ...
              </button>
            </header>
            <div className="vx-table-wrap">
              <table className="vx-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {skillRows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.name}</td>
                      <td>{row.type}</td>
                      <td>
                        <span className={`vx-tag vx-tag-${row.tone}`}>{row.status}</span>
                      </td>
                      <td>
                        <button className="vx-btn vx-btn-primary">{row.action}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <TableCard title="Recent Activity" helper="Latest actions and events" className="mt-4" />
        </div>
      </main>
    </div>
  )
}
