import { CATEGORIES } from './logbookCatalog.js'

const join = values => values.filter(Boolean).join(' · ')
/** Category-aware identifiers used by learner titles and faculty activity grouping. */
export function activityParts(entry) {
  const v = entry.values || {}
  switch (entry.cat) {
    case 'cert': case 'skill': case 'remedial': return [v.competency, v.activity]
    case 'ece': case 'sdl': case 'vertical': case 'horizontal': return [v.competency, v.topic]
    case 'aetcom': return [v.moduleNo && `Module ${v.moduleNo}`, v.topic]
    case 'practical': return [v.exerciseNo && `Exercise ${v.exerciseNo}`, v.activity]
    case 'museum': return [v.specimenNo, v.activity]
    case 'journal': case 'sgt': return [v.sessionType, v.topic]
    case 'proc': return [v.activity, v.participation]
    case 'simulation': return [v.activity, v.station]
    case 'emergency': return [v.shift && `${v.shift} duty`, v.cases && `${v.cases} cases`]
    case 'obg': return [v.recordType, v.patientId, v.outcome]
    case 'imm': return [v.sessionType, v.children && `${v.children} children`, v.vaccines]
    case 'pm': return [v.recordType, v.caseNo, v.findings]
    case 'pharm': return [v.exerciseType, v.activity]
    case 'ccp': return [v.diagnosis, v.ageGender]
    case 'clerkship': return [v.provDx, v.ageGender]
    case 'chs': return [v.activityType, v.place]
    case 'fap': return [v.place, v.families && `${v.families} families`]
    case 'fvs': return [v.day && `Day ${v.day}`, v.village || v.place]
    default: return [v.activity || v.topic || v.diagnosis || v.provDx || v.notable || v.place]
  }
}
export const entryTitle = entry => join(activityParts(entry)) || CATEGORIES.find(category => category.id === entry.cat)?.shortName || CATEGORIES.find(category => category.id === entry.cat)?.name || 'Untitled entry'
export const activityKey = entry => JSON.stringify([entry.cat, ...activityParts(entry).map(value => String(value || '').trim().toLowerCase())])
export const attestationLabel = category => ({ ece: 'Facilitator confirmation', aetcom: 'Facilitator / faculty confirmation', ccp: 'Facilitator / faculty confirmation', fvs: 'Facilitator / faculty confirmation' })[category] || 'Faculty confirmation'
