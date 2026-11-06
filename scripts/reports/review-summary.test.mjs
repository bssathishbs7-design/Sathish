import test from 'node:test';
import assert from 'node:assert/strict';
import { consolidateReview } from './review-summary.mjs';
import { rolesForRequest } from './team-hierarchy.mjs';
import { runModuleTests } from './review-testing.mjs';
test('review always selects eleven roles even when optional AI flag is false',()=>{
  assert.equal(rolesForRequest({kind:'review',includeAI:false}).length,11);
  assert.equal(rolesForRequest({includeAI:false}).length,10);
});
test('synthesis preserves concerns, unique IDs, questions and conflicting assessments',()=>{
  const finding={title:'Missing validation',area:'Functionality',classification:'Potential issue',severity:'Medium',evidence:'Source A',recommendation:'Check input',existingFindingId:''};
  const first={summary:'Specialist',questions:'Confirm baseline',limitations:'Source only',pages:[{pageId:'p',functionality:'Potential issue',design:'Needs verification',findings:[finding]}]};
  const last={summary:'Executive',questions:'',limitations:'Source only',pages:[{pageId:'p',functionality:'No issue identified',design:'Needs verification',findings:[]}]};
  const result=consolidateReview([{worker:'BA',result:first},{worker:'QA',result:first},{worker:'Executive',result:last}]);
  assert.equal(result.pages[0].findings.length,1);assert.equal(result.pages[0].findings[0].contributors.length,2);
  assert.equal(result.pages[0].functionality,'Potential issue');assert.equal(result.questions,'Confirm baseline');assert.equal(result.disagreements.length,1);
  assert.equal(last.pages[0].findings.length,0);
});
test('unmapped modules never receive a verified test pass',async()=>{
  const result=await runModuleTests({root:process.cwd(),moduleId:'requests'});
  assert.equal(result.status,'Pending verification');assert.equal(result.files.length,0);
});
