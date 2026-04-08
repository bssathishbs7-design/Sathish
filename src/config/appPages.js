import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  FileText,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'

export const APP_PAGES = {
  DASHBOARD: 'Dashboard',
  CONFIGURATION: 'Configuration',
  EVALUATION: 'Evaluation',
  OSPE_ACTIVITY: 'OSPE Activity',
  IMAGE_ACTIVITY: 'Image Activity',
  INTERPRETATION_ACTIVITY: 'Interpretation Activity',
  MY_SKILL_ACTIVITY: 'My Skill Activity',
  STUDENT_EXAM: 'Student Exam',
  PROGRESS_TRACKING: 'Progress Tracking',
  FACULTY_MANAGEMENT: 'Faculty Management',
  STUDENT_MANAGEMENT: 'Student Management',
  DASHBOARD_SUMMARY: 'Dashboard Summary',
  PROFILE_SETTINGS: 'Profile Settings',
  LOGIN: 'Login',
}

export const SKILL_PAGES = [
  APP_PAGES.DASHBOARD,
  APP_PAGES.CONFIGURATION,
  APP_PAGES.EVALUATION,
  APP_PAGES.OSPE_ACTIVITY,
  APP_PAGES.IMAGE_ACTIVITY,
  APP_PAGES.INTERPRETATION_ACTIVITY,
]

export const MY_SKILL_PAGES = [
  APP_PAGES.MY_SKILL_ACTIVITY,
  APP_PAGES.STUDENT_EXAM,
  APP_PAGES.PROGRESS_TRACKING,
]

export const SIDEBAR_MENU = [
  {
    section: 'Main',
    items: [
      {
        label: 'Skills',
        icon: FileText,
        children: [
          { label: APP_PAGES.CONFIGURATION, icon: SlidersHorizontal },
          { label: APP_PAGES.EVALUATION, icon: ClipboardCheck },
          { label: APP_PAGES.DASHBOARD, icon: BarChart3 },
        ],
      },
      {
        label: 'My Skills',
        icon: BookOpenCheck,
        children: [
          { label: APP_PAGES.MY_SKILL_ACTIVITY, icon: BookOpenCheck },
          { label: APP_PAGES.PROGRESS_TRACKING, icon: TrendingUp },
        ],
      },
    ],
  },
]
