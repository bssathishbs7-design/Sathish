import { CATEGORIES } from './logbookSample.js'
import { entryTitle } from './logbook.js'
export const categoryLabel = id => CATEGORIES.find(item => item.id === id)?.shortName || CATEGORIES.find(item => item.id === id)?.name || id
export const activityKey = entry => [entry.cat, entry.values.competency, entryTitle(entry)].filter(Boolean).join(' / ')

