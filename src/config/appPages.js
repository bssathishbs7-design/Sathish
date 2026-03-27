import {
  ClipboardList,
  FileImage,
  FileText,
  FolderKanban,
  LayoutDashboard,
  UserPen,
} from 'lucide-react'

export const APP_PAGES = {
  DASHBOARD: 'Dashboard',
  CONFIGURATION: 'Configuration',
  EVALUATION: 'Evaluation',
  IMAGE_ACTIVITY: 'Image Activity',
  FACULTY_MANAGEMENT: 'Faculty Management',
  DASHBOARD_SUMMARY: 'Dashboard Summary',
  PROFILE_SETTINGS: 'Profile Settings',
  LOGIN: 'Login',
}

export const SKILL_PAGES = [
  APP_PAGES.DASHBOARD,
  APP_PAGES.CONFIGURATION,
  APP_PAGES.EVALUATION,
  APP_PAGES.IMAGE_ACTIVITY,
]

export const SIDEBAR_MENU = [
  {
    section: 'Main',
    items: [
      {
        label: 'Skills',
        icon: FileText,
        children: [
          { label: APP_PAGES.CONFIGURATION, icon: FolderKanban },
          { label: APP_PAGES.EVALUATION, icon: ClipboardList },
          { label: APP_PAGES.DASHBOARD, icon: LayoutDashboard },
          { label: APP_PAGES.IMAGE_ACTIVITY, icon: FileImage },
        ],
      },
      { label: APP_PAGES.FACULTY_MANAGEMENT, icon: UserPen },
    ],
  },
]
