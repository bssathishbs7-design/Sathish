import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentStudentOptions, getAssessmentStudentId, selectAssessmentStudent } from './assessmentStudentIdentity.js'

test('demo identity comes from assigned directory rosters and stays stable for attempts/results', () => {
  const originalLocal = globalThis.localStorage, originalSession = globalThis.sessionStorage
  const session = new Map()
  const records = [{ setup: { students: [{ id: 'MC2026003', name: 'Rajkumar' }] } }, { students: [{ id: 'MC2026003', name: 'Rajkumar' }, { id: 'MC2026004', name: 'Sathish' }] }]
  try {
    globalThis.localStorage = { getItem: () => JSON.stringify(records) }
    globalThis.sessionStorage = { getItem: key => session.get(key), setItem: (key, value) => session.set(key, value) }
    assert.equal(assessmentStudentOptions(records).length, 2)
    assert.equal(getAssessmentStudentId(), 'MC2026003')
    selectAssessmentStudent('MC2026004')
    assert.equal(getAssessmentStudentId(), 'MC2026004')
    globalThis.localStorage = { getItem: () => '[]' }
    assert.equal(getAssessmentStudentId(), 'MC2026004')
  } finally { globalThis.localStorage = originalLocal; globalThis.sessionStorage = originalSession }
})
