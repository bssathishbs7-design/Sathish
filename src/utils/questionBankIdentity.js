const INSTITUTE_QUESTION_ID_PATTERN = /^INS-A01-(\d{5})$/i

const getStoredQuestionBankId = (question) => (
  String(
    question?.questionBankId
    ?? question?.bankId
    ?? question?.medsyQuestionId
    ?? question?.sourceQuestionId
    ?? '',
  ).trim()
)

export const getInstituteQuestionBankId = (question) => {
  const storedId = getStoredQuestionBankId(question)
  return INSTITUTE_QUESTION_ID_PATTERN.test(storedId) ? storedId.toUpperCase() : ''
}

export const assignInstituteQuestionBankIds = (questions = [], existingQuestions = []) => {
  let highestSequence = [...existingQuestions, ...questions].reduce((highest, question) => {
    const match = getInstituteQuestionBankId(question).match(INSTITUTE_QUESTION_ID_PATTERN)
    return match ? Math.max(highest, Number(match[1]) || 0) : highest
  }, 0)

  return questions.map((question) => {
    const existingId = getInstituteQuestionBankId(question)
    if (existingId) {
      return {
        ...question,
        questionBankId: existingId,
        isInstituteQuestion: true,
        isInstitute: undefined,
      }
    }

    highestSequence += 1
    return {
      ...question,
      questionBankId: `INS-A01-${String(highestSequence).padStart(5, '0')}`,
      isInstituteQuestion: true,
      isInstitute: undefined,
    }
  })
}
