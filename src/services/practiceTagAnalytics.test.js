import test from 'node:test'
import assert from 'node:assert/strict'
import { getPracticeTagSnapshot, buildPracticeTagAnalytics, resolvePracticeTagSnapshot, completePracticeTagAnalytics } from './practiceTagAnalytics.js'
import { buildCompetencyAnalytics } from './competencyAnalytics.js'

test('coverage uses explicit tags and retains unclassified questions in denominator', () => {
  const snapshot = getPracticeTagSnapshot({ questions: [{ thinkingLevel: 'HoT - Higher Order Thinking', cognitiveLevel: 'Apply' }, { type: 'MCQ', questionCategory: 'Direct Comprehension' }] })
  const data = buildPracticeTagAnalytics([snapshot])
  assert.equal(data.thinkingLevel.items[0].percentage, 50)
  assert.equal(data.thinkingLevel.unclassified, 1)
  assert.equal(data.cognitiveFunction.unclassified, 2)
})
test('duplicate aliases count once; contradictory thinking labels remain unclassified', () => {
  const data = buildPracticeTagAnalytics([getPracticeTagSnapshot({ questions: [{ cognitiveLevel: ['Analyse', 'Analyze'], thinkingLevel: ['HoT', 'LoT'], skillFocus: ['Diagnosis', 'Management'] }] })])
  assert.equal(data.cognitiveLevel.items.find(item => item.label === 'Analyse').value, 1)
  assert.equal(data.thinkingLevel.unclassified, 1)
  assert.equal(data.skillFocus.items.find(item => item.label === 'Management').value, 1)
})
test('retakes retain snapshots and unfinished records are excluded', () => {
  const snapshot = getPracticeTagSnapshot({ questions: [{ thinking: 'LoT', skillFocus: 'Prevention', cognitiveLevel: 'Create' }] })
  const data = buildCompetencyAnalytics({ practiceSessions: [{ questions: [{ thinking: 'HoT' }], practiceAttemptHistory: [{ tagSnapshot: snapshot }, { status: 'Expired', tagSnapshot: snapshot }, { status: 'In Progress', tagSnapshot: snapshot }] }] }).tagAnalytics
  assert.equal(data.thinkingLevel.total, 2)
  assert.equal(data.thinkingLevel.items[1].value, 2)
  assert.equal(data.skillFocus.items.find(item => item.label === 'Prevention').value, 2)
  assert.equal(data.cognitiveLevel.items.find(item => item.label === 'Create').value, 2)
})
test('missing legacy question data is unclassified and empty analytics has no sample records', () => {
  const data = buildPracticeTagAnalytics([getPracticeTagSnapshot({ mcq: 3, saqs: 2 })])
  assert.equal(data.skillFocus.total, 5)
  assert.equal(data.skillFocus.unclassified, 5)
  assert.equal(buildCompetencyAnalytics({}).tagAnalytics.skillFocus.total, 0)
})


test('descriptive child tags are recovered without counting parts as extra questions', () => {
  const snapshot = getPracticeTagSnapshot({ questions: [{ descriptiveSections: [{ children: [
    { cognitiveLevel: 'Apply', thinkingLevel: 'HoT', cognitiveFunction: 'Pattern Recognition', skillFocus: 'Diagnosis' },
    { cognitiveLevel: 'Apply', thinkingLevel: 'HoT', cognitiveFunction: 'Pattern Recognition', skillFocus: 'Diagnosis' },
  ] }] }] })
  assert.equal(snapshot.total, 1)
  for (const group of Object.values(snapshot.groups)) {
    assert.equal(group.unclassified, 0)
    assert.equal(Object.values(group.counts).reduce((sum, count) => sum + count, 0), 1)
  }
})
test('legacy empty snapshots recover from original bank IDs and populated historical dimensions stay intact', () => {
  const saved = getPracticeTagSnapshot({ questions: [{ thinkingLevel: 'LoT' }] })
  const card = { practiceSessions: [{ questions: [{ id: 'shared', originalQuestionId: 'original', cognitiveLevel: '' }], practiceAttemptHistory: [{ tagSnapshot: saved }] }] }
  const result = buildCompetencyAnalytics(card, [{ id: 'original', cognitiveLevel: 'Apply', thinkingLevel: 'HoT', cognitiveFunction: 'Working Memory', skillFocus: 'Treatment' }]).tagAnalytics
  assert.equal(result.cognitiveLevel.items.find(item => item.label === 'Apply').value, 1)
  assert.equal(result.thinkingLevel.items[1].value, 1)
  assert.equal(result.skillFocus.unclassified, 0)
})
test('missing tags remain unclassified and different-sized attempts are never rewritten', () => {
  const saved = getPracticeTagSnapshot({ mcq: 9 })
  assert.equal(resolvePracticeTagSnapshot(saved, { questions: [{ thinkingLevel: 'HoT' }] }), saved)
  assert.equal(resolvePracticeTagSnapshot(saved, { mcq: 9 }).groups.thinkingLevel.unclassified, 9)
})


test('all thirteen skill KPIs are present even without tagged questions', () => {
  const group = buildPracticeTagAnalytics([]).skillFocus
  assert.equal(group.items.length, 13)
  for (const label of ['Prevention', 'Knowledge', 'Data Interpretation', 'Risk Assessment', 'Ethics', 'Communication', 'Patient Safety', 'Regulations or Protocols']) {
    assert.deepEqual(group.items.find(item => item.label === label), { label, value: 0, percentage: 0 })
  }
})
test('additional skill aliases and older saved labels use canonical KPI names', () => {
  const snapshot = getPracticeTagSnapshot({ questions: [{ skillFocus: ['Professional communication', 'Protocols'] }] })
  snapshot.groups.skillFocus.counts['Data interpretation'] = 1
  const group = buildPracticeTagAnalytics([snapshot]).skillFocus
  assert.equal(group.items.length, 13)
  for (const label of ['Communication', 'Regulations or Protocols', 'Data Interpretation']) assert.equal(group.items.find(item => item.label === label).value, 1)
})


test('older five-category UI payloads show all thirteen KPIs without losing existing results', () => {
  const old = { skillFocus: { total: 9, unclassified: 3, items: [
    { label: 'Diagnosis', value: 6, percentage: 67 },
    ...['Investigation', 'Treatment', 'Management', 'Prognosis'].map(label => ({ label, value: 0, percentage: 0 })),
  ] } }
  const result = completePracticeTagAnalytics(old)
  assert.equal(result.skillFocus.items.length, 13)
  assert.equal(result.skillFocus.items[0].value, 6)
  assert.equal(result.skillFocus.items[0].percentage, 67)
  assert.equal(result.skillFocus.unclassified, 3)
  assert.equal(old.skillFocus.items.length, 5)
})
