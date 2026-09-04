import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createBlueprintQuestionRequirements,
  getBlueprintQuestionMarkRowLabel,
  getBlueprintQuestionMatch,
  getBlueprintQuestionRelevanceList,
  resolveBlueprintPreviewQuestionMarks,
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

test('marks surplus MCQ, LAQ, and SAQ questions outside their saved Blueprint cells as unrelated', () => {
  const capacityRequirements = createBlueprintQuestionRequirements({
    competencyCodes: ['AN1.1'],
    columnQuestionCounts: { mcqLot: 1, laqHot: 1, saqLot: 1 },
    cellQuestionCounts: {
      'AN1.1:mcqLot': 1,
      'AN1.1:laqHot': 1,
      'AN1.1:saqLot': 1,
    },
    targetQuestionCount: 3,
  })
  const questions = [
    { type: 'MCQ', thinkingLevel: 'LoT', competencies: ['AN1.1'] },
    { type: 'MCQ', thinkingLevel: 'LoT', competencies: ['AN1.1'] },
    { type: 'Desc Long Answer Questions (LAQs)', thinkingLevel: 'HoT', competencyCode: 'AN1.1' },
    { type: 'Desc Long Answer Questions (LAQs)', thinkingLevel: 'HoT', competencyCode: 'AN1.1' },
    { type: 'Desc Short Answer Questions (SAQs)', thinkingLevel: 'LoT', competency: 'AN1.1' },
    { type: 'Desc Short Answer Questions (SAQs)', thinkingLevel: 'LoT', competency: 'AN1.1' },
  ]

  assert.deepEqual(
    getBlueprintQuestionRelevanceList(questions, capacityRequirements),
    [true, false, true, false, true, false],
  )
})

test('maps MCQ, LAQ, and every SAQ category to its Blueprint mark row', () => {
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'MCQ' }), 'MCQs')
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'Desc Long Answer Questions (LAQs)' }), 'LAQs')
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'Desc Short Answer Questions (SAQs)', questionCategory: 'Direct' }), 'SAQs (Direct)')
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'Descriptive Question', questionCategory: 'Reasoning' }), 'SAQs (Reasoning)')
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'SAQs', questionCategory: 'AETCOM' }), 'SAQs (Aetcom)')
  assert.equal(getBlueprintQuestionMarkRowLabel({ type: 'SAQs', questionCategory: 'Application' }), 'SAQs (Application)')
})

test('uses fixed Blueprint marks only while Blueprint and the saved planner are active', () => {
  const question = { type: 'SAQs', questionCategory: 'Reasoning' }
  const questionTypeDraft = { 'SAQs (Reasoning)': { perQuestionMarks: '5' } }

  assert.equal(resolveBlueprintPreviewQuestionMarks({
    question,
    questionTypeDraft,
    fallbackMarks: 2,
    isBlueprintEnabled: true,
    isPlannerSaved: true,
  }), 5)

  assert.equal(resolveBlueprintPreviewQuestionMarks({
    question,
    questionTypeDraft,
    fallbackMarks: 2,
    isBlueprintEnabled: false,
    isPlannerSaved: true,
  }), 2)

  assert.equal(resolveBlueprintPreviewQuestionMarks({
    question: { type: 'MEQs' },
    questionTypeDraft,
    fallbackMarks: 3,
    isBlueprintEnabled: true,
    isPlannerSaved: true,
  }), 3)
})

test('resolves Blueprint SAQ marks from descriptive section category metadata', () => {
  assert.equal(resolveBlueprintPreviewQuestionMarks({
    question: {
      type: 'Desc Short Answer Questions (SAQs)',
      descriptiveSections: [
        { questionCategory: 'Application', marks: '5' },
      ],
    },
    questionTypeDraft: { 'SAQs (Application)': { perQuestionMarks: '8' } },
    fallbackMarks: 5,
    isBlueprintEnabled: true,
    isPlannerSaved: true,
  }), 8)
})

test('resolves Blueprint SAQ marks when saved planner category labels use variants', () => {
  assert.equal(resolveBlueprintPreviewQuestionMarks({
    question: { type: 'SAQs', questionCategory: 'AETCOM' },
    questionTypeDraft: { 'SAQs (Critical Thinking)': { perQuestionMarks: '8' } },
    fallbackMarks: 5,
    isBlueprintEnabled: true,
    isPlannerSaved: true,
  }), 8)
})
