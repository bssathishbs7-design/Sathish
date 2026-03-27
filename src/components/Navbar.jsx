import {
  Bell,
  ChevronFirst,
  ChevronLast,
  ChevronRight,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Search,
  Sun,
  UserPen,
} from 'lucide-react'

/**
 * Navbar Implementation Contract
 * Structure:
 * - Shared shell header for search, theme, fullscreen, notifications, and profile actions.
 * Dependencies:
 * - lucide-react icons only
 * Props / Data:
 * - Receives shell actions and profile metadata from App.jsx
 * State:
 * - Stateless; all behavior is controlled through props
 * Hooks / Providers:
 * - None required here because state is intentionally lifted to the app shell
 * Responsive behavior:
 * - Mobile exposes the sidebar trigger
 * - Desktop exposes the collapse control and full action cluster
 * Placement:
 * - Shared top-level shell component in src/components/
 */
export default function Navbar({
  sidebarCollapsed,
  onOpenSidebar,
  onToggleSidebar,
  isFullscreen,
  onToggleFullscreen,
  theme,
  onToggleTheme,
  isProfileMenuOpen,
  onToggleProfileMenu,
  profileUser,
  onEditProfile,
  onSignOut,
  profileToast,
}) {
  return (
    <header className="vx-topbar">
      <button
        type="button"
        className="vx-icon-btn vx-menu-btn"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <button
        type="button"
        className="vx-icon-btn vx-collapse-btn desktop-only"
        onClick={onToggleSidebar}
        aria-label="Collapse sidebar"
      >
        {sidebarCollapsed ? <ChevronLast size={18} strokeWidth={2} /> : <ChevronFirst size={18} strokeWidth={2} />}
      </button>

      <div className="vx-global-search">
        <span className="vx-search-icon" aria-hidden="true">
          <Search size={16} strokeWidth={2} />
        </span>
        <span className="vx-search-placeholder">Search for anything...</span>
      </div>

      <div className="vx-actions">
        <button type="button" className="vx-icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2} />
        </button>
        <button type="button" className="vx-icon-btn" aria-label="Fullscreen" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize size={18} strokeWidth={2} /> : <Maximize size={18} strokeWidth={2} />}
        </button>
        <button type="button" className="vx-icon-btn" aria-label="Theme" onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>
        <div className="vx-profile-menu">
          <button
            type="button"
            className="vx-user vx-profile-trigger"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            onClick={onToggleProfileMenu}
          >
            <span className="avatar" aria-hidden="true">KS</span>
            <div>
              <strong>{profileUser.name}</strong>
              <p>{profileUser.registerId}</p>
            </div>
            <span className="vx-profile-caret" aria-hidden="true">
              <ChevronRight size={14} strokeWidth={2} />
            </span>
          </button>

          {isProfileMenuOpen ? (
            <div className="vx-profile-tooltip" role="menu" aria-label="Profile menu">
              <div className="vx-profile-tooltip-head">
                <span className="avatar vx-profile-avatar" aria-hidden="true">KS</span>
                <div>
                  <strong>{profileUser.name}</strong>
                  <p>{profileUser.registerId}</p>
                </div>
              </div> 
              <div className="vx-profile-divider" />
              <button type="button" className="vx-profile-action" onClick={onEditProfile}>
                <span className="vx-profile-action-icon" aria-hidden="true">
                  <UserPen size={16} strokeWidth={2} />
                </span>
                <span>
                  <strong>Edit Profile</strong>
                  <small>Open profile settings</small>
                </span>
              </button>
              <button type="button" className="vx-profile-action is-danger" onClick={onSignOut}>
                <span className="vx-profile-action-icon" aria-hidden="true">
                  <LogOut size={16} strokeWidth={2} />
                </span>
                <span>
                  <strong>Sign Out</strong>
                  <small>Leave the dashboard</small>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {profileToast ? <div className="vx-profile-toast" role="status">{profileToast}</div> : null}
    </header>
  )
}
