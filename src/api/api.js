export const backEndUrl = import.meta.env.VITE_BACK_END_URL
export const authToken = import.meta.env.VITE_AUTH_TOKEN

if (!backEndUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    'VITE_BACK_END_URL is not set. Add it to your .env file and restart the dev server.'
  )
}

if (!authToken) {
  // eslint-disable-next-line no-console
  console.warn(
    'VITE_AUTH_TOKEN is not set. Add it to your .env file and restart the dev server.'
  )
}

const getAuthHeaderValue = () => {
  if (!authToken) return ''
  return authToken
}

// Note: Set VITE_AUTH_TOKEN to the exact value you want sent.
// If your backend expects "Bearer <token>", include "Bearer " in .env.
export const getAuthHeaders = () => (
  authToken ? { Authorization: getAuthHeaderValue() } : {}
)

export const getInstitutionParam = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('institutionId')
    || localStorage.getItem('institution_id')
    || localStorage.getItem('institution')
    || ''
}

export const getCourseParam = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('courseKey')
    || localStorage.getItem('course_key')
    || localStorage.getItem('course')
    || ''
}

export const USER_LOGIN_API = `${backEndUrl}/api/admin_login/admin/login`
export const USER_SIGN_OUT_API = `${backEndUrl}/api/admin_login/admin/signout`

export const GET_BREADCRUMBS_API = `${backEndUrl}/api/common_api/admin/getbreadcrumps`
export const GET_TOTAL_LAYER_API = `${backEndUrl}/api/subject/user/gettotallayercount`
export const COURSE_SEARCH_API = `${backEndUrl}/api/course/admin/search`
export const COURSE_CREATE_API = `${backEndUrl}/api/course/admin/create`
export const COURSE_CREATE_WITH_FILE_API = `${backEndUrl}/api/common_api/admin/excelpostyear`
export const SUBJECT_CREATE_WITH_FILE_API = `${backEndUrl}/api/common_api/admin/excelpost`
export const YEAR_CREATE_API = `${backEndUrl}/api/year/admin/create`
export const SUBJECT_CREATE_API = `${backEndUrl}/api/subject/admin/create`
export const LAYER_ONE_CREATE_API = `${backEndUrl}/api/layer1/admin/create`
export const LAYER_TWO_CREATE_API = `${backEndUrl}/api/layer2/admin/create`
export const LAYER_THREE_CREATE_API = `${backEndUrl}/api/layer3/admin/create`
export const GET_ALL_COURSE_API = `${backEndUrl}/api/course/admin/get`

// Syllabus / Assessment APIs
export const GET_ALL_YEAR_API = `${backEndUrl}/api/year/admin/get`
export const GET_INSTITUTION_SUBJECTS = `${backEndUrl}/api/subject/admin/getSubjectAssessment`
export const GET_SUBJECT_BASED_TOPICS = `${backEndUrl}/api/layer2/admin/getTopicAssessment`
export const GET_TOPIC_BASED_COMPETENCY = `${backEndUrl}/api/layer3/admin/getCompetencyAssessment`

// DOAP evaluation APIs
export const DOAP_API = `${backEndUrl}/api/doap/admin`
export const DOAP_EVALUATION_API = `${backEndUrl}/api/doap_evaluation/admin`
export const DOAP_EVALUATION_SEARCH_ACTIVITY_API = `${DOAP_EVALUATION_API}/searchActivity`
export const DOAP_EVALUATION_STUDENTS_LIST_API = `${DOAP_EVALUATION_API}/studentsList`
export const DOAP_EVALUATION_SAVE_API = `${DOAP_EVALUATION_API}/saveEvaluation`
export const DOAP_EVALUATION_SUBMIT_API = `${DOAP_EVALUATION_API}/submitEvaluation`
