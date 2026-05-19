import {
  BarChart3,
  BookOpenCheck,
  BookText,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileSearch,
  FileText,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'

export const APP_PAGES = {
  DASHBOARD: 'Dashboard',
  CONFIGURATION: 'Configuration',
  EVALUATION: 'Evaluation',
  ASSESSMENT_CREATE: 'Assessment Create',
  ASSESSMENT_EVALUATION: 'Assessment Evaluation',
  ASSESSMENT_DASHBOARD: 'Assessment Dashboard',
  QUESTION_BANK: 'Question Bank',
  QUESTION_BANK_NON_CREATE: 'Question Bank Overall Question',
  ACTIVITY_RESULT: 'Activity Result',
  COMPLETED_EVALUATION: 'Completed Evaluation',
  REVIEW_APPROVE: 'Approval Queue',
  APPROVAL_VIEW: 'Approval View',
  START_EVALUATION: 'Start Evaluation',
  EXAM_LOG: 'Exam Log',
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
  APP_PAGES.COMPLETED_EVALUATION,
  APP_PAGES.START_EVALUATION,
  APP_PAGES.EXAM_LOG,
  APP_PAGES.OSPE_ACTIVITY,
  APP_PAGES.IMAGE_ACTIVITY,
  APP_PAGES.INTERPRETATION_ACTIVITY,
]

export const MY_SKILL_PAGES = [
  APP_PAGES.MY_SKILL_ACTIVITY,
  APP_PAGES.STUDENT_EXAM,
]

export const ASSESSMENT_PAGES = [
  APP_PAGES.ASSESSMENT_CREATE,
  APP_PAGES.ASSESSMENT_EVALUATION,
  APP_PAGES.ASSESSMENT_DASHBOARD,
]

export const QUESTION_BANK_PAGES = [
  APP_PAGES.QUESTION_BANK,
  APP_PAGES.QUESTION_BANK_NON_CREATE,
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
        label: APP_PAGES.REVIEW_APPROVE,
        icon: FileCheck2,
      },
      {
        label: 'My Skills',
        icon: BookOpenCheck,
        children: [
          { label: APP_PAGES.MY_SKILL_ACTIVITY, icon: BookOpenCheck },
        ],
      },
      {
        label: 'Assessment',
        icon: TrendingUp,
        children: [
          { label: APP_PAGES.ASSESSMENT_CREATE, navLabel: 'Create', icon: SlidersHorizontal },
          { label: APP_PAGES.ASSESSMENT_EVALUATION, navLabel: 'Evaluation', icon: ClipboardCheck },
          { label: APP_PAGES.ASSESSMENT_DASHBOARD, navLabel: 'Dashboard', icon: BarChart3 },
        ],
      },
      {
        label: APP_PAGES.QUESTION_BANK,
        icon: BookText,
        children: [
          { label: APP_PAGES.QUESTION_BANK, navLabel: 'Create', icon: FilePenLine },
          { label: APP_PAGES.QUESTION_BANK_NON_CREATE, navLabel: 'All Questions', icon: FileSearch },
        ],
      },
    ],
  },
]
