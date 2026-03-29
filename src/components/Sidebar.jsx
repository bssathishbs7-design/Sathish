import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import brandLogo from '../assets/brand-logo.svg'
import brandMark from '../assets/brand-mark.svg'
import { SIDEBAR_MENU, SKILL_PAGES } from '../config/appPages'

/**
 * Sidebar Implementation Contract
 * Structure:
 * - Shared navigation rail with one nested "Skills" group and top-level destinations.
 * Dependencies:
 * - Brand assets, lucide-react icons, and shared page metadata from src/config/appPages.js
 * Props / Data:
 * - Receives active page and shell callbacks from App.jsx
 * State:
 * - Local UI state only for skills group expansion
 * Hooks / Providers:
 * - No context provider required; app-level navigation remains prop-driven
 * Responsive behavior:
 * - Desktop supports collapse/flyout behavior
 * - Mobile supports slide-in drawer behavior with explicit close control
 * Placement:
 * - Shared shell component in src/components/
 */
export default function Sidebar({
  mobileSidebarOpen,
  sidebarCollapsed,
  theme,
  useCompactLogo,
  activePage,
  onSelectPage,
  onCloseMobile,
}) {
  const isSkillsActive = SKILL_PAGES.includes(activePage)
  const [skillsOpen, setSkillsOpen] = useState(isSkillsActive)
  const skillsGroupRef = useRef(null)
  const showSkillsChildren = skillsOpen
  const useCollapsedFlyout = sidebarCollapsed && !mobileSidebarOpen
  const handleSelectSidebarPage = (page) => {
    setSkillsOpen(SKILL_PAGES.includes(page))
    onSelectPage(page)
  }

  useEffect(() => {
    if (!useCollapsedFlyout || !skillsOpen) return undefined

    const handlePointerDown = (event) => {
      if (!skillsGroupRef.current?.contains(event.target)) {
        setSkillsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [skillsOpen, useCollapsedFlyout])

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

        {SIDEBAR_MENU.map((group) => (
          <div key={group.section} className="vx-menu-group">
            {group.items.map((item) => (
              item.children ? (
                <div
                  key={item.label}
                  ref={skillsGroupRef}
                  className={`vx-link-group ${isSkillsActive ? 'active' : ''}`}
                >
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

                  <div className={`vx-sublinks ${showSkillsChildren ? 'open' : ''} ${useCollapsedFlyout ? 'is-flyout' : ''}`}>
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        className={`vx-sublink ${child.label === activePage ? 'active' : ''}`}
                        onClick={() => handleSelectSidebarPage(child.label)}
                      >
                        <span className="vx-sublink-icon" aria-hidden="true">
                          <child.icon size={14} strokeWidth={2} />
                        </span>
                        <span className={useCollapsedFlyout ? 'vx-sublink-text' : 'vx-link-text'}>{child.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={`vx-link ${item.label === activePage ? 'active' : ''}`}
                  onClick={() => handleSelectSidebarPage(item.label)}
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
