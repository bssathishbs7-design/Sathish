/** Recreated demo templates, not copies of a faculty member's saved work.
 * @returns {Array<import('./blueprintTemplates').BlueprintTemplate>} Independent sample records.
 */
export function createBlueprintTemplateSamples() {
  const row = (marks, total, hot, lot, cognitionMode) => ({ perQuestionMarks: String(marks), totalMarks: String(total), hotQuestions: String(hot), lotQuestions: String(lot), ...(cognitionMode ? { cognitionMode } : {}) })
  return [
    { id: 'clinical-phase', name: 'Clinical Phase II / Final MBBS', total: 100, lot: 30, mcqLot: 10 },
    { id: 'para-clinical', name: 'Para-clinical / Second MBBS', total: 100, lot: 40, mcqLot: 20 },
    { id: 'sathish', name: 'Sathish', total: 100, lot: 25, mcqLot: 5 },
    { id: 'test-mkvmc', name: 'TEST MKVMC', total: 70, lot: 60, mcqLot: 17 },
  ].map(sample => {
    const short = sample.total === 70
    const laqCount = short ? 1 : 2
    return {
      id: 'sample-blueprint-' + sample.id,
      name: sample.name,
      createdAt: '2026-10-23T00:00:00.000Z',
      createdBy: 'Sample Faculty',
      cognition: { lot: String(sample.lot), hot: String(100 - sample.lot) },
      totalMarks: sample.total,
      breakdown: {
        MCQs: row(1, 20, 20 - sample.mcqLot, sample.mcqLot),
        LAQs: row(10, laqCount * 10, laqCount, 0),
        'SAQs (Direct)': row(5, short ? 25 : 20, 0, short ? 5 : 4, 'lot'),
        'SAQs (Reasoning)': row(5, short ? 5 : 20, short ? 1 : 4, 0, 'hot'),
        'SAQs (Aetcom)': row(5, 5, 1, 0, 'hot'),
        'SAQs (Application)': row(5, short ? 5 : 15, short ? 1 : 3, 0, 'hot'),
      },
      laqParts: Array.from({ length: laqCount }, () => ({ splitCount: '1', splits: [{ marks: '10', level: 'hot' }] })),
    }
  })
}
