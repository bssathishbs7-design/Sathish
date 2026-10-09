/** Browser-backed template adapter. Replace these functions with API calls at integration. */
export const BLUEPRINT_TEMPLATES_KEY = 'vx-blueprint-breakdown-templates-v1'
/** Restore saved percentages, or recover older templates from complete mark allocations.
 * Older templates did not store percentages; their allocations are the only evidence.
 * @returns {{lot:string,hot:string}|null} Null means there is insufficient saved data.
 */
export function resolveTemplateCognition(template) {
  if (!template) return null
  const saved = template.cognition
  if (saved && saved.lot !== '' && saved.hot !== ''
    && Number(saved.lot) >= 0 && Number(saved.hot) >= 0
    && Math.abs(Number(saved.lot) + Number(saved.hot) - 100) < 0.000001) {
    return { lot: String(saved.lot), hot: String(saved.hot) }
  }
  let total = 0
  let hot = 0
  for (const [label, row] of Object.entries(template.breakdown || {})) {
    const marks = Number(row.totalMarks)
    if (!marks) continue
    if (!Number.isFinite(marks) || marks < 0) return null
    let hotMarks
    let lotMarks
    if (label === 'LAQs') {
      const parts = (template.laqParts || []).flatMap(question => question.splits || [])
      if (!parts.length || parts.some(part => !['hot', 'lot'].includes(part.level) || !(Number(part.marks) > 0))) return null
      hotMarks = parts.reduce((sum, part) => sum + (part.level === 'hot' ? Number(part.marks) : 0), 0)
      lotMarks = parts.reduce((sum, part) => sum + (part.level === 'lot' ? Number(part.marks) : 0), 0)
    } else if (label.startsWith('SAQs (') && ['hot', 'lot'].includes(row.cognitionMode)) {
      hotMarks = row.cognitionMode === 'hot' ? marks : 0
      lotMarks = marks - hotMarks
    } else {
      if (row.hotQuestions === '' || row.lotQuestions === '' || !(Number(row.perQuestionMarks) > 0)) return null
      hotMarks = Number(row.hotQuestions) * Number(row.perQuestionMarks)
      lotMarks = Number(row.lotQuestions) * Number(row.perQuestionMarks)
    }
    if (!Number.isFinite(hotMarks + lotMarks) || hotMarks < 0 || lotMarks < 0 || Math.abs(hotMarks + lotMarks - marks) > 0.000001) return null
    total += marks
    hot += hotMarks
  }
  if (!total || Math.abs(total - Number(template.totalMarks)) > 0.000001) return null
  const hotPercent = Number((hot * 100 / total).toFixed(6))
  return { hot: String(hotPercent), lot: String(Number((100 - hotPercent).toFixed(6))) }
}
/** @typedef {{id:string,name:string,createdAt:string,createdBy?:string,cognition?:{lot:string,hot:string},breakdown:Object,laqParts:Array,totalMarks:number}} BlueprintTemplate */
export function readBlueprintTemplates(storage = localStorage) {
  const rows = JSON.parse(storage.getItem(BLUEPRINT_TEMPLATES_KEY) || '[]')
  if (!Array.isArray(rows)) throw new Error('Unable to read saved templates.')
  return rows
}
/** Copy cognition and breakdown fields; never persist curriculum, distribution or matrix data. */
export function snapshotBlueprintBreakdown(rows, laqParts, cognition = { lot: '', hot: '' }) {
  const breakdown = Object.fromEntries(rows.map(row => [row.label, {
    perQuestionMarks: row.perQuestionMarks, totalMarks: row.totalMarks,
    hotQuestions: row.hotQuestionsValue, lotQuestions: row.lotQuestionsValue,
    ...(row.cognitionMode ? { cognitionMode: row.cognitionMode } : {}),
  }]))
  return { cognition: { lot: String(cognition.lot), hot: String(cognition.hot) }, breakdown, laqParts: structuredClone(laqParts), totalMarks: rows.reduce((sum, row) => sum + (Number(row.totalMarks) || 0), 0) }
}
/** @returns {Promise<BlueprintTemplate>} Validates names and persists before reporting success. */
export async function saveBlueprintTemplate(name, snapshot, storage = localStorage, createdBy = '') {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Enter a blueprint name.')
  if (trimmed.length > 80) throw new Error('Use 80 characters or fewer.')
  const rows = readBlueprintTemplates(storage)
  const normalise = value => value.trim().replace(/\s+/g, ' ').toLowerCase()
  if (['default', 'create blueprint (default)'].includes(normalise(trimmed)) || rows.some(row => normalise(row.name) === normalise(trimmed))) throw new Error('A template with this name already exists. Choose another name.')
  const template = { id: crypto.randomUUID(), name: trimmed, createdAt: new Date().toISOString(), createdBy, cognition: { lot: snapshot.cognition.lot, hot: snapshot.cognition.hot }, breakdown: structuredClone(snapshot.breakdown), laqParts: structuredClone(snapshot.laqParts), totalMarks: snapshot.totalMarks }
  try { storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify([...rows, template])) }
  catch { throw new Error('Unable to save template. Check browser storage and try again.') }
  return template
}

/** Remove a reusable template only. Assessment drafts and loaded values are untouched. */
export async function deleteBlueprintTemplate(id, storage = localStorage) {
  if (id === 'default') throw new Error('The default option cannot be deleted.')
  const rows = readBlueprintTemplates(storage)
  try { storage.setItem(BLUEPRINT_TEMPLATES_KEY, JSON.stringify(rows.filter(row => row.id !== id))) }
  catch { throw new Error('Unable to delete template. Please try again.') }
}
