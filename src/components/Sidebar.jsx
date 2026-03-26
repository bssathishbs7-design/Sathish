import { FileText, LayoutDashboard, UserPen, X } from 'lucide-react'
import brandLogo from '../assets/brand-logo.svg'
import brandMark from '../assets/brand-mark.svg'

const menu = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Skill Management', icon: FileText },
      { label: 'Skill Assessment', icon: FileText },
      { label: 'Faculty Management', icon: UserPen },
    ],
  },
]

export default function Sidebar({
  mobileSidebarOpen,
  theme,
  useCompactLogo,
  activePage,
  onSelectPage,
  onCloseMobile,
}) {
  return (
    <aside className={`vx-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="vx-logo-row">
        <img
          src={brandLogo}
          alt="Brand logo"
          className={`vx-logo-image vx-logo-full ${theme === 'dark' ? 'is-white' : ''} ${useCompactLogo ? 'hide-logo' : ''}`}
        />
        <img
          src={brandMark}
          alt="Brand mark"
          className={`vx-logo-image vx-logo-mark ${theme === 'dark' ? 'is-white' : ''} ${useCompactLogo ? 'show-mark' : ''}`}
        />
        <button
          type="button"
          className="vx-icon-btn hide-desktop"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {menu.map((group) => (
        <div key={group.section} className="vx-menu-group">
          {group.items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`vx-link ${item.label === activePage ? 'active' : ''}`}
              onClick={() => onSelectPage(item.label)}
            >
              <span className="vx-link-icon" aria-hidden="true">
                <item.icon size={16} strokeWidth={2} />
              </span>
              <span className="vx-link-text">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </aside>
  )
}
