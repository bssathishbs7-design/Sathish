import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssessmentPaperLogo } from './assessmentPaperLogo.js'

test('published logo wins over later saved edits', () => {
  assert.equal(getAssessmentPaperLogo({ setup: { logoPreview: 'published' } }, null), 'published')
})

test('recovers matching setup and draft logos without borrowing another assessment logo', () => {
  const storage = { getItem: key => JSON.stringify(key === 'vx-create-assessment-setup'
    ? { assessmentId: 'a', logoPreview: 'setup-logo' }
    : [{ id: 'b', setup: { assessmentId: 'b', logoPreview: 'draft-logo' } }]) }
  assert.equal(getAssessmentPaperLogo({ id: 'a' }, storage), 'setup-logo')
  assert.equal(getAssessmentPaperLogo({ id: 'b' }, storage), 'draft-logo')
  assert.equal(getAssessmentPaperLogo({ id: 'c' }, storage), '')
  assert.equal(getAssessmentPaperLogo({}, storage), '')
})
