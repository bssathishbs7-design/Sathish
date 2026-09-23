import { SUBJECTS, CATEGORIES } from './logbookCatalog.js'
import { awaitingRemedial, belongsTo, isGraded } from './logbookPeople.js'

/** Prototype category minimums; distinct logged skills and approved attempts are
 * separate measures. Replace minimums with institution configuration at API handoff. */
const clinical = { cert: 3, ccp: 3, clerkship: 3, proc: 3, sdl: 2, aetcom: 1 }
const requirements = {
  'Community Medicine': { fap: 3, fvs: 2, chs: 2, cert: 2, sdl: 2 },
  'Forensic Medicine and Toxicology': { cert: 2, skill: 2, sdl: 2, pm: 3 },
  'Obstetrics and Gynaecology': { obg: 5 }, 'Paediatrics': { imm: 2 },
}
export function requirementProgress(subject, entries) {
  const config = { ...(SUBJECTS.find(item => item.name === subject)?.phase === 'Phase III' ? clinical : {}), ...requirements[subject] }
  const rows = entries.filter(entry => entry.subject === subject && !['Draft', 'To do'].includes(entry.status))
  return Object.entries(config).map(([cat, required]) => {
    const matching = rows.filter(entry => cat === 'cert' ? isGraded(entry) : entry.cat === cat)
    const count = cat === 'cert' ? new Set(matching.map(entry => entry.values.competency || entry.values.activity).filter(Boolean)).size : matching.length
    const category = CATEGORIES.find(item => item.id === cat)
    return { cat, label: category?.shortName || category?.name || cat, required, count, met: count >= required }
  })
}
export function collectSkills(subject, entries) {
  const skills = new Map((SUBJECTS.find(item => item.name === subject)?.skills || []).map(skill => [skill.code, { ...skill }]))
  entries.filter(entry => entry.subject === subject && isGraded(entry)).forEach(entry => {
    const code = entry.values.competency || entry.values.activity
    if (!code) return
    if (!skills.has(code)) skills.set(code, { code, name: entry.values.activity || code, required: Number(entry.values.numReq) || 0 })
    else if (Number(entry.values.numReq) > skills.get(code).required) skills.get(code).required = Number(entry.values.numReq)
  })
  return [...skills.values()]
}
export function learnerSummary(studentId, entries, subjects) {
  const all = entries.filter(entry => belongsTo(entry, studentId) && subjects.includes(entry.subject))
  const submitted = all.filter(entry => !['Draft', 'To do'].includes(entry.status))
  const req = subjects.flatMap(subject => requirementProgress(subject, all))
  const returned = all.filter(entry => awaitingRemedial(entry, all)).length
  return { all, total: submitted.length, pending: submitted.filter(entry => entry.status === 'Pending').length, approved: submitted.filter(entry => entry.status === 'Approved').length, todo: all.filter(entry => entry.status === 'To do').length, returned, requirements: req, met: req.filter(item => item.met).length, required: req.length, risk: returned >= 2 || (req.length > 0 && req.filter(item => item.met).length < req.length / 2), latest: submitted.map(entry => entry.submittedAt || entry.date).sort().at(-1) }
}
