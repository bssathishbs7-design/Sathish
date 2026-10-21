import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssessmentConfigurationStatus as status, DEFAULT_ATTAINMENT_LEVELS, DEFAULT_THINKING_THRESHOLDS } from './assessmentConfigurationStatus.js'

test('instructions require enabled, meaningful saved content', () => {
  assert.equal(status({provideStudentInstructions:'No',studentInstructions:'Sample text'}).instructions,false)
  assert.equal(status({provideStudentInstructions:'Yes',studentInstructions:'<p>&nbsp;</p>'}).instructions,false)
  assert.equal(status({provideStudentInstructions:'Yes',studentInstructions:'<p>Answer all questions.</p>'}).instructions,true)
})
test('missing and numerically equivalent defaults stay Default', () => {
  assert.equal(status({}).thresholdChanged,false)
  const attainmentLevels = [...DEFAULT_ATTAINMENT_LEVELS].reverse().map(row => ({...row,id:'different',minPercentage:Number(row.minPercentage),maxPercentage:Number(row.maxPercentage),level:Number(row.level)}))
  assert.equal(status({...DEFAULT_THINKING_THRESHOLDS,lotThreshold:70,attainmentLevels}).thresholdChanged,false)
})
test('mode, values, and attainment changes are detected; reset restores Default', () => {
  for (const change of [{thinkingThresholdMode:'blooms'},{lotThreshold:'71'},{applyThreshold:'54'},{hotThreshold:''},{attainmentLevels:[]},{attainmentLevels:DEFAULT_ATTAINMENT_LEVELS.map((row,i)=>i===0?{...row,maxPercentage:'29'}:row)}]) assert.equal(status(change).thresholdChanged,true)
  assert.equal(status({...DEFAULT_THINKING_THRESHOLDS,attainmentLevels:DEFAULT_ATTAINMENT_LEVELS}).thresholdChanged,false)
})
