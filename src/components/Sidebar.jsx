import { useState } from 'react'
import { ChevronDown, ClipboardList, FileImage, FileText, FolderKanban, LayoutDashboard, UserPen, X } from 'lucide-react'
import brandLogo from '../assets/brand-logo.svg'
import brandMark from '../assets/brand-mark.svg'

const menu = [
  {
    section: 'Main',
    items: [
      {
        label: 'Skills',
        icon: FileText,
        children: [
          { label: 'Configuration', icon: FolderKanban },
          { label: 'Evaluation', icon: ClipboardList },
          { label: 'Dashboard', icon: LayoutDashboard },
          { label: 'Image Activity', icon: FileImage },
        ],
      },
      { label: 'Faculty Management', icon: UserPen },
    ],
  },
]

export default function Sidebar({
  mobileSidebarOpen,
  sidebarCollapsed,
  theme,
  useCompactLogo,
  activePage,
  onSelectPage,
  onCloseMobile,
}) {
  const isSkillsActive = ['Dashboard', 'Configuration', 'Evaluation', 'Image Activity'].includes(activePage)
  const [skillsOpen, setSkillsOpen] = useState(true)
  const showSkillsChildren = sidebarCollapsed ? skillsOpen : (skillsOpen || isSkillsActive)

  return (
    <aside className={`vx-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="vx-sidebar-scroll">
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
              item.children ? (
                <div key={item.label} className={`vx-link-group ${isSkillsActive ? 'active' : ''}`}>
                  <button
                    type="button"
                    className={`vx-link vx-link-parent ${isSkillsActive ? 'active' : ''}`}
                    onClick={() => setSkillsOpen((open) => !open)}
                    aria-expanded={showSkillsChildren}
                  >
                    <span className="vx-link-icon" aria-hidden="true">
                      <item.icon size={16} strokeWidth={2} />
                    </span>
                    <span className="vx-link-text">{item.label}</span>
                    <span className={`vx-link-caret ${showSkillsChildren ? 'open' : ''}`} aria-hidden="true">
                      <ChevronDown size={16} strokeWidth={2.2} />
                    </span>
                  </button>

                  <div className={`vx-sublinks ${showSkillsChildren ? 'open' : ''} ${sidebarCollapsed ? 'is-flyout' : ''}`}>
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        className={`vx-sublink ${child.label === activePage ? 'active' : ''}`}
                        onClick={() => onSelectPage(child.label)}
                      >
                        <span className="vx-sublink-icon" aria-hidden="true">
                          <child.icon size={14} strokeWidth={2} />
                        </span>
                        <span className={sidebarCollapsed ? 'vx-sublink-text' : 'vx-link-text'}>{child.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
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
              )
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
