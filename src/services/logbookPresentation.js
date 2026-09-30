import { CATEGORIES } from './logbookSample.js'
export { activityKey } from './logbookTitles.js'
export const categoryLabel = id => CATEGORIES.find(item => item.id === id)?.shortName || CATEGORIES.find(item => item.id === id)?.name || id

