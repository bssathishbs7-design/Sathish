import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBlueprintQuestionRequirements,
  getBlueprintQuestionMatch,
  summarizeBlueprintQuestionProgress,
} from './blueprintQuestionProgress.js'

const requirements = createBlueprintQuestionRequirements({
  competencyCodes: ['AN1.1', 'AN1.2'],
  columnQuestionCounts: { mcqLot: 2, mcqHot: 1, laqLot: 0, laqHot: 0, saqLot: 1, saqHot: 1 },
})

test('matches a question only when competency, type, and cognition lane are required', () => {
  assert.equal(getBlueprintQuestionMatch({
    type: 'MCQ',
    thinkingLevel: 'LoT',
    competencies: ['AN1.1 Describe anatomy'],
  }, requirements).isRelevant, true)

  assert.equal(getBlueprintQuestionMatch({
    type: 'LAQs',
    thinkingLevel: 'LoT',
    competencies: ['AN1.1 Describe anatomy'],
  }, requirements).isRelevant, false)

  assert.equal(getBlueprintQuestionMatch({
    type: 'MCQ',
    thinkingLevel: 'LoT',
    competencies: ['AN9.9 Outside blueprint'],
  }, requirements).isRelevant, false)
})

test('progress is capped by each blueprint question lane', () => {
  const questions = [
    { type: 'MCQ', thinkingLevel: 'LoT', competencies: ['AN1.1'] },
    { type: 'MCQ', thinkingLevel: 'LoT', competencies: ['AN1.2'] },
    { type: 'MCQ', thinkingLevel: 'LoT', competencies: ['AN1.1'] },
    { type: 'MCQ', thinkingLevel: 'HoT', competencies: ['AN1.1'] },
    { type: 'SAQs', thinkingLevel: 'LoT', competencies: ['AN1.2'] },
    { type: 'SAQs', thinkingLevel: 'HoT', competencies: ['AN1.2'] },
  ]

  assert.deepEqual(summarizeBlueprintQuestionProgress(questions, requirements), {
    matched: 5,
    target: 5,
    complete: true,
    usedByColumn: { mcqLot: 2, mcqHot: 1, saqLot: 1, saqHot: 1 },
    usedByCell: {
      'an1.1:mcqlot': 1,
      'an1.2:mcqlot': 1,
      'an1.1:mcqhot': 1,
      'an1.2:saqlot': 1,
      'an1.2:saqhot': 1,
    },
  })
})
