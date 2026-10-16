import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssessmentAutomation as resolveAutomation, getAssessmentAutomationConfiguration, updateAssessmentAutomation as updateAutomation, describeAssessmentAutomation } from './assessmentAutomation.js'
const connected = { mcqEvaluation:true, descriptiveEvaluation:true, resultPublishing:true }
const getAssessmentAutomation = (setup, types) => resolveAutomation(setup, types, connected)
const updateAssessmentAutomation = (setup, field, value) => updateAutomation(setup, field, value)
for (const supervisionType of ['Practice Exam','Proctored Exam']) {
  test(supervisionType + ': all answer and automation combinations', () => {
    for (const type of ['mcq','descriptive']) for (const mode of ['Answer Input','Read-Only']) for (const evaluation of ['Yes','No']) for (const publish of ['On','Off']) {
      const setup={examDeliveryMode:'Online',supervisionType,[type+'DisplayType']:mode,[type+'AutoEvaluation']:evaluation,[type+'AutoPublish']:publish}
      const result=getAssessmentAutomation(setup,{hasMcq:type==='mcq',hasDescriptive:type==='descriptive'})
      assert.equal(result.rows.length,1)
      assert.equal(result.rows[0].evaluation,mode==='Answer Input'&&(type==='mcq'||evaluation==='Yes'))
      assert.equal(result.rows[0].publish,mode==='Answer Input'&&(type==='mcq'||evaluation==='Yes')&&publish==='On')
    }
  })
}
test('Hybrid requires both sections to permit automatic publishing',()=>{
  const setup={mcqDisplayType:'Answer Input',descriptiveDisplayType:'Answer Input',mcqAutoEvaluation:'Yes',descriptiveAutoEvaluation:'Yes',mcqAutoPublish:'On',descriptiveAutoPublish:'On'}
  assert.equal(getAssessmentAutomation(setup,{hasMcq:true,hasDescriptive:true}).canAutoPublishCombined,true)
  for(const mode of ['mcqDisplayType','descriptiveDisplayType']) assert.equal(getAssessmentAutomation({...setup,[mode]:'Read-Only'},{hasMcq:true,hasDescriptive:true}).canAutoPublishCombined,false)
})
test('evaluation No resets auto publish without changing the other type',()=>{
  const setup={mcqAutoEvaluation:'Yes',mcqAutoPublish:'On',descriptiveAutoEvaluation:'Yes',descriptiveAutoPublish:'On'}
  const next=updateAssessmentAutomation(setup,'descriptiveAutoEvaluation','No')
  assert.equal(next.descriptiveAutoPublish,'Off'); assert.equal(next.mcqAutoPublish,'On'); assert.equal(setup.descriptiveAutoPublish,'On')
  assert.equal(updateAssessmentAutomation(next,'descriptiveAutoPublish','On').descriptiveAutoPublish,'Off')
})
test('offline retains manual workflows',()=>{assert.equal(getAssessmentAutomation({examDeliveryMode:'Offline',mcqAutoEvaluation:'Yes',mcqAutoPublish:'On'},{hasMcq:true}).rows[0].enabled,false)})

test('connected rule-based executors permit configured automatic evaluation', () => {
 const setup={mcqDisplayType:'Answer Input',descriptiveDisplayType:'Answer Input',mcqAutoEvaluation:'Yes',descriptiveAutoEvaluation:'Yes',mcqAutoPublish:'On',descriptiveAutoPublish:'On'}
 const result=resolveAutomation(setup,{hasMcq:true,hasDescriptive:true})
 assert.equal(result.rows[0].evaluation,true)
 assert.equal(result.rows[1].evaluation,true)
 assert.equal(result.canAutoPublishCombined,true)
 assert.equal(updateAutomation(setup,'descriptiveAutoEvaluation','Yes').descriptiveAutoEvaluation,'Yes')
 assert.equal(updateAutomation(setup,'mcqAutoPublish','On').mcqAutoPublish,'On')
 assert.match(describeAssessmentAutomation(result),/MCQ answers are evaluated automatically/)
 assert.match(describeAssessmentAutomation(result),/Descriptive answers are evaluated automatically/)
})
test('read-only and supervision changes preserve previous valid preferences', () => {
 const original={examDeliveryMode:'Online',mcqDisplayType:'Answer Input',mcqAutoEvaluation:'Yes',mcqAutoPublish:'On'}
 let next=updateAssessmentAutomation(original,'mcqDisplayType','Read-Only')
 assert.equal(getAssessmentAutomation(next,{hasMcq:true}).rows[0].publish,false)
 assert.equal(next.mcqAutoPublish,'On')
 next=updateAssessmentAutomation(next,'supervisionType','Practice Exam')
 next=updateAssessmentAutomation(next,'mcqDisplayType','Answer Input')
 assert.equal(getAssessmentAutomation(next,{hasMcq:true}).rows[0].publish,true)
 assert.deepEqual(original,{examDeliveryMode:'Online',mcqDisplayType:'Answer Input',mcqAutoEvaluation:'Yes',mcqAutoPublish:'On'})
})
test('mixed Hybrid publishing stays manual; single types use their own policy', () => {
 const setup={mcqDisplayType:'Answer Input',descriptiveDisplayType:'Answer Input',mcqAutoEvaluation:'Yes',descriptiveAutoEvaluation:'Yes',mcqAutoPublish:'On',descriptiveAutoPublish:'Off'}
 assert.equal(getAssessmentAutomation(setup,{hasMcq:true,hasDescriptive:true}).canAutoPublishCombined,false)
 assert.equal(getAssessmentAutomation(setup,{hasMcq:true}).canAutoPublishCombined,true)
 assert.equal(getAssessmentAutomation(setup,{hasDescriptive:true}).canAutoPublishCombined,false)
 assert.match(describeAssessmentAutomation(getAssessmentAutomation(setup,{hasMcq:true,hasDescriptive:true})),/both sections are evaluated/)
})

test('configuration and execution permit the connected descriptive grader', () => {
 const setup={examDeliveryMode:'Online',descriptiveDisplayType:'Answer Input',descriptiveAutoEvaluation:'Yes',descriptiveAutoPublish:'On'}
 assert.equal(getAssessmentAutomationConfiguration(setup,{hasDescriptive:true}).canAutoPublishCombined,true)
 assert.equal(resolveAutomation(setup,{hasDescriptive:true}).rows[0].evaluation,true)
 assert.equal(resolveAutomation(setup,{hasDescriptive:true}).canAutoPublishCombined,true)
 const manual=updateAutomation(setup,'descriptiveAutoEvaluation','No')
 assert.equal(updateAutomation(manual,'descriptiveAutoEvaluation','Yes').descriptiveAutoPublish,'Off')
})
test('legacy MCQ manual choice cannot disable online automatic evaluation', () => {
 const setup={examDeliveryMode:'Online',mcqDisplayType:'Answer Input',mcqAutoEvaluation:'No',mcqAutoPublish:'On'}
 assert.equal(resolveAutomation(setup,{hasMcq:true}).rows[0].evaluation,true)
 assert.equal(updateAutomation(setup,'mcqAutoEvaluation','No').mcqAutoEvaluation,'Yes')
 assert.equal(resolveAutomation({...setup,mcqDisplayType:'Read-Only'},{hasMcq:true}).rows[0].evaluation,false)
})

test('Hybrid shared publishing updates both sections and cannot be enabled when ineligible', () => {
 const types={hasMcq:true,hasDescriptive:true}
 const setup={examDeliveryMode:'Online',mcqDisplayType:'Answer Input',descriptiveDisplayType:'Answer Input',descriptiveAutoEvaluation:'Yes',mcqAutoPublish:'Off',descriptiveAutoPublish:'Off'}
 const on=updateAutomation(setup,'hybridAutoPublish','On',types)
 assert.equal(on.mcqAutoPublish,'On'); assert.equal(on.descriptiveAutoPublish,'On')
 assert.equal('hybridAutoPublish' in on,false)
 for (const [field,value,restore] of [['mcqDisplayType','Read-Only','Answer Input'],['descriptiveDisplayType','Read-Only','Answer Input'],['descriptiveAutoEvaluation','No','Yes'],['examDeliveryMode','Offline','Online']]) {
  const off=updateAutomation(on,field,value,types)
  assert.equal(off.mcqAutoPublish,'Off'); assert.equal(off.descriptiveAutoPublish,'Off')
  assert.equal(updateAutomation(off,'hybridAutoPublish','On',types).mcqAutoPublish,'Off')
  assert.equal(getAssessmentAutomationConfiguration(updateAutomation(off,field,restore,types),types).canAutoPublishCombined,false)
 }
 const off=updateAutomation(on,'hybridAutoPublish','Off',types)
 assert.equal(off.mcqAutoPublish,'Off'); assert.equal(off.descriptiveAutoPublish,'Off')
 assert.equal(setup.mcqAutoPublish,'Off')
})
