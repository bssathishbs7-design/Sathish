'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  ChevronFirst,
  ChevronLast,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Search,
  Sun,
} from 'lucide-react'

export const sidebarMenu = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', icon: 'dashboard', href: '/' },
      { label: 'Widgets', icon: 'widgets' },
      { label: 'Tables', icon: 'tables' },
      { label: 'Forms', icon: 'forms' },
      { label: 'Faculty Management', icon: 'faculty', href: '/faculty-management' },
    ],
  },
  {
    section: 'Apps',
    items: [
      { label: 'Mail', icon: 'mail' },
      { label: 'Chat', icon: 'chat' },
      { label: 'Calendar', icon: 'calendar' },
      { label: 'File Manager', icon: 'files' },
    ],
  },
] as const

const iconMap = {
  dashboard: LayoutDashboardIcon,
  widgets: BlocksIcon,
  tables: Table2Icon,
  forms: FileTextIcon,
  faculty: FolderKanbanIcon,
  mail: MailIcon,
  chat: MessageCircleIcon,
  calendar: CalendarDaysIcon,
  files: FolderKanbanIcon,
} as const

type IconKey = keyof typeof iconMap

interface MenuItem {
  label: string
  icon: IconKey
  href?: string
}

interface MenuSection {
  section: string
  items: readonly MenuItem[]
}

interface DashboardShellProps {
  children: ReactNode
  menu?: readonly MenuSection[]
}

export function DashboardShell({ children, menu = sidebarMenu }: DashboardShellProps) {
  const pathname = usePathname()
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
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [fullscreen])

  return (
    <div className={`vx-shell ${theme} ${sidebarOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className={`vx-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>

      <aside className={`vx-sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}>
        <div className="vx-logo-row">
          <span className="vx-logo">{logoMode === 'full' ? 'Medsy' : 'M'}</span>
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
          <input type="text" placeholder="Search..." aria-label="Search navigation" />
        </div>

        <nav className="vx-menu">
          {menu.map((section) => (
            <div key={section.section} className="vx-menu-section">
              <h3>{section.section}</h3>
              <ul>
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = item.href ? pathname === item.href : false

                  return (
                    <li key={item.label} className={isActive ? 'is-active' : ''}>
                      {item.href ? (
                        <Link href={item.href} className={`vx-nav-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                          <Icon />
                          <span className="vx-link-text">{item.label}</span>
                        </Link>
                      ) : (
                        <>
                          <Icon />
                          <span className="vx-link-text">{item.label}</span>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="vx-sidebar-footer">
          <button type="button" onClick={toggleTheme} aria-label="Toggle theme">
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
            <button type="button" className="vx-action-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              {fullscreen ? <Minimize /> : <Maximize />}
            </button>
            <div className="vx-user-menu">
              <img src="https://via.placeholder.com/32" alt="User" className="vx-user-avatar" />
            </div>
          </div>
        </header>

        <div className="vx-content">{children}</div>
      </main>
    </div>
  )
}

function LayoutDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6zm10-10h8v-2h-8v2z" />
    </svg>
  )
}

function BlocksIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 4h7v3h-7v-3z" />
    </svg>
  )
}

function Table2Icon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v14H4V5zm0 4h16M9 5v14M15 5v14" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" />
      <path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
  )
}

function FolderKanbanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
      <path d="M8 11h3v5H8zm5-1h3v6h-3zm5 3h3v3h-3z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  )
}

function MessageCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.94L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  )
}

function CalendarDaysIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v3M17 2v3M3 8h18" />
      <path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </svg>
  )
}
