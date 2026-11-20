import test from 'node:test'
import assert from 'node:assert/strict'
import { getBlueprintTemplateStatus } from './blueprintTemplateStatus.js'

const template = { id: 'one' }
const flow = status => ({ status, snapshot: { blueprintDraft: { template: 'one' } } })
test('status follows successful workflow and restores approval status when disabled', () => {
  assert.equal(getBlueprintTemplateStatus(template, 'one', null).label, 'Ready')
  assert.equal(getBlueprintTemplateStatus(template, 'one', flow('Not required')).label, 'Active')
  assert.equal(getBlueprintTemplateStatus(template, '', flow('Not required')).label, 'Ready')
  assert.equal(getBlueprintTemplateStatus(template, 'one', flow('Pending Approval')).label, 'Pending')
  assert.equal(getBlueprintTemplateStatus(template, 'one', flow('Approved')).label, 'Active')
  assert.equal(getBlueprintTemplateStatus(template, '', flow('Approved')).label, 'Approved')
  for (const status of ['Rejected', 'Revision required']) assert.equal(getBlueprintTemplateStatus(template, 'one', flow(status)).label, 'Needs revision')
  assert.equal(getBlueprintTemplateStatus({ id: 'two' }, '', flow('Pending Approval')).label, 'Ready')
})
