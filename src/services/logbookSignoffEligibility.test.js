import test from 'node:test'
import assert from 'node:assert/strict'
import { signoffEligibility } from './logbookPolicy.js'
test('sign-off prerequisites require approval and block outstanding work without imposing coverage targets', () => {
 assert.equal(signoffEligibility([]).allowed, false)
 assert.equal(signoffEligibility([{status:'Returned'}]).allowed, false)
 for (const status of ['Pending','To do']) assert.equal(signoffEligibility([{status:'Approved'},{status}]).allowed, false)
 assert.equal(signoffEligibility([{status:'Approved'},{status:'Draft'},{status:'Returned'}]).allowed, true)
 assert.match(signoffEligibility([]).reason, /approved entry/)
 assert.match(signoffEligibility([{status:'Pending'}]).reason, /Clear pending/)
})
