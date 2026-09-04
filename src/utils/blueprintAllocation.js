const toNonNegativeInteger = (value) => Math.max(0, Math.round(Number(value) || 0))

export const greatestCommonDivisor = (leftValue, rightValue) => {
  let left = Math.abs(toNonNegativeInteger(leftValue))
  let right = Math.abs(toNonNegativeInteger(rightValue))
  while (right) {
    const remainder = left % right
    left = right
    right = remainder
  }
  return left
}

export const greatestCommonDivisorOf = (values) => (
  [...new Set(values.map(toNonNegativeInteger).filter((value) => value > 0))]
    .reduce((result, value) => (result ? greatestCommonDivisor(result, value) : value), 0)
)

export const rebalanceCompetencyTargets = ({
  rows,
  denominations,
  totalMarks,
}) => {
  const normalizedTotal = toNonNegativeInteger(totalMarks)
  const denominationGcd = greatestCommonDivisorOf(denominations)
  const normalizedRows = rows.map((row, index) => ({
    ...row,
    index,
    originalTargetMarks: toNonNegativeInteger(row.targetMarks),
    fractionalIntent: Number(row.fractionalIntent) || 0,
  }))

  if (denominationGcd <= 1) {
    return {
      gcd: denominationGcd,
      rows: normalizedRows.map((row) => ({
        ...row,
        targetMarks: row.originalTargetMarks,
        weightage: normalizedTotal ? row.originalTargetMarks / normalizedTotal : 0,
        isRebalanced: false,
        rebalanceDelta: 0,
      })),
      error: '',
    }
  }

  if (!normalizedTotal || normalizedTotal % denominationGcd !== 0) {
    return {
      gcd: denominationGcd,
      rows: normalizedRows,
      error: `Total marks must be divisible by ${denominationGcd} for the active question denominations.`,
    }
  }

  const invalidRows = normalizedRows.filter(
    (row) => row.originalTargetMarks % denominationGcd !== 0,
  )
  if (!invalidRows.length) {
    return {
      gcd: denominationGcd,
      rows: normalizedRows.map((row) => ({
        ...row,
        targetMarks: row.originalTargetMarks,
        weightage: normalizedTotal ? row.originalTargetMarks / normalizedTotal : 0,
        isRebalanced: false,
        rebalanceDelta: 0,
      })),
      error: '',
    }
  }

  const invalidTargetTotal = invalidRows.reduce(
    (total, row) => total + row.originalTargetMarks,
    0,
  )
  if (invalidTargetTotal % denominationGcd !== 0) {
    return {
      gcd: denominationGcd,
      rows: normalizedRows,
      error: 'The competency targets cannot be rebalanced without changing the total exam marks.',
    }
  }

  const adjustedMarks = new Map()
  invalidRows.forEach((row) => {
    adjustedMarks.set(
      row.key,
      Math.floor(row.originalTargetMarks / denominationGcd) * denominationGcd,
    )
  })
  let upwardAdjustments = (
    invalidTargetTotal
    - [...adjustedMarks.values()].reduce((total, marks) => total + marks, 0)
  ) / denominationGcd

  const sortedInvalidRows = [...invalidRows].sort((left, right) => (
      right.fractionalIntent - left.fractionalIntent
      || (
        (right.originalTargetMarks % denominationGcd)
        - (left.originalTargetMarks % denominationGcd)
      )
      || left.index - right.index
    ))
  sortedInvalidRows.forEach((row) => {
    if (upwardAdjustments <= 0) return
    adjustedMarks.set(row.key, adjustedMarks.get(row.key) + denominationGcd)
    upwardAdjustments -= 1
  })

  const resultRows = normalizedRows.map((row) => {
    const targetMarks = adjustedMarks.has(row.key)
      ? adjustedMarks.get(row.key)
      : row.originalTargetMarks
    const rebalanceDelta = targetMarks - row.originalTargetMarks
    return {
      ...row,
      targetMarks,
      weightage: normalizedTotal ? targetMarks / normalizedTotal : 0,
      isRebalanced: rebalanceDelta !== 0,
      rebalanceDelta,
    }
  })
  const adjustedTotal = resultRows.reduce((total, row) => total + row.targetMarks, 0)

  return {
    gcd: denominationGcd,
    rows: resultRows,
    error: adjustedTotal === normalizedTotal
      ? ''
      : 'Rebalanced competency marks do not equal the total exam marks.',
  }
}

const createEmptyAllocations = (rows, columns) => Object.fromEntries(
  rows.map((row) => [
    row.key,
    Object.fromEntries(columns.map((column) => [column.key, 0])),
  ]),
)

const createAllocationTokens = ({
  columns,
  coupledGroups = [],
  columnLookup,
  coupledColumnKeys,
}) => {
  const tokens = []

  coupledGroups.forEach((group) => {
    const groupColumns = group.columnKeys.map((key) => columnLookup[key]).filter(Boolean)
    if (!groupColumns.length) return
    const requiredCount = Math.min(
      ...groupColumns.map((column) => column.targetQuestionCount),
    )
    const combinedWeight = groupColumns.reduce((total, column) => total + column.weight, 0)
    for (let index = 0; index < requiredCount; index += 1) {
      tokens.push({
        key: `${group.key || 'coupled'}-${index}`,
        columnKeys: groupColumns.map((column) => column.key),
        weight: combinedWeight,
      })
    }
  })

  columns
    .filter((column) => !coupledColumnKeys.has(column.key))
    .forEach((column) => {
      for (let index = 0; index < column.targetQuestionCount; index += 1) {
        tokens.push({
          key: `${column.key}-${index}`,
          columnKeys: [column.key],
          weight: column.weight,
        })
      }
    })

  return tokens.sort((left, right) => right.weight - left.weight || left.key.localeCompare(right.key))
}

export const autoAdjustBlueprintTargets = ({
  rows,
  columns,
  coupledGroups = [],
}) => {
  const normalizedRows = rows.map((row, index) => ({
    ...row,
    index,
    originalTargetMarks: toNonNegativeInteger(row.targetMarks),
    targetMarks: toNonNegativeInteger(row.targetMarks),
  }))
  const normalizedColumns = columns.map((column, index) => ({
    ...column,
    index,
    weight: toNonNegativeInteger(column.weight),
    targetQuestionCount: toNonNegativeInteger(column.targetQuestionCount),
  })).filter((column) => column.weight > 0 && column.targetQuestionCount > 0)
  const columnLookup = Object.fromEntries(
    normalizedColumns.map((column) => [column.key, column]),
  )
  const coupledColumnKeys = new Set(coupledGroups.flatMap((group) => group.columnKeys))
  const tokens = createAllocationTokens({
    columns: normalizedColumns,
    coupledGroups,
    columnLookup,
    coupledColumnKeys,
  })
  const targetTotal = normalizedRows.reduce((total, row) => total + row.targetMarks, 0)
  const tokenTotal = tokens.reduce((total, token) => total + token.weight, 0)

  if (!normalizedRows.length || targetTotal !== tokenTotal) {
    return {
      rows: normalizedRows,
      allocations: null,
      error: targetTotal === tokenTotal
        ? 'Select at least one competency before adjusting the blueprint distribution.'
        : 'Question marks do not equal the selected distribution total.',
    }
  }

  const allocations = createEmptyAllocations(normalizedRows, normalizedColumns)
  const rowTotals = Object.fromEntries(normalizedRows.map((row) => [row.key, 0]))
  const rowQuestionCounts = Object.fromEntries(normalizedRows.map((row) => [row.key, 0]))

  tokens.forEach((token) => {
    const selectedRow = [...normalizedRows].sort((left, right) => {
      const leftCurrent = rowTotals[left.key]
      const rightCurrent = rowTotals[right.key]
      const leftTarget = left.targetMarks
      const rightTarget = right.targetMarks
      const leftDelta = Math.abs((leftCurrent + token.weight) - leftTarget) - Math.abs(leftCurrent - leftTarget)
      const rightDelta = Math.abs((rightCurrent + token.weight) - rightTarget) - Math.abs(rightCurrent - rightTarget)
      return leftDelta - rightDelta
        || rowQuestionCounts[left.key] - rowQuestionCounts[right.key]
        || leftCurrent - rightCurrent
        || left.index - right.index
    })[0]

    token.columnKeys.forEach((columnKey) => {
      allocations[selectedRow.key][columnKey] += 1
    })
    rowTotals[selectedRow.key] += token.weight
    rowQuestionCounts[selectedRow.key] += token.columnKeys.length
  })

  const adjustedRows = normalizedRows.map((row) => {
    const targetMarks = rowTotals[row.key]
    return {
      ...row,
      targetMarks,
      isRebalanced: targetMarks !== row.originalTargetMarks,
      rebalanceDelta: targetMarks - row.originalTargetMarks,
    }
  })

  return {
    rows: adjustedRows,
    allocations,
    error: '',
  }
}

export const autoFillBlueprintAllocations = ({
  rows,
  columns,
  coupledGroups = [],
}) => {
  const normalizedRows = rows.map((row, index) => ({
    ...row,
    index,
    targetMarks: toNonNegativeInteger(row.targetMarks),
  }))
  const normalizedColumns = columns.map((column, index) => ({
    ...column,
    index,
    weight: toNonNegativeInteger(column.weight),
    targetQuestionCount: toNonNegativeInteger(column.targetQuestionCount),
  }))
  const allocations = createEmptyAllocations(normalizedRows, normalizedColumns)
  const remainingMarks = Object.fromEntries(
    normalizedRows.map((row) => [row.key, row.targetMarks]),
  )
  const remainingQuestions = Object.fromEntries(
    normalizedColumns.map((column) => [column.key, column.targetQuestionCount]),
  )
  const columnLookup = Object.fromEntries(
    normalizedColumns.map((column) => [column.key, column]),
  )
  const coupledColumnKeys = new Set(coupledGroups.flatMap((group) => group.columnKeys))

  const attemptExactAllocation = () => {
    const exactAllocations = createEmptyAllocations(normalizedRows, normalizedColumns)
    const exactRemainingMarks = normalizedRows.map((row) => row.targetMarks)
    const tokens = createAllocationTokens({
      columns: normalizedColumns,
      coupledGroups,
      columnLookup,
      coupledColumnKeys,
    })

    const rowTargetTotal = exactRemainingMarks.reduce((total, marks) => total + marks, 0)
    const tokenMarksTotal = tokens.reduce((total, token) => total + token.weight, 0)
    if (rowTargetTotal !== tokenMarksTotal) return null

    const failedStates = new Set()
    let exploredStates = 0
    const maximumStates = 250000
    const allocateToken = (tokenIndex) => {
      if (tokenIndex >= tokens.length) {
        return exactRemainingMarks.every((marks) => marks === 0)
      }
      if (exploredStates >= maximumStates) return false
      exploredStates += 1

      const stateKey = `${tokenIndex}:${exactRemainingMarks.join(',')}`
      if (failedStates.has(stateKey)) return false
      const token = tokens[tokenIndex]
      const eligibleRowIndexes = normalizedRows
        .map((row, rowIndex) => ({ row, rowIndex }))
        .filter(({ rowIndex }) => exactRemainingMarks[rowIndex] >= token.weight)
        .sort((left, right) => {
          const leftCount = token.columnKeys.reduce(
            (total, columnKey) => total + exactAllocations[left.row.key][columnKey],
            0,
          )
          const rightCount = token.columnKeys.reduce(
            (total, columnKey) => total + exactAllocations[right.row.key][columnKey],
            0,
          )
          return leftCount - rightCount
            || exactRemainingMarks[right.rowIndex] - exactRemainingMarks[left.rowIndex]
            || left.row.index - right.row.index
        })
      const attemptedCapacities = new Set()

      for (const { row, rowIndex } of eligibleRowIndexes) {
        const capacitySignature = `${exactRemainingMarks[rowIndex]}:${token.columnKeys.map(
          (columnKey) => exactAllocations[row.key][columnKey],
        ).join(',')}`
        if (attemptedCapacities.has(capacitySignature)) continue
        attemptedCapacities.add(capacitySignature)

        exactRemainingMarks[rowIndex] -= token.weight
        token.columnKeys.forEach((columnKey) => {
          exactAllocations[row.key][columnKey] += 1
        })
        if (allocateToken(tokenIndex + 1)) return true
        token.columnKeys.forEach((columnKey) => {
          exactAllocations[row.key][columnKey] -= 1
        })
        exactRemainingMarks[rowIndex] += token.weight
      }

      failedStates.add(stateKey)
      return false
    }

    if (!allocateToken(0)) return null
    return {
      allocations: exactAllocations,
      remainingMarks: Object.fromEntries(normalizedRows.map((row) => [row.key, 0])),
      remainingQuestions: Object.fromEntries(
        normalizedColumns.map((column) => [column.key, 0]),
      ),
      error: '',
    }
  }

  const createAllocationFailure = (error) => (
    attemptExactAllocation() || { allocations: null, error }
  )

  const chooseEligibleRow = (eligibleRows, columnKeys) => (
    [...eligibleRows].sort((left, right) => {
      const leftCount = columnKeys.reduce(
        (total, columnKey) => total + allocations[left.key][columnKey],
        0,
      )
      const rightCount = columnKeys.reduce(
        (total, columnKey) => total + allocations[right.key][columnKey],
        0,
      )
      return leftCount - rightCount
        || remainingMarks[right.key] - remainingMarks[left.key]
        || left.index - right.index
    })[0]
  )

  for (const group of coupledGroups) {
    const groupColumns = group.columnKeys.map((key) => columnLookup[key]).filter(Boolean)
    if (!groupColumns.length) continue
    const requiredCount = Math.min(
      ...groupColumns.map((column) => remainingQuestions[column.key]),
    )
    const combinedWeight = groupColumns.reduce((total, column) => total + column.weight, 0)

    for (let questionIndex = 0; questionIndex < requiredCount; questionIndex += 1) {
      const eligibleRows = normalizedRows.filter(
        (row) => remainingMarks[row.key] >= combinedWeight,
      )
      if (!eligibleRows.length) {
        return createAllocationFailure(
          `Unable to allocate coupled ${group.label || 'question'} splits within competency targets.`,
        )
      }
      const selectedRow = chooseEligibleRow(eligibleRows, group.columnKeys)
      groupColumns.forEach((column) => {
        allocations[selectedRow.key][column.key] += 1
        remainingQuestions[column.key] -= 1
      })
      remainingMarks[selectedRow.key] -= combinedWeight
    }
  }

  const standardColumns = normalizedColumns
    .filter((column) => !coupledColumnKeys.has(column.key))
    .sort((left, right) => right.weight - left.weight || left.index - right.index)

  for (const column of standardColumns) {
    while (remainingQuestions[column.key] > 0) {
      const eligibleRows = normalizedRows.filter(
        (row) => remainingMarks[row.key] >= column.weight,
      )
      if (!eligibleRows.length) {
        const rowCodesWithRemainingMarks = normalizedRows
          .filter((row) => remainingMarks[row.key] > 0)
          .slice(0, 4)
          .map((row) => `${row.code || row.key}: ${remainingMarks[row.key]}`)
          .join(', ')
        return createAllocationFailure(
          column.weight > 0 && rowCodesWithRemainingMarks
            ? `Unable to place the remaining ${column.label || column.key} questions. Each needs ${column.weight} marks, but remaining competency slots are smaller (${rowCodesWithRemainingMarks}).`
            : `Unable to place the remaining ${column.label || column.key} questions.`,
        )
      }
      const selectedRow = chooseEligibleRow(eligibleRows, [column.key])
      allocations[selectedRow.key][column.key] += 1
      remainingMarks[selectedRow.key] -= column.weight
      remainingQuestions[column.key] -= 1
    }
  }

  const incompleteRow = normalizedRows.find((row) => remainingMarks[row.key] !== 0)
  const incompleteColumn = normalizedColumns.find(
    (column) => remainingQuestions[column.key] !== 0,
  )
  if (incompleteRow || incompleteColumn) {
    return createAllocationFailure(
      incompleteRow
        ? `${incompleteRow.code || incompleteRow.key} has ${remainingMarks[incompleteRow.key]} unallocated marks.`
        : `${incompleteColumn.label || incompleteColumn.key} has unallocated questions.`,
    )
  }

  return {
    allocations,
    remainingMarks,
    remainingQuestions,
    error: '',
  }
}

const createSeededRandom = (seedValue) => {
  let seed = (toNonNegativeInteger(seedValue) || 1) >>> 0
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export const reshuffleBlueprintAllocations = ({
  allocations,
  rows,
  columns,
  seed = Date.now(),
  cyclesPerTier = 14,
}) => {
  const nextAllocations = Object.fromEntries(
    rows.map((row) => [row.key, { ...(allocations[row.key] || {}) }]),
  )
  const random = createSeededRandom(seed)
  const tiers = new Map()
  columns.forEach((column) => {
    const weight = toNonNegativeInteger(column.weight)
    if (!weight) return
    const tier = tiers.get(weight) || []
    tier.push(column)
    tiers.set(weight, tier)
  })
  const changedCells = new Set()
  let successfulCycles = 0

  tiers.forEach((tierColumns) => {
    if (tierColumns.length < 2 || rows.length < 2) return
    const targetCycles = Math.max(1, toNonNegativeInteger(cyclesPerTier))
    let tierCycles = 0
    let attempts = 0
    const maximumAttempts = targetCycles * 40

    while (tierCycles < targetCycles && attempts < maximumAttempts) {
      attempts += 1
      const firstRowIndex = Math.floor(random() * rows.length)
      let secondRowIndex = Math.floor(random() * rows.length)
      if (secondRowIndex === firstRowIndex) secondRowIndex = (secondRowIndex + 1) % rows.length
      const firstColumnIndex = Math.floor(random() * tierColumns.length)
      let secondColumnIndex = Math.floor(random() * tierColumns.length)
      if (secondColumnIndex === firstColumnIndex) {
        secondColumnIndex = (secondColumnIndex + 1) % tierColumns.length
      }

      const firstRowKey = rows[firstRowIndex].key
      const secondRowKey = rows[secondRowIndex].key
      const firstColumnKey = tierColumns[firstColumnIndex].key
      const secondColumnKey = tierColumns[secondColumnIndex].key
      if (
        (nextAllocations[firstRowKey][firstColumnKey] || 0) < 1
        || (nextAllocations[secondRowKey][secondColumnKey] || 0) < 1
      ) {
        continue
      }

      nextAllocations[firstRowKey][firstColumnKey] -= 1
      nextAllocations[firstRowKey][secondColumnKey] = (
        nextAllocations[firstRowKey][secondColumnKey] || 0
      ) + 1
      nextAllocations[secondRowKey][firstColumnKey] = (
        nextAllocations[secondRowKey][firstColumnKey] || 0
      ) + 1
      nextAllocations[secondRowKey][secondColumnKey] -= 1
      changedCells.add(`${firstRowKey}:${firstColumnKey}`)
      changedCells.add(`${firstRowKey}:${secondColumnKey}`)
      changedCells.add(`${secondRowKey}:${firstColumnKey}`)
      changedCells.add(`${secondRowKey}:${secondColumnKey}`)
      tierCycles += 1
      successfulCycles += 1
    }
  })

  return {
    allocations: nextAllocations,
    changedCells: [...changedCells],
    successfulCycles,
  }
}
