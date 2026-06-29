import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import brandLogo from '../assets/brand-logo.svg'
import brandLogoDark from '../assets/brand-logo-dark.svg'
import brandMark from '../assets/brand-mark.svg'
import { APP_PAGES, ASSESSMENT_PAGES, ASSESSMENT_SUITE_PAGES, SIDEBAR_MENU, SKILL_PAGES } from '../config/appPages'

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
  queryRequestCount = 0,
  createdReportCount = 0,
  onSelectPage,
  onCloseMobile,
}) {
  const resolvedBrandLogo = theme === 'dark' ? brandLogoDark : brandLogo
  const activeGroupMap = {
    Skills: SKILL_PAGES.includes(activePage),
    Assessment: ASSESSMENT_PAGES.includes(activePage),
    'Assessment Suite': ASSESSMENT_SUITE_PAGES.includes(activePage),
  }
  const getActiveGroupLabel = (page) => {
    if (SKILL_PAGES.includes(page)) return 'Skills'
    if (ASSESSMENT_SUITE_PAGES.includes(page)) return 'Assessment Suite'
    if (ASSESSMENT_PAGES.includes(page)) return 'Assessment'
    return null
  }
  const [openGroupLabel, setOpenGroupLabel] = useState(() => getActiveGroupLabel(activePage))
  const groupRefs = useRef({})
  const useCollapsedFlyout = sidebarCollapsed && !mobileSidebarOpen
  const getNotificationCount = (page) => (
    page === APP_PAGES.QUERY_REQUEST
      ? queryRequestCount
      : page === APP_PAGES.QUESTION_BANK
        ? createdReportCount
        : 0
  )
  const formatNotificationCount = (count) => (count > 9 ? '9+' : String(count))
  const handleSelectSidebarPage = (page) => {
    setOpenGroupLabel(getActiveGroupLabel(page))
    onSelectPage(page)
  }

  useEffect(() => {
    setOpenGroupLabel(getActiveGroupLabel(activePage))
  }, [activePage])

  useEffect(() => {
    if (!useCollapsedFlyout || !openGroupLabel) return undefined

    const handlePointerDown = (event) => {
      const clickedInsideOpenGroup = groupRefs.current[openGroupLabel]?.contains(event.target)
      if (!clickedInsideOpenGroup) {
        setOpenGroupLabel(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openGroupLabel, useCollapsedFlyout])

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
                    onClick={() => setOpenGroupLabel((current) => (current === item.label ? null : item.label))}
                    aria-expanded={openGroupLabel === item.label}
                  >
                    <span className="vx-link-icon" aria-hidden="true">
                      <item.icon size={16} strokeWidth={2} />
                    </span>
                    <span className="vx-link-text">{item.label}</span>
                    <span className={`vx-link-caret ${openGroupLabel === item.label ? 'open' : ''}`} aria-hidden="true">
                      <ChevronDown size={16} strokeWidth={2.2} />
                    </span>
                  </button>

                  <div className={`vx-sublinks ${openGroupLabel === item.label ? 'open' : ''} ${useCollapsedFlyout ? 'is-flyout' : ''}`}>
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        className={`vx-sublink ${(child.page ?? child.label) === activePage ? 'active' : ''}`}
                        onClick={() => handleSelectSidebarPage(child.page ?? child.label)}
                      >
                        <span className="vx-sublink-icon" aria-hidden="true">
                          <child.icon size={14} strokeWidth={2} />
                        </span>
                      <span className={useCollapsedFlyout ? 'vx-sublink-text' : 'vx-link-text'}>
                        {child.navLabel ?? child.label}
                      </span>
                      {getNotificationCount(child.page ?? child.label) ? (
                        <span className="vx-link-badge" aria-label={`${getNotificationCount(child.page ?? child.label)} notifications`}>
                          {formatNotificationCount(getNotificationCount(child.page ?? child.label))}
                        </span>
                      ) : null}
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
                  {getNotificationCount(item.label) ? (
                    <span className="vx-link-badge" aria-label={`${getNotificationCount(item.label)} notifications`}>
                      {formatNotificationCount(getNotificationCount(item.label))}
                    </span>
                  ) : null}
                </button>
              )
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
