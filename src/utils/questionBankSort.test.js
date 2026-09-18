import test from 'node:test'
import assert from 'node:assert/strict'
import { corelationRatingRows } from '../pages/corelationRatingData.js'
import { buildCurriculumSortIndex, getQuestionCurriculumSortRecord, getSortCompetencyCode, sortBankQuestions } from './questionBankSort.js'

const index = buildCurriculumSortIndex(corelationRatingRows)
const question = (subject, code, topic) => ({ subject, competencies: code ? [code] : [], topics: topic ? [topic] : [] })
const sorted = (questions, field, direction = 'asc', catalogue = index) => sortBankQuestions(
  questions, new Map(questions.map(q => [q, getQuestionCurriculumSortRecord(q, catalogue)])), { field, direction },
)

test('subjects follow curriculum sequence rather than alphabetic order', () => {
  const inputs = ['Anaesthesiology', 'Biochemistry', 'Microbiology', 'Physiology', 'Pharmacology', 'Pathology', 'Human Anatomy'].map(s => question(s))
  assert.deepEqual(sorted(inputs, 'subjects').map(q => q.subject), [
    'Human Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Microbiology', 'Pharmacology', 'Anaesthesiology',
  ])
  assert.deepEqual(sorted(inputs, 'subjects', 'desc'), sorted(inputs, 'subjects').toReversed())
})

test('phase ranking uses canonical MBBS mapping, even with stale year metadata', () => {
  const inputs = [question('Medicine'), question('Ophthalmology'), question('Anatomy'), question('Pathology')]
  inputs.forEach(q => { q.year = 'First year' })
  assert.deepEqual(sorted(inputs, 'years').map(q => q.subject), ['Anatomy', 'Pathology', 'Ophthalmology', 'Medicine'])
})

test('year and subject groups use the remaining curriculum levels as tie-breakers', () => {
  const inputs = [question('Biochemistry', 'BC1.1'), question('Anatomy', 'AN2.1'), question('Anatomy', 'AN1.1')]
  for (const field of ['years', 'subjects']) assert.deepEqual(sorted(inputs, field), [inputs[2], inputs[1], inputs[0]])
})

test('topics follow topic numbers and remain within subject groups', () => {
  const rows = [
    { subject: 'Anatomy', topic: 'Z topic', topicNumber: 1, code: 'AN1.1' },
    { subject: 'Anatomy', topic: 'A topic', topicNumber: 10, code: 'AN10.1' },
    { subject: 'Physiology', topic: 'Z topic', topicNumber: 1, code: 'PY1.1' },
  ]
  const catalogue = buildCurriculumSortIndex(rows)
  const inputs = [question('Physiology', '', 'Z topic'), question('Anatomy', '', 'A topic'), question('Anatomy', '', 'Z topic')]
  assert.deepEqual(sorted(inputs, 'topics', 'asc', catalogue), [inputs[2], inputs[1], inputs[0]])
})

test('codes and competencies use numerical components and put unmapped values last', () => {
  const rows = ['AN1.2', 'AN1.10', 'AN2.1'].map(code => ({ subject: 'Anatomy', topic: 'Topic', topicNumber: Number(code.match(/\d+/)[0]), code }))
  const catalogue = buildCurriculumSortIndex(rows)
  const inputs = ['AN1.10', 'AN2.1', 'AN1.2', 'AN99.99', 'MED-A01-00001'].map(code => question('Anatomy', code))
  const original = [...inputs]
  for (const field of ['codes', 'competencies']) {
    assert.deepEqual(sorted(inputs, field, 'asc', catalogue), [inputs[2], inputs[0], inputs[1], inputs[3], inputs[4]])
    assert.deepEqual(sorted(inputs, field, 'desc', catalogue), [inputs[1], inputs[0], inputs[2], inputs[3], inputs[4]])
  }
  assert.deepEqual(inputs, original)
})

test('legacy aliases, spaced codes, numeric-only codes and missing subjects resolve', () => {
  assert.equal(getSortCompetencyCode('bc 14.1 Describe metabolism'), 'BC14.1')
  assert.equal(getSortCompetencyCode('GM 19. 9 Describe symptoms'), 'GM19.9')
  assert.equal(getSortCompetencyCode('PA.29.1 Description'), 'PA29.1')
  assert.equal(getSortCompetencyCode('FM2:12 Description'), 'FM2.12')
  assert.deepEqual(getQuestionCurriculumSortRecord(question('General Medicine', 'GM 1.1'), index), getQuestionCurriculumSortRecord(question('Internal Medicine', 'IM1.1'), index))
  assert.deepEqual(getQuestionCurriculumSortRecord(question('Anatomy', '1.1'), index), getQuestionCurriculumSortRecord(question('', 'AN1.1'), index))
  assert.equal(getQuestionCurriculumSortRecord(question('Obstetrics & Gynaecology.', 'OG1.1'), index).ranks[0], 4)
})

test('multi-competency questions use the earliest mapping without changing tags', () => {
  const q = { subject: 'Human Anatomy', competencies: ['AN2.1', 'AN1.1'] }
  assert.deepEqual(getQuestionCurriculumSortRecord(q, index), getQuestionCurriculumSortRecord(question('Anatomy', 'AN1.1'), index))
  assert.deepEqual(q.competencies, ['AN2.1', 'AN1.1'])
})

test('unknown subjects stay last in both directions and equal ranks stay stable', () => {
  const inputs = [question('Custom subject'), question('Anatomy', 'AN1.1'), question('Anatomy', 'AN1.1')]
  for (const field of ['years', 'subjects', 'topics', 'competencies', 'codes']) {
    for (const direction of ['asc', 'desc']) assert.deepEqual(sorted(inputs, field, direction), [inputs[1], inputs[2], inputs[0]])
  }
  assert.equal(sortBankQuestions(inputs, new Map(), { field: '' }), inputs)
})

test('every catalogue subject has a professional-phase and subject mapping', () => {
  for (const subject of new Set(corelationRatingRows.map(r => r.subject))) {
    const record = getQuestionCurriculumSortRecord(question(subject), index)
    assert.ok(record.ranks.slice(0, 2).every(Number.isFinite), subject)
  }
})

test('incomplete or ambiguous catalogue codes remain unmapped for code sorting', () => {
  for (const [subject, code] of [['Microbiology', 'MI 8.'], ['Orthopedics', 'OR2. 2.9'], ['Anaesthesiology', 'ASS.4']]) {
    assert.equal(getQuestionCurriculumSortRecord(question(subject, code), index).ranks[3], null)
  }
})
