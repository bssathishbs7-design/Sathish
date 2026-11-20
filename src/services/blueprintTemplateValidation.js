import { calculateCognitionMarks } from '../utils/blueprintCalculations.js'

/** Validate the complete saved input state against its rendered tables.
 * @param {Object} planner Curriculum, distribution, cognition and allocation state.
 * @param {{distribution:Array,questionTypes:Array,competencies:Array,columns:Array}} tables
 * @throws {Error} A correction the author must make before saving.
 */
export function validateCompleteBlueprint(planner, tables) {
  const fail = message => { throw new Error(message) }
  const number = value => {
    const result = Number(value || 0)
    if (!Number.isFinite(result) || result < 0) fail('Blueprint values must be non-negative numbers.')
    return result
  }
  const same = (a, b) => Math.abs(a - b) < 0.000001
  const total = number(planner.blueprintDraft?.totalMark)
  const { distribution = [], questionTypes = [], competencies = [], columns = [] } = tables || {}
  if (!total || !distribution.length || !questionTypes.length || !competencies.length || !columns.length) {
    fail('Complete all blueprint tables before saving.')
  }
  const keys = rows => rows.map(row => row.key).sort()
  const distributionKeys = keys(distribution)
  if (new Set(distributionKeys).size !== distributionKeys.length
    || JSON.stringify(distributionKeys) !== JSON.stringify(keys(competencies))
    || JSON.stringify(distributionKeys) !== JSON.stringify([...planner.blueprintDraft.competencies].sort())) {
    fail('Use the same competencies in the distribution and assessment blueprint tables.')
  }
  if (!same(distribution.reduce((sum, row) => sum + number(row.distributionLabel), 0), total)) {
    fail('Distribution marks must match the total marks.')
  }
  const cognition = planner.blueprintCognitionWeightage || {}
  if (cognition.lot === '' || cognition.hot === '' || cognition.lot == null || cognition.hot == null
    || !same(number(cognition.lot) + number(cognition.hot), 100)) {
    fail('LoT and HoT percentages must total 100%.')
  }
  const expected = Object.fromEntries(columns.map(column => [column.key, { marks: 0, count: 0 }]))
  let breakdownTotal = 0
  for (const row of questionTypes) {
    const marks = number(row.totalMarks)
    breakdownTotal += marks
    if (!marks) continue
    const perQuestion = number(row.perQuestionMarks)
    if (!perQuestion || !Number.isInteger(marks / perQuestion)) fail('Check marks per question and question totals in the breakdown.')
    const group = row.label === 'MCQs' ? 'mcq' : row.label === 'LAQs' ? 'laq' : 'saq'
    const parts = group === 'laq' ? (planner.blueprintLaqQuestionSplits || []).flatMap(question => question.splits || []) : []
    let rowMarks = 0
    for (const level of ['lot', 'hot']) {
      const key = group + (level === 'lot' ? 'Lot' : 'Hot')
      const count = number(row[`${level}QuestionsValue`])
      if (!Number.isInteger(count)) fail('Question counts must be whole numbers.')
      const levelParts = parts.filter(part => part.level === level)
      const allocatedMarks = group === 'laq' ? levelParts.reduce((sum, part) => sum + number(part.marks), 0) : count * perQuestion
      if (group === 'laq' && count !== levelParts.length) fail('LAQ parts must match the question breakdown.')
      if (!expected[key] && (count || allocatedMarks)) fail('The assessment blueprint is missing a question type column.')
      if (expected[key]) {
        expected[key].count += count
        expected[key].marks += allocatedMarks
      }
      rowMarks += allocatedMarks
    }
    if (!same(rowMarks, marks)) fail('LoT and HoT marks must match each question type total.')
  }
  if (!same(breakdownTotal, total)) fail('Question breakdown marks must match the total marks.')
  const cognitionMarks = calculateCognitionMarks({ totalMarks: total, hotPercentage: number(cognition.hot) })
  for (const level of ['lot', 'hot']) {
    const suffix = level === 'lot' ? 'Lot' : 'Hot'
    const marks = Object.entries(expected).reduce((sum, [key, value]) => sum + (key.endsWith(suffix) ? value.marks : 0), 0)
    if (!same(marks, cognitionMarks[`${level}Marks`])) fail('Question breakdown LoT and HoT marks must match the cognition targets.')
  }
  const actual = Object.fromEntries(columns.map(column => [column.key, { marks: 0, count: 0 }]))
  for (const row of competencies) {
    const distributionRow = distribution.find(item => item.key === row.key)
    const target = number(distributionRow.distributionLabel)
    if (!same(number(row.targetMarks), target) || !same(number(planner.blueprintDistributionDraft?.[row.key]), target)) {
      fail('Competency targets must match the saved distribution.')
    }
    let rowTotal = 0
    for (const { key } of columns) {
      const marks = number(planner.blueprintTestSpecificationMarkDraft?.[row.key]?.[key])
      const count = number(planner.blueprintTestSpecificationCountDraft?.[row.key]?.[key])
      if (!Number.isInteger(count) || Boolean(count) !== Boolean(marks)) fail('Check competency question counts and allocated marks.')
      actual[key].marks += marks
      actual[key].count += count
      rowTotal += marks
    }
    if (!same(rowTotal, target)) fail('Every competency allocation must match its target marks.')
  }
  for (const { key } of columns) {
    if (!same(actual[key].marks, expected[key].marks) || actual[key].count !== expected[key].count) {
      fail('Assessment blueprint counts and marks must match the question breakdown for every LoT and HoT column.')
    }
  }
}
