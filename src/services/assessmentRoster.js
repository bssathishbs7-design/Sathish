/** Shared sample roster for the local mock workflow. Explicit assigned rosters take precedence. */
export const MOCK_EVALUATION_STUDENTS = [
  {
    id: 'MV1253',
    name: 'Aarav Menon',
    attendance: 'P',
    evaluationStatus: 'Completed',
    mockEvaluationState: {
      'mock-eval-mcq-1': { status: 'correct', marks: 1 },
      'mock-eval-mcq-2': { status: 'wrong', marks: 0 },
      'mock-eval-mcq-3': { status: 'correct', marks: 1 },
      'mock-eval-desc-1': { status: 'evaluated', marks: 7 },
      'mock-eval-desc-2': { status: 'evaluated', marks: 6 },
    },
  },
  {
    id: 'MV1254',
    name: 'Meera Krishnan',
    attendance: 'P',
    evaluationStatus: 'Completed',
    mockEvaluationState: {
      'mock-eval-mcq-1': { status: 'correct', marks: 1 },
      'mock-eval-mcq-2': { status: 'correct', marks: 1 },
      'mock-eval-mcq-3': { status: 'wrong', marks: 0 },
      'mock-eval-desc-1': { status: 'evaluated', marks: 5 },
      'mock-eval-desc-2': { status: 'evaluated', marks: 4 },
    },
  },
  {
    id: 'MV1255',
    name: 'Rohit Sharma',
    attendance: 'P',
    evaluationStatus: 'Yet to Start',
    mockEvaluationState: {},
  },
  {
    id: 'MV1256',
    name: 'Sara Joseph',
    attendance: 'A',
    evaluationStatus: 'Absent',
    mockEvaluationState: {},
  },
  {
    id: 'MC2568',
    name: 'Karthik Subramanian',
    attendance: 'P',
    evaluationStatus: 'Completed',
    mockEvaluationState: {
      'mock-eval-mcq-1': { status: 'correct', marks: 1 },
      'mock-eval-mcq-2': { status: 'correct', marks: 1 },
      'mock-eval-mcq-3': { status: 'correct', marks: 1 },
      'mock-eval-desc-1': { status: 'evaluated', marks: 8 },
      'mock-eval-desc-2': { status: 'evaluated', marks: 7 },
    },
  },
]

/** @param {Object} assessment Published record from the mock/API storage layer.
 * @returns {Array<Object>} The same roster used by the evaluation table and automation.
 */
export function assessmentRoster(assessment) {
  return [assessment.students, assessment.assignedStudents, assessment.studentRows, assessment.setup?.students, assessment.setup?.assignedStudents]
    .find(rows => Array.isArray(rows) && rows.length) || MOCK_EVALUATION_STUDENTS
}
