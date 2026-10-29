import { APP_PAGES as P, SIDEBAR_MENU } from './appPages.js'

export const DEMO_SERIES = [{ id: 'skills', label: 'Skill Assessment' }, { id: 'questions', label: 'Question Bank' }]
/** @typedef {{id:string, series:string, step:string, title:string, summary:string, pages:string[], followPage:string, videoId:string|null, duration:number|null, transcriptUrl:string|null}} DemoVideo */
const video = (id, series, step, title, summary, pages, followPage) => ({ id, series, step, title, summary, pages, followPage, videoId: null, duration: null, transcriptUrl: null })
/** Editorial catalogue from MEDUI-4. Media comes from the deployment-owned JSON configuration. */
export const DEMO_VIDEOS = [
  video('skills-introduction', 'skills', '00', 'Introduction', 'Get to know the Skill Assessment workflow.', [P.CONFIGURATION, P.DASHBOARD], P.CONFIGURATION),
  video('skills-ospe', 'skills', '01', 'OSPE / OSCE', 'Create and organise a practical examination activity.', [P.CONFIGURATION, P.OSPE_ACTIVITY], P.CONFIGURATION),
  video('skills-image', 'skills', '02', 'Image activity', 'Build a skill activity using clinical images.', [P.IMAGE_ACTIVITY], P.CONFIGURATION),
  video('skills-interpretation', 'skills', '03', 'Interpretation activity', 'Set up an activity for interpreting clinical findings.', [P.INTERPRETATION_ACTIVITY], P.CONFIGURATION),
  video('skills-edit', 'skills', '04', 'Edit and delete', 'Manage and revise your skill activities.', [P.CONFIGURATION], P.CONFIGURATION),
  video('skills-evaluate', 'skills', '05–06', 'Evaluate and send for approval', 'Record student marks and send them for review.', [P.EVALUATION, P.START_EVALUATION, P.COMPLETED_EVALUATION], P.EVALUATION),
  video('skills-approve', 'skills', '07', 'Approve and reject', 'Review skill assessment marks and give feedback.', [P.REVIEW_APPROVE, P.APPROVAL_VIEW], P.REVIEW_APPROVE),
  video('skills-publish', 'skills', '08', 'Publish results and schedule the next attempt', 'Publish reviewed marks and plan the next attempt.', [P.EVALUATION, P.COMPLETED_EVALUATION], P.EVALUATION),
  video('skills-results', 'skills', '09', 'Results and reports', 'Explore skill results and student progress.', [P.DASHBOARD, P.DASHBOARD_SUMMARY, P.ACTIVITY_RESULT, P.PROGRESS_TRACKING], P.DASHBOARD),
  video('questions-mcq', 'questions', '01', 'MCQs', 'Create a multiple-choice question with an answer key.', [P.QUESTION_BANK], P.QUESTION_BANK),
  video('questions-saq', 'questions', '02', 'SAQs', 'Write a short-answer question and its marking guidance.', [P.QUESTION_BANK], P.QUESTION_BANK),
  video('questions-laq', 'questions', '03', 'Case-based LAQs', 'Build a clinical case with structured sub-questions.', [P.QUESTION_BANK], P.QUESTION_BANK),
  video('questions-edit', 'questions', '04', 'Edit and customise', 'Adapt questions for your teaching and assessment needs.', [P.QUESTION_BANK, P.QUESTION_BANK_NON_CREATE], P.QUESTION_BANK),
  video('questions-find', 'questions', '05', 'Find and filter', 'Find suitable questions using the Question Bank filters.', [P.QUESTION_BANK_NON_CREATE], P.QUESTION_BANK_NON_CREATE),
]
const navigation = SIDEBAR_MENU.flatMap(section => section.items.flatMap(item => item.children || [item]))
export const demoPageLabel = page => navigation.find(item => item.label === page)?.navLabel || page
export const demoProgressKey = video => `${video.id}:${video.videoId || 'unavailable'}`
export const demosAllowed = (page, mobileUnsupported) => !mobileUnsupported && ![P.STUDENT_EXAM, P.ONLINE_PRACTICE_EXAM, P.ONLINE_PROCTORED_EXAM, P.LOGIN].includes(page)
