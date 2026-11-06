/** Fictional offline profiles. Teaching rosters are resolved from Student Management, never duplicated. */
export function facultySamples(institutionId) {
  return [
    ['anika', 'FAC-001', 'Dr Anika Sharma', 'Anatomy', 'Professor', ['human-anatomy']],
    ['rahul', 'FAC-002', 'Dr Rahul Mehta', 'Physiology', 'Associate Professor', ['physiology']],
    ['iyer', 'FAC-003', 'Dr N Iyer', 'Pathology', 'Professor', ['pathology', 'microbiology']],
    ['sana', 'FAC-004', 'Dr Sana Khan', 'Pharmacology', 'Assistant Professor', ['pharmacology', 'biochemistry']],
    ['meera', 'FAC-005', 'Dr Meera Joseph', 'Community Medicine', 'Assistant Professor', ['community-medicine']],
    ['farhan', 'FAC-006', 'Dr Farhan Ali', 'Anatomy', 'Senior Resident', ['human-anatomy']],
  ].map(([id, employeeId, name, departmentId, designationId, eligibleSubjectIds]) => ({ id: 'faculty-' + id, institutionId, employeeId, name, email: id + '@medsy.example', phone: '', departmentId, designationId, eligibleSubjectIds, accountStatus: 'ACTIVE', revision: 0 }))
}

