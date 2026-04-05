import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import brandLogo from '../assets/brand-logo.svg'
import brandLogoDark from '../assets/brand-logo-dark.svg'
import brandMark from '../assets/brand-mark.svg'
import { MY_SKILL_PAGES, SIDEBAR_MENU, SKILL_PAGES } from '../config/appPages'

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
  const resolvedBrandLogo = theme === 'dark' ? brandLogoDark : brandLogo
  const activeGroupMap = {
    Skills: SKILL_PAGES.includes(activePage),
    'My Skills': MY_SKILL_PAGES.includes(activePage),
  }
  const [openGroups, setOpenGroups] = useState(activeGroupMap)
  const groupRefs = useRef({})
  const useCollapsedFlyout = sidebarCollapsed && !mobileSidebarOpen
  const handleSelectSidebarPage = (page) => {
    setOpenGroups((current) => ({
      ...current,
      Skills: SKILL_PAGES.includes(page),
      'My Skills': MY_SKILL_PAGES.includes(page),
    }))
    onSelectPage(page)
  }

  useEffect(() => {
    setOpenGroups((current) => ({
      ...current,
      ...activeGroupMap,
    }))
  }, [activePage])

  useEffect(() => {
    const openLabels = Object.entries(openGroups).filter(([, isOpen]) => isOpen).map(([label]) => label)
    if (!useCollapsedFlyout || !openLabels.length) return undefined

    const handlePointerDown = (event) => {
      const clickedInsideOpenGroup = openLabels.some((label) => groupRefs.current[label]?.contains(event.target))
      if (!clickedInsideOpenGroup) {
        setOpenGroups((current) => Object.fromEntries(Object.keys(current).map((label) => [label, false])))
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openGroups, useCollapsedFlyout])

  return (
    <aside className={`vx-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
      <div className="vx-sidebar-scroll">
        <div className="vx-logo-row">
          <img
            src={resolvedBrandLogo}
            alt="Brand logo"
            className={`vx-logo-image vx-logo-full ${useCompactLogo ? 'hide-logo' : ''}`}
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
                  ref={(node) => { groupRefs.current[item.label] = node }}
                  className={`vx-link-group ${activeGroupMap[item.label] ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className={`vx-link vx-link-parent ${activeGroupMap[item.label] ? 'active' : ''}`}
                    onClick={() => setOpenGroups((current) => ({ ...current, [item.label]: !current[item.label] }))}
                    aria-expanded={Boolean(openGroups[item.label])}
                  >
                    <span className="vx-link-icon" aria-hidden="true">
                      <item.icon size={16} strokeWidth={2} />
                    </span>
                    <span className="vx-link-text">{item.label}</span>
                    <span className={`vx-link-caret ${openGroups[item.label] ? 'open' : ''}`} aria-hidden="true">
                      <ChevronDown size={16} strokeWidth={2.2} />
                    </span>
                  </button>

                  <div className={`vx-sublinks ${openGroups[item.label] ? 'open' : ''} ${useCollapsedFlyout ? 'is-flyout' : ''}`}>
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
