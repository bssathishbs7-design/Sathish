const toFiniteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export const roundHalfUp = (value) => {
  const number = toFiniteNumber(value)
  return number >= 0
    ? Math.floor(number + 0.5)
    : Math.ceil(number - 0.5)
}

export const clampPercentage = (value) => Math.min(100, Math.max(0, toFiniteNumber(value)))

export const calculateCognitionMarks = ({
  totalMarks,
  hotPercentage,
}) => {
  const normalizedTotalMarks = Math.max(0, roundHalfUp(totalMarks))
  const normalizedHotPercentage = clampPercentage(hotPercentage)
  const hotMarks = roundHalfUp((normalizedTotalMarks * normalizedHotPercentage) / 100)
  const lotMarks = normalizedTotalMarks - hotMarks

  return {
    totalMarks: normalizedTotalMarks,
    hotMarks,
    lotMarks,
  }
}

export const validateCognitionTotals = ({ totalMarks, hotMarks, lotMarks }) => {
  const normalizedTotalMarks = Math.max(0, roundHalfUp(totalMarks))
  const normalizedHotMarks = Math.max(0, roundHalfUp(hotMarks))
  const normalizedLotMarks = Math.max(0, roundHalfUp(lotMarks))

  return {
    isValid: normalizedHotMarks + normalizedLotMarks === normalizedTotalMarks,
    allocatedMarks: normalizedHotMarks + normalizedLotMarks,
    totalMarks: normalizedTotalMarks,
  }
}

export const allocateWeightedMarks = ({ rows = [], totalMarks = 0 }) => {
  const normalizedTotalMarks = Math.max(0, roundHalfUp(totalMarks))
  const normalizedRows = rows.map((row, index) => ({
    ...row,
    index,
    weight: Math.max(0, toFiniteNumber(row.weight)),
  }))
  const totalWeight = normalizedRows.reduce((total, row) => total + row.weight, 0)

  if (!normalizedTotalMarks || !totalWeight || !normalizedRows.length) return {}

  const allocations = {}
  const weightedRows = normalizedRows.map((row) => {
    const exactMarks = (row.weight / totalWeight) * normalizedTotalMarks
    const baseMarks = Math.floor(exactMarks)
    allocations[row.key] = baseMarks
    return {
      ...row,
      baseMarks,
      remainder: exactMarks - baseMarks,
    }
  })
  let remainingMarks = normalizedTotalMarks - weightedRows.reduce(
    (total, row) => total + row.baseMarks,
    0,
  )

  weightedRows
    .filter((row) => row.weight > 0)
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .forEach((row) => {
      if (remainingMarks <= 0) return
      allocations[row.key] += 1
      remainingMarks -= 1
    })

  return Object.fromEntries(weightedRows.map((row) => [
    row.key,
    row.weight > 0 ? String(allocations[row.key]) : '',
  ]))
}

export const summarizeQuestionTypeRows = (rows = []) => rows.reduce((summary, row) => ({
  totalMarks: summary.totalMarks + Math.max(0, toFiniteNumber(row.totalMarksNumber ?? row.totalMarks)),
  totalQuestions: summary.totalQuestions + Math.max(0, toFiniteNumber(row.totalQuestions)),
  hotMarks: summary.hotMarks + Math.max(0, toFiniteNumber(row.hotMarks)),
  hotQuestions: summary.hotQuestions + Math.max(0, toFiniteNumber(row.hotQuestions)),
  lotMarks: summary.lotMarks + Math.max(0, toFiniteNumber(row.lotMarks)),
  lotQuestions: summary.lotQuestions + Math.max(0, toFiniteNumber(row.lotQuestions)),
}), {
  totalMarks: 0,
  totalQuestions: 0,
  hotMarks: 0,
  hotQuestions: 0,
  lotMarks: 0,
  lotQuestions: 0,
})

export const calculateQuestionTotal = ({ totalMarks = 0, markPerQuestion = 0 } = {}) => {
  const normalizedTotalMarks = Math.max(0, toFiniteNumber(totalMarks))
  const normalizedMarkPerQuestion = Math.max(0, toFiniteNumber(markPerQuestion))
  const exactTotal = normalizedMarkPerQuestion > 0
    ? normalizedTotalMarks / normalizedMarkPerQuestion
    : 0
  const isValid = normalizedTotalMarks > 0
    && normalizedMarkPerQuestion > 0
    && Number.isInteger(exactTotal)

  return {
    isValid,
    totalQuestions: isValid ? exactTotal : 0,
  }
}

export const calculateComplementaryQuestionSplit = ({
  totalQuestions = 0,
  editedLevel,
  editedQuestions = 0,
} = {}) => {
  const normalizedTotal = Math.max(0, Math.trunc(toFiniteNumber(totalQuestions)))
  const normalizedEdited = Math.min(
    normalizedTotal,
    Math.max(0, Math.trunc(toFiniteNumber(editedQuestions))),
  )

  return editedLevel === 'lot'
    ? { hotQuestions: normalizedTotal - normalizedEdited, lotQuestions: normalizedEdited }
    : { hotQuestions: normalizedEdited, lotQuestions: normalizedTotal - normalizedEdited }
}
