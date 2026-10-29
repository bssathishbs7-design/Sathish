import catalogue from '../data/logbookDocumentCatalogue.json' with { type: 'json' }
import { CATEGORIES } from './logbookCatalog.js'

/** Source rows preserve department, posting phase, topic and document/table provenance.
 * Blank templates are marked sample; codes are never invented. Skills remain reference-only.
 * @typedef {{id:string,subject:string,phase:string,category:string,code:string,name:string,sample:boolean,sources:Array<{file:string,table?:number,row?:number}>}} CatalogueActivity
 */
export const LOGBOOK_CATALOGUE = catalogue
const excluded = new Set(['skill', 'cert', 'remedial'])
const phases = ['Phase I', 'Phase II', 'Phase III Part 1', 'Phase III Part 2']
export const assignmentCategory = category => ['curricular', 'co-curricular'].includes(category) ? 'ach' : category
export const sourceCategoryLabel = category => ({ curricular: 'Curricular achievements', 'co-curricular': 'Co-curricular achievements' })[category] || CATEGORIES.find(row => row.id === category)?.name || category
export const assignmentPhases = subject => phases.filter(phase => catalogue.coverage.some(row => row.subject === subject && row.phase === phase))
export const assignmentCategories = (subject, phase) => [...new Set(catalogue.activities.filter(row => row.subject === subject && row.phase === phase && !excluded.has(row.category)).map(row => row.category))].map(id => ({ id, name: sourceCategoryLabel(id) }))
export const assignmentSamples = (category, subject, phase) => catalogue.activities.filter(row => row.category === category && row.subject === subject && (!phase || row.phase === phase) && !excluded.has(row.category))
export const findAssignmentActivity = id => catalogue.activities.find(row => row.id === id && !excluded.has(row.category))

/** One representative activity per category in this posting, reviewed before assignment. */
export const recommendedAssignmentSamples = (subject, phase) => assignmentCategories(subject, phase).map(category => assignmentSamples(category.id, subject, phase)[0])

/** Only prefill task definitions, never dates, patient data, reflections or grades. */
export function sourceAssignmentValues(activity) {
  const cat = assignmentCategory(activity.category)
  return {
    ...(['ece', 'aetcom', 'vertical', 'sdl'].includes(cat) ? { topic: activity.name } : {}),
    ...(activity.code ? { [cat === 'aetcom' ? 'moduleNo' : 'competency']: activity.code } : {}),
    ...(cat === 'ach' ? { activity: activity.name } : {}),
    ...(cat === 'vertical' && activity.departments ? { depts: activity.departments } : {}),
    ...(cat === 'sdl' && activity.week ? { week: activity.week } : {}),
  }
}
export const sampleInstructions = activity => `${activity.sample ? 'Sample task' : 'Assigned activity'}: ${activity.name}. Complete the applicable logbook fields after the activity; add your own reflection where required.`.slice(0, 500)
