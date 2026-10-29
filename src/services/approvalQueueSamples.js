/** Repeatable local examples; no backend writes. IDs are deliberately distinct from real requests. */
export function approvalQueueSamples(now = new Date()) {
  const sentAt = new Date(now.getTime() - 8 * 86400000).toISOString()
  const shared = { approvalStatus: 'Pending Approval', status: 'Pending Approval', sentAt, receivedAt: sentAt,
    senderDesignation: 'Assistant Professor', reviewerId: 'EMP1021', approvalFaculty: { facultyName: 'Dr. Meera Nair', employeeId: 'EMP1021', designation: 'Professor', note: 'Please review the submitted work.' } }
  return [
    { ...shared, id: 'demo-queue-questions', activityId: 'demo-queue-questions', activityType: 'Question Bank', activityName: 'Upper limb anatomy questions', senderId: 'EMP1002', senderName: 'Dr. Priya Shah', origin: 'My Questions', questionRows: [
      { id: 'demo-queue-q1', draftRef: 'DRF-QB-DEMO01', type: 'MCQ', question: 'Which bone forms the upper arm?', questionText: '<p>Which bone forms the upper arm?</p>', marks: 1, competency: 'AN1.1', options: [{ id: 'a', text: 'Humerus' }, { id: 'b', text: 'Femur' }], correctOptionIds: ['a'], answerKey: 'Humerus', status: 'Sent to Approval' },
      { id: 'demo-queue-q2', draftRef: 'DRF-QB-DEMO02', type: 'MCQ', question: 'Which joint connects the upper limb to the trunk?', marks: 1, status: 'Withdrawn', withdrawnAt: sentAt },
    ] },
    { ...shared, id: 'demo-queue-skill', activityId: 'demo-queue-skill', activityType: 'Evaluation', activityName: 'Clinical examination: completed evaluation', senderId: 'EMP1003', senderName: 'Dr. Arun Kumar', totalStudents: 2, totalMarks: 10, studentRows: [
      { studentId: 'demo-queue-student1', registerId: 'DEMO001', studentName: 'Asha Raman', obtainedMarks: 8, totalMarks: 10, resultStatus: 'Completed', attemptNumber: 1 },
      { studentId: 'demo-queue-student2', registerId: 'DEMO002', studentName: 'Ravi Kumar', obtainedMarks: 6, totalMarks: 10, resultStatus: 'Completed', attemptNumber: 1 },
    ] },
  ]
}
