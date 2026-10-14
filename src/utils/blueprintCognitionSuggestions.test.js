import test from 'node:test'
import assert from 'node:assert/strict'
import { getCognitionSuggestions, applyCognitionSuggestion } from './blueprintCognitionSuggestions.js'

const row = (label, unit, hot, lot, cognitionMode = 'both') => ({ label, perQuestionMarks: String(unit), totalMarks: String(unit * (hot + lot)), totalQuestions: hot + lot, hotQuestions: hot, lotQuestions: lot, hotMarks: unit * hot, lotMarks: unit * lot, cognitionMode, hasValidQuestionTotal: true })
const sample = () => [row('MCQs', 1, 15, 5), { ...row('LAQs', 5, 1, 1), perQuestionMarks: '10', totalQuestions: 1, usesLaqSplit: true }, row('SAQs (Direct)', 2, 4, 1), row('SAQs (Reasoning)', 2, 4, 1)]

test('36/38 example offers exact Direct and Reasoning fixes, excludes empty rows and LAQs', () => {
  const rows = [...sample(), { label: 'SAQs (Aetcom)', perQuestionMarks: '', totalMarks: '' }]
  const result = getCognitionSuggestions(rows, { totalMarks: 50, hotMarks: 38 })
  for (const label of ['SAQs (Direct)', 'SAQs (Reasoning)']) {
    assert.ok(result.options.some(option => option.changes.length === 1 && option.changes[0].label === label && option.changes[0].delta === 1))
  }
  for (const option of result.options) {
    assert.ok(option.changes.every(item => !['LAQs', 'SAQs (Aetcom)'].includes(item.label)))
    assert.equal(option.changes.reduce((sum, item) => sum + Number(rows.find(row => row.label === item.label).perQuestionMarks) * item.delta, 0), 2)
  }
})

test('70/75 example offers a five-mark question transfer', () => {
  const rows = [row('MCQs', 1, 15, 5), row('SAQs (Direct)', 5, 4, 1), row('SAQs (Reasoning)', 5, 3, 2), row('SAQs (Aetcom)', 5, 1, 1), row('SAQs (Application)', 5, 3, 1)]
  const result = getCognitionSuggestions(rows, { totalMarks: 100, hotMarks: 75 })
  assert.equal(result.options.filter(option => option.changes.length === 1).length, 5)
  assert.ok(result.options.some(option => option.changes[0].label === 'SAQs (Direct)' && option.changes[0].count === 1))
})

test('finds a combination with opposite directions when no single-row fix exists', () => {
  const rows = [row('MCQs', 3, 0, 1), row('SAQs (Direct)', 2, 1, 0)]
  const result = getCognitionSuggestions(rows, { totalMarks: 5, hotMarks: 3 })
  assert.equal(result.options.length, 1)
  assert.deepEqual(result.options[0].changes.map(item => item.delta), [1, -1])
})

test('refuses partial totals, invalid rows and already matched totals', () => {
  assert.equal(getCognitionSuggestions(sample(), { totalMarks: 60, hotMarks: 38 }), null)
  assert.equal(getCognitionSuggestions(sample(), { totalMarks: 50, hotMarks: 36 }), null)
  assert.equal(getCognitionSuggestions([...sample(), { label: 'SAQs (Aetcom)', perQuestionMarks: '5', totalMarks: '' }], { totalMarks: 50, hotMarks: 38 }), null)
  const result = getCognitionSuggestions([row('SAQs (Direct)', 2, 0, 2, 'lot')], { totalMarks: 4, hotMarks: 1 })
  assert.deepEqual(result.options, [])
  assert.ok(result.message)
})

test('61/78 example offers MCQ and LoT-only Reasoning transfers without changing data before Apply', () => {
  const rows = [row('MCQs', 1, 16, 4), row('SAQs (Direct)', 5, 4, 1), row('SAQs (Reasoning)', 5, 0, 5, 'lot'), row('SAQs (Aetcom)', 5, 5, 0, 'hot'), row('SAQs (Application)', 5, 0, 1, 'lot')]
  const target = { totalMarks: 100, hotMarks: 78 }
  const draft = Object.fromEntries(rows.map(item => [item.label, { ...item }]))
  const before = structuredClone(draft)
  const originalRows = structuredClone(rows)
  const options = getCognitionSuggestions(rows, target).options
  const option = options.find(item => item.changes.length === 2
    && item.changes.some(change => change.label === 'MCQs' && change.delta === 2)
    && item.changes.some(change => change.label === 'SAQs (Reasoning)' && change.delta === 3))
  assert.ok(option)
  assert.deepEqual(rows, originalRows)
  assert.deepEqual(draft, before)
  const next = applyCognitionSuggestion(draft, rows, target, option.id)
  assert.equal(next['SAQs (Reasoning)'].cognitionMode, 'both')
  assert.equal(next['SAQs (Reasoning)'].hotQuestions, '3')
  assert.equal(next['SAQs (Reasoning)'].lotQuestions, '2')
  assert.equal(next.MCQs.hotQuestions, '18')
  assert.equal(next.MCQs.lotQuestions, '2')
  assert.equal(next['SAQs (Aetcom)'].cognitionMode, 'hot')
  assert.equal(next['SAQs (Application)'].cognitionMode, 'lot')
  assert.equal(Object.values(next).reduce((sum, item) => sum + Number(item.hotMarks), 0), 78)
  assert.equal(Object.values(next).reduce((sum, item) => sum + Number(item.lotMarks), 0), 22)
  for (const item of rows) assert.equal(next[item.label].totalMarks, item.totalMarks)
  assert.deepEqual(draft, before)
})

test('single-level SAQs support transfers in both directions and update their mode only on Apply', () => {
  for (const [mode, hot, lot, targetHot, expectedMode] of [
    ['lot', 0, 2, 5, 'both'], ['hot', 2, 0, 5, 'both'],
    ['lot', 0, 2, 10, 'hot'], ['hot', 2, 0, 0, 'lot'],
  ]) {
    const rows = [row('SAQs (Direct)', 5, hot, lot, mode)]
    const target = { totalMarks: 10, hotMarks: targetHot }
    const draft = { 'SAQs (Direct)': { ...rows[0] } }
    const option = getCognitionSuggestions(rows, target).options[0]
    assert.ok(option)
    assert.equal(draft['SAQs (Direct)'].cognitionMode, mode)
    const next = applyCognitionSuggestion(draft, rows, target, option.id)
    assert.equal(next['SAQs (Direct)'].cognitionMode, expectedMode)
    assert.equal(Number(next['SAQs (Direct)'].hotMarks), targetHot)
    assert.equal(Number(next['SAQs (Direct)'].lotMarks), 10 - targetHot)
  }
})

test('applies atomically, retains totals, other rows and LAQs, and rejects stale cards', () => {
  const rows = sample()
  const target = { totalMarks: 50, hotMarks: 38 }
  const draft = Object.fromEntries(rows.map(row => [row.label, { perQuestionMarks: row.perQuestionMarks, totalMarks: row.totalMarks, cognitionMode: row.cognitionMode }]))
  const before = structuredClone(draft)
  const option = getCognitionSuggestions(rows, target).options.find(option => option.changes.length === 1 && option.changes[0].label === 'SAQs (Direct)')
  const next = applyCognitionSuggestion(draft, rows, target, option.id)
  assert.deepEqual(draft, before)
  assert.equal(next['SAQs (Direct)'].hotQuestions, '5')
  assert.equal(next['SAQs (Direct)'].lotQuestions, '0')
  assert.equal(next['SAQs (Direct)'].cognitionMode, 'hot')
  assert.equal(next['SAQs (Reasoning)'].cognitionMode, 'both')
  assert.equal(next['SAQs (Reasoning)'].hotQuestions, '4')
  assert.strictEqual(next.LAQs, draft.LAQs)
  for (const row of rows) assert.equal(next[row.label].totalMarks, draft[row.label].totalMarks)
  assert.equal(applyCognitionSuggestion(draft, rows, { ...target, hotMarks: 37 }, option.id), null)
  assert.equal(applyCognitionSuggestion(draft, [row('MCQs', 1, 14, 6), ...rows.slice(1)], target, option.id), null)
})

test('supports reverse transfers and exact decimal mark units', () => {
  const rows = [row('MCQs', 0.5, 3, 1)]
  const result = getCognitionSuggestions(rows, { totalMarks: 2, hotMarks: 1 })
  assert.equal(result.options[0].changes[0].delta, -1)
  assert.equal(result.options[0].changes[0].from, 'HoT')
})

test('affected SAQ selection reflects all-LoT and mixed outcomes', () => {
  for (const [hotTarget, expectedMode] of [[0, 'lot'], [8, 'both']]) {
    const rows = [row('SAQs (Application)', 2, 3, 2)]
    const target = { totalMarks: 10, hotMarks: hotTarget }
    const draft = { 'SAQs (Application)': { perQuestionMarks: '2', totalMarks: '10', cognitionMode: 'both' } }
    const option = getCognitionSuggestions(rows, target).options[0]
    const next = applyCognitionSuggestion(draft, rows, target, option.id)
    assert.equal(next['SAQs (Application)'].cognitionMode, expectedMode)
    assert.equal(Number(next['SAQs (Application)'].hotQuestions) + Number(next['SAQs (Application)'].lotQuestions), 5)
    assert.equal(next['SAQs (Application)'].totalMarks, '10')
  }
})
