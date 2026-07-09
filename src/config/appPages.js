import {
  BarChart3,
  BookOpenCheck,
  BookText,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  FileText,
  LayoutTemplate,
  MessageSquareText,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'

export const APP_PAGES = {
  DASHBOARD: 'Dashboard',
  CONFIGURATION: 'Configuration',
  EVALUATION: 'Evaluation',
  ASSESSMENT_CREATE: 'Assessment Create',
  CREATE_ASSESSMENT: 'createassessment',
  ASSESSMENT_EVALUATION: 'Assessment Evaluation',
  ASSESSMENT_STUDENT_EVALUATION: 'startstudentevaluation',
  ASSESSMENT_STUDENT_RESULT: 'assessmentstudentresult',
  ASSESSMENT_OVERALL_ANALYTICS: 'Assessment Overall Analytics',
  ASSESSMENT_DASHBOARD: 'Assessment Dashboard',
  EXAM_CONTROLS: 'Exam Controls',
  MY_ASSESSMENT: 'My Assessment',
  ONLINE_PRACTICE_EXAM: 'Online Practice Exam',
  ONLINE_PROCTORED_EXAM: 'Online Proctored Exam',
  QUESTION_BANK: 'Question Bank',
  QUESTION_BANK_NON_CREATE: 'Question Bank Overall Question',
  BLUEPRINT: 'Corelation Rating',
  QUERY_REQUEST: 'Query Request',
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
  APP_PAGES.CREATE_ASSESSMENT,
  APP_PAGES.ASSESSMENT_EVALUATION,
  APP_PAGES.ASSESSMENT_STUDENT_EVALUATION,
  APP_PAGES.ASSESSMENT_STUDENT_RESULT,
  APP_PAGES.ASSESSMENT_OVERALL_ANALYTICS,
  APP_PAGES.ASSESSMENT_DASHBOARD,
  APP_PAGES.EXAM_CONTROLS,
]

export const QUESTION_BANK_PAGES = [
  APP_PAGES.QUESTION_BANK,
  APP_PAGES.QUESTION_BANK_NON_CREATE,
]

export const ASSESSMENT_SUITE_PAGES = [
  APP_PAGES.QUESTION_BANK,
  APP_PAGES.QUESTION_BANK_NON_CREATE,
  APP_PAGES.ASSESSMENT_CREATE,
  APP_PAGES.CREATE_ASSESSMENT,
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
        label: APP_PAGES.MY_SKILL_ACTIVITY,
        icon: BookOpenCheck,
      },
      {
        label: APP_PAGES.REVIEW_APPROVE,
        icon: FileCheck2,
      },
      {
        label: APP_PAGES.BLUEPRINT,
        navLabel: 'Corelation Rating',
        icon: LayoutTemplate,
      },
      {
        label: 'Assessment Suite',
        icon: BookText,
        children: [
          { label: APP_PAGES.QUESTION_BANK_NON_CREATE, navLabel: 'Question Bank', icon: FileSearch },
          { label: APP_PAGES.ASSESSMENT_CREATE, navLabel: 'Assessment', icon: TrendingUp },
        ],
      },
      {
        label: APP_PAGES.MY_ASSESSMENT,
        icon: ClipboardCheck,
      },
      {
        label: APP_PAGES.QUERY_REQUEST,
        icon: MessageSquareText,
      },
    ],
  },
]
