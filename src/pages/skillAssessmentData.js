export const assessmentYearOptions = ['First Year', 'Second Year', 'Third Year']

export const assessmentSgtMap = {
  'First Year': ['SGT 1A', 'SGT 1B', 'SGT 1C'],
  'Second Year': ['SGT 2A', 'SGT 2B', 'SGT 2C'],
  'Third Year': ['SGT 3A', 'SGT 3B', 'SGT 3C'],
}

export const skillAssessmentActivities = [
  {
    id: 'fy-1',
    year: 'First Year',
    sgt: 'SGT 1A',
    competency: 'PY1.4',
    skillType: 'OSPE',
    name: 'Identify the parts of a compound microscope',
    students: 10,
    completedAttempts: [2],
  },
  {
    id: 'fy-2',
    year: 'First Year',
    sgt: 'SGT 1B',
    competency: 'AN1.8',
    skillType: 'OSCE',
    name: 'Measure blood pressure and document the reading',
    students: 10,
    completedAttempts: [1, 3],
  },
  {
    id: 'sy-1',
    year: 'Second Year',
    sgt: 'SGT 2A',
    competency: 'PY2.11',
    skillType: 'OSPE',
    name: 'Interpret a complete blood count panel',
    students: 10,
    completedAttempts: [2],
  },
  {
    id: 'sy-2',
    year: 'Second Year',
    sgt: 'SGT 2B',
    competency: 'PY2.7',
    skillType: 'OSCE',
    name: 'Review peripheral smear basics',
    students: 10,
    completedAttempts: [1],
  },
  {
    id: 'ty-1',
    year: 'Third Year',
    sgt: 'SGT 3A',
    competency: 'PA3.4',
    skillType: 'Image',
    name: 'Identify gross pathology on specimen images',
    students: 10,
    completedAttempts: [1],
  },
  {
    id: 'ty-2',
    year: 'Third Year',
    sgt: 'SGT 3C',
    competency: 'MD3.2',
    skillType: 'Interpretation',
    name: 'Evaluate a long case summary and propose next steps',
    students: 10,
    completedAttempts: [],
  },
]

export const evaluationStudents = [
  { id: 'MC2566', name: 'Karthik Subramanian' },
  { id: 'MC2567', name: 'Aarav Sharma' },
  { id: 'MC2568', name: 'Diya Patel' },
  { id: 'MC2569', name: 'Kabir Khan' },
  { id: 'MC2570', name: 'Meera Nair' },
  { id: 'MC2571', name: 'Ishaan Verma' },
  { id: 'MC2572', name: 'Ananya Iyer' },
  { id: 'MC2573', name: 'Rahul Singh' },
  { id: 'MC2574', name: 'Sana Ali' },
  { id: 'MC2575', name: 'Vivaan Gupta' },
]

export const dashboardActivityDirectory = [
  {
    competency: 'PY2.11',
    title: 'Interpret a complete blood count panel',
  },
  {
    competency: 'AN1.2',
    title: 'Describe composition of bone and bone marrow',
  },
  {
    competency: 'OSCE',
    title: 'Review peripheral smear basics',
  },
  {
    competency: 'PA3.4',
    title: 'Identify gross pathology on specimen images',
  },
]

export const dashboardStudentProfiles = evaluationStudents.map((student, index) => {
  const year = assessmentYearOptions[Math.min(Math.floor(index / 4), assessmentYearOptions.length - 1)]
  const batch = ['Batch A', 'Batch A', 'Batch A', 'Batch A', 'Batch B', 'Batch B', 'Batch B', 'Batch C', 'Batch C', 'Batch C'][index] ?? 'Batch A'
  const sgt = [
    'SGT 1A',
    'SGT 1B',
    'SGT 1C',
    'SGT 1A',
    'SGT 2A',
    'SGT 2B',
    'SGT 2C',
    'SGT 3A',
    'SGT 3B',
    'SGT 3C',
  ][index] ?? 'SGT 1A'
  const activity = dashboardActivityDirectory[index % dashboardActivityDirectory.length]
  const totalDoap = 2 + (index % 4)
  const pending = 1 + (index % 2)
  const complete = Math.max(totalDoap - pending, 0)
  const cognitive = 58 + ((index * 7) % 28)
  const affective = 54 + ((index * 5) % 26)
  const psychomotor = 62 + ((index * 6) % 24)

  return {
    ...student,
    year,
    batch,
    sgt,
    activity,
    totalDoap,
    pending,
    complete,
    evalCount: `${(index % 3) + 1} / 12`,
    evalStatus: index % 3 === 0 ? 'Complete' : 'Incomplete',
    obtainedMarks: `${String(3 + (index % 4)).padStart(2, '0')} / 10`,
    checklistDone: `${4 + (index % 2)} / 5`,
    cognitive,
    affective,
    psychomotor,
    auditTrail: [
      {
        id: `${student.id}-attempt-1`,
        competency: activity.competency,
        title: activity.title,
        attempt: 'Attempt 1',
        status: 'Repeated',
        remarks: 'Needs a more structured response under timed conditions.',
      },
      {
        id: `${student.id}-attempt-2`,
        competency: activity.competency,
        title: activity.title,
        attempt: 'Attempt 3',
        status: 'Certified',
        remarks: 'Confident execution with complete checklist coverage.',
      },
      {
        id: `${student.id}-attempt-3`,
        competency: 'AN1.2',
        title: 'Describe composition of bone and bone marrow',
        attempt: 'Attempt 2',
        status: 'Remedial',
        remarks: 'Focused revision needed before the next grading cycle.',
      },
    ],
  }
})

export const gradingTabs = [
  { id: 'checklist', label: 'Activity Checklist' },
  { id: 'form', label: 'Activity Form' },
  { id: 'questions', label: 'Scaffolded Questions' },
]

export const gradingChecklistItems = [
  { id: 'preparedness', label: 'Preparedness', hint: 'Has equipment and notes ready.' },
  { id: 'environment', label: 'Environment', hint: 'Maintains a safe and clean setup.' },
  { id: 'equipment', label: 'Equipment', hint: 'Uses the correct tools confidently.' },
  { id: 'procedure', label: 'Procedure', hint: 'Follows the task sequence accurately.' },
  { id: 'communication', label: 'Communication', hint: 'Explains the process clearly.' },
]

export const gradingQuestions = [
  'Explain the key principle behind this activity.',
  'What would you do differently in the next attempt?',
]

export const createGradingChecklistState = () => Object.fromEntries(
  gradingChecklistItems.map((item) => [item.id, 'pending'])
)

export const createStudentAssessmentState = () => ({
  activeTab: 'checklist',
  checklist: createGradingChecklistState(),
  formNotes: '',
  questionAnswers: gradingQuestions.reduce((acc, question, index) => {
    acc[`question-${index + 1}`] = ''
    return acc
  }, {}),
  remarks: '',
  submitted: false,
  lastSavedAt: Date.now(),
  loading: false,
})

