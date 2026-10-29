import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHash } from 'node:crypto'

// Only reads curriculum headings and activity tables. Document prose is never executed.
const [input, output] = process.argv.slice(2)
if (!input || !output) throw new Error('Usage: node scripts/build-logbook-catalogue.mjs extracted.json output.json')
const docs = JSON.parse(readFileSync(input, 'utf8').replace(/^\uFEFF/, ''))
const tidy = value => String(value || '').replace(/\s+/g, ' ').trim()
const compact = value => tidy(value).toLowerCase().replace(/[^a-z0-9]/g, '')
const sources = [], activities = [], issues = [], coverage = new Map()
const departments = [
  [/Anatomy/i, 'Human Anatomy', 'Phase I'], [/Biochemistry/i, 'Biochemistry', 'Phase I'],
  [/Physiology/i, 'Physiology', 'Phase I'], [/Pathology/i, 'Pathology', 'Phase II'],
  [/Pharmacology/i, 'Pharmacology', 'Phase II'], [/Micro -/i, 'Microbiology', 'Phase II'],
  [/Comm\./i, 'Community Medicine', 'Phase III Part 1'], [/Ophthal/i, 'Ophthalmology', 'Phase III Part 1'],
  [/Anaesth|Anaestisa/i, 'Anaesthesiology', 'Phase III Part 2'], [/DVL/i, 'Dermatology, Venereology and Leprosy', 'Phase III Part 2'],
  [/ENT -/i, 'Otorhinolaryngology (ENT)', 'Phase III Part 1'], [/PSYCHIATRY/i, 'Psychiatry', 'Phase III Part 1'],
  [/Gen.Med/i, 'General Medicine', 'Phase II'], [/GS -|Surgery/i, 'General Surgery', 'Phase II'],
  [/OBGY/i, 'Obstetrics and Gynaecology', 'Phase II'], [/Ortho/i, 'Orthopaedics', 'Phase III Part 1'],
  [/Paediatrics/i, 'Paediatrics', 'Phase II'], [/Radiodiag/i, 'Radiology (Radio-diagnosis)', 'Phase III Part 2'],
]
function section(text) {
  const t = compact(text)
  if (/^repeat.*remedial/.test(t)) return 'remedial'
  if (/^(skills)?certifiableskill|^certifiableskill|^skillscertifiable/.test(t)) return 'cert'
  if (/^(revision)?skills?competenc/.test(t)) return 'skill'
  if (t === 'earlyclinicalexposure') return 'ece'
  if (/^attitudeethicscommunication|^aetcommodule$/.test(t)) return 'aetcom'
  if (t === 'verticalintegration') return 'vertical'
  if (t === 'selfdirectedlearning') return 'sdl'
  if (/^clinicalcasepresentationrecord/.test(t)) return 'ccp'
  if (t === 'clinicalclerkship') return 'clerkship'
  if (t === 'familyadoptionprogram') return 'fap'
  if (/^fieldvisitdocumentation|^reflectionsof(field|industrial)visit/.test(t)) return 'fvs'
  if (t === 'curricularachievements') return 'curricular'
  if (t === 'cocurricularachievements') return 'co-curricular'
  return null
}
function phaseOf(text) {
  const m = tidy(text).match(/^phase\s*(III|II|I)(?:\s*[-–]?\s*part\s*[-–]?\s*(II|I|2|1))?\s*$/i)
  return m ? `Phase ${m[1].toUpperCase()}${m[2] ? ` Part ${['II', '2'].includes(m[2].toUpperCase()) ? 2 : 1}` : ''}` : null
}
function remember(subject, phase, category, source) {
  const key = JSON.stringify([subject, phase, category])
  if (!coverage.has(key)) coverage.set(key, { subject, phase, category, sources: [] })
  const list = coverage.get(key).sources
  if (!list.some(item => item.file === source.file && item.table === source.table)) list.push(source)
}
for (const doc of docs) {
  const mapping = departments.find(([pattern]) => pattern.test(doc.file))
  if (!mapping) { issues.push({ file: doc.file, reason: 'Unmapped department' }); continue }
  const [, subject, defaultPhase] = mapping
  sources.push({ file: doc.file, subject, supplemental: /Anaestisa|GS -/.test(doc.file) })
  if (/Anaestisa/.test(doc.file)) { issues.push({ file: doc.file, reason: 'Posting timetable retained as reference; not imported as student activities.' }); continue }
  let phase = defaultPhase, category = null, heading = '', week = '', reflection = false
  for (const block of doc.blocks) {
    if (block.type === 'paragraph') {
      const foundPhase = phaseOf(block.text)
      if (foundPhase) { phase = foundPhase; week = ''; reflection = false; continue }
      const found = section(block.text)
      if (found) { category = found; heading = tidy(block.text); reflection = false; remember(subject, phase, category, { file: doc.file, heading }); }
      else if (/^reflect(?:ions|ive)/i.test(tidy(block.text))) reflection = true
      if (/^week\s*\d+/i.test(tidy(block.text))) week = tidy(block.text)
      continue
    }
    if (!category || reflection) continue
    const rows = block.rows.map(row => row.map(tidy))
    const headerIndex = rows.findIndex(row => row.some(cell => /competenc.*no|module.*no|nameoftheactivity|name.*activity|patientid|nameofvillage|placeofvisit/.test(compact(cell))))
    const source = { file: doc.file, table: block.number, heading }
    if (headerIndex < 0) continue
    const header = rows[headerIndex].map(compact)
    if (header.some(cell => cell === 'contents')) continue
    remember(subject, phase, category, source)
    const codeIndex = header.findIndex(cell => /competenc.*no|module.*no/.test(cell))
    const nameIndex = header.findIndex(cell => /^(topic|name.*activity)$/.test(cell))
    const departmentIndex = header.findIndex(cell => /integrateddepartment/.test(cell))
    const countIndex = header.findIndex(cell => /numberrequired/.test(cell))
    // Orthopaedics places the first Phase III Part 2 skills heading after its table.
    if (['ccp', 'clerkship'].includes(category) && codeIndex >= 0 && header.some(cell => /name.*activity/.test(cell))) {
      category = 'skill'
      source.heading = 'Skill competencies (identified from table columns)'
      remember(subject, phase, category, source)
    }
    let populated = 0
    for (let index = headerIndex + 1; index < rows.length; index++) {
      const cells = rows[index]
      const rawCode = codeIndex >= 0 ? cells[codeIndex] || '' : ''
      const name = nameIndex >= 0 ? cells[nameIndex] || '' : ''
      if (!name || /^(name|topic|date|module|competenc)/i.test(name) && name.length < 28) continue
      if (codeIndex >= 0 && !/\d/.test(rawCode)) {
        issues.push({ ...source, row: index + 1, reason: 'Activity has no code', name })
        if (['skill', 'cert', 'remedial'].includes(category)) continue
      }
      const code = category === 'aetcom' ? rawCode.replace(/^module\s*[-–]?\s*/i, '').trim() : rawCode.replace(/\s+/g, '').replace(/^([A-Z]+)\./, '$1')
      const required = countIndex >= 0 ? Number(cells[countIndex]) || null : null
      const identity = JSON.stringify([subject, phase, category, code, name])
      const id = 'log-' + createHash('sha256').update(identity).digest('hex').slice(0, 16)
      const prior = activities.find(item => item.id === id)
      const ref = { ...source, row: index + 1 }
      if (prior) { prior.sources.push(ref); if (prior.requiredAttempts !== required && required !== null) issues.push({ ...ref, reason: 'Conflicting certification count', activityId: id }); populated++; continue }
      activities.push({ id, subject, phase, category, code, name, ...(departmentIndex >= 0 && cells[departmentIndex] ? { departments: cells[departmentIndex] } : {}), ...(week ? { week } : {}), ...(required ? { requiredAttempts: required } : {}), sources: [ref], sample: false })
      populated++
    }
    // Blank clinical/community/achievement tables become explicit sample templates, never completed records.
    if (!populated && ['ccp', 'clerkship', 'fap', 'fvs', 'curricular', 'co-curricular', 'sdl', 'aetcom', 'vertical'].includes(category)) {
      const names = { sdl: 'Self-directed study activity', aetcom: 'Ethics and communication discussion', vertical: 'Integrated learning discussion', ccp: 'Supervised clinical case presentation', clerkship: 'Supervised clinical clerkship', fap: 'Family adoption visit', fvs: /PHC|CHC|industrial|Anganwadi|Subcentre|STERILE/i.test(heading) ? heading.replace(/^REFLECTIONS (OF )?/i, '') : 'Field visit and survey', curricular: 'Student seminar or role play', 'co-curricular': 'Quiz or presentation participation' }
      const name = names[category], identity = JSON.stringify([subject, phase, category, name])
      const id = 'sample-' + createHash('sha256').update(identity).digest('hex').slice(0, 16)
      const prior = activities.find(item => item.id === id)
      if (prior) prior.sources.push(source)
      else activities.push({ id, subject, phase, category, code: '', name, sample: true, sources: [source] })
    }
  }
}
// Some community templates have headings and reflection prompts rather than coded activity tables.
for (const item of coverage.values()) {
  if (!['fap', 'fvs'].includes(item.category) || activities.some(row => row.subject === item.subject && row.phase === item.phase && row.category === item.category)) continue
  const name = item.category === 'fap' ? 'Family adoption visit' : 'Field visit and survey'
  activities.push({ ...item, id: 'sample-' + createHash('sha256').update(JSON.stringify([item.subject, item.phase, item.category])).digest('hex').slice(0, 16), code: '', name, sample: true })
}
const result = { version: 1, sourceArchive: 'Fwd__LOGBOOK_ALL_Department.zip', missingSubjects: ['Forensic Medicine and Toxicology'], sources, coverage: [...coverage.values()], activities, issues }
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ documents: sources.length, departments: new Set(sources.map(row => row.subject)).size, activities: activities.length, issues: issues.length, categories: [...new Set(activities.map(row => row.category))] }))
