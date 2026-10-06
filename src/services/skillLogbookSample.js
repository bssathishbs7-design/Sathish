import { LEARNERS } from './logbookPeople.js'

/** Shared demo assignments used by Skills and Logbook on a fresh session. */
export const SKILL_SAMPLE_ASSIGNMENTS = [
  { id: 'sample-skill-blood-group', sourceActivityId: 'sample-blood-group', title: 'Determine blood group and RBC indices', subject: 'Physiology', competency: 'PY2.7', certifiable: true, facultyId: 'AS' },
  { id: 'sample-skill-landmarks', sourceActivityId: 'sample-landmarks', title: 'Identify anatomical landmarks', subject: 'Human Anatomy', competency: 'AN1.2', certifiable: false, facultyId: 'RM' },
].map(activity => ({ ...activity, type: 'OSCE', marks: 'Nil', assignedAt: '2026-10-06T09:00:00+05:30',
  createdDate: '06/10/2026', year: 'First Year', sgt: 'Demo cohort', assignedTo: 'First Year', students: LEARNERS.map(student => ({ ...student })),
  studentCount: LEARNERS.length, status: 'Assigned', action: 'Start Activity', tone: 'primary',
  activityData: { activity: { id: activity.sourceActivityId, name: activity.title, marks: 'Nil', certifiable: activity.certifiable }, record: { subject: activity.subject, competency: activity.competency } },
  examData: { durationMinutes: 30, modules: { checklist: [{ id: `${activity.id}-preparation`, text: 'Explain the procedure and prepare the equipment.', marks: '0' }, { id: `${activity.id}-perform`, text: activity.title, marks: '0' }], questions: [], form: [], scaffolding: [] } },
}))
