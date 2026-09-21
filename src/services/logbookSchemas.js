/** Category forms transcribed from Digital Logbook.dc.html, 19 September 2026.
 * Prototype field keys map to existing app keys to preserve saved records.
 * @typedef {{key:string,label:string,type:string,required:boolean,options?:string[],wide:boolean,hint?:string}} LogbookField
 */
const categoryAliases = { simulation: 'slab', vertical: 'vi', horizontal: 'hi', journal: 'jc', practical: 'prac', clerkship: 'clerk', emergency: 'emerg', museum: 'spec' }
const fieldAliases = { compNo: 'competency', pid: 'patientId', dx: 'diagnosis', admit: 'admission', level: 'participation', sno: 'serial', dateDone: 'date', dateVisit: 'date', dateSurvey: 'date' }
/** @returns {Array<{title:string,note?:string,locked?:boolean,fields:LogbookField[]}>} */
export function getLogbookGroups(category, subject, remedial = false) {
  if (category === 'community') return [{ title: 'Previous community record', fields: [
    { key: 'topic', label: 'Topic', type: 'text', required: true },
    { key: 'village', label: 'Village / community', type: 'text', required: true },
    { key: 'reflection', label: 'Learning reflection', type: 'textarea', required: true, wide: true },
  ] }]
  const groups = prototypeGroups(remedial && category === 'cert' ? 'remedial' : categoryAliases[category] || category, subject)
  return groups.map((group, index) => ({ ...group, fields: group.fields.map(field => ({
    ...field, key: fieldAliases[field.k] || field.k,
    type: field.type === 'area' ? 'textarea' : ['choice', 'toggle', 'select'].includes(field.type) ? 'select' : field.type,
    options: field.options?.filter(option => typeof option === 'string'),
    required: !group.locked && (index === 0 ? field.type !== 'area' && !field.optional : !!field.required),
    wide: field.type === 'area' || ['activity', 'topic', 'depts', 'findings', 'vaccines', 'outcome'].includes(field.k),
  })) }))
}
function prototypeGroups(catId, subject) {
    const t = (k, label, type, extra) => ({ k, label, type: type || 'text', ...(extra || {}) });
    const area = (k, label) => ({ k, label, type: 'area' });
    const toggle = (k, label, options) => ({ k, label, type: 'toggle', options });
    const sel = (k, label, options) => ({ k, label, type: 'select', options: [{ value: '', label: 'Awaiting faculty' }, ...options] });
    // learner-editable pick list for 3+ or long options (a segmented toggle would not fit a phone)
    const choice = (k, label, options) => ({ k, label, type: 'choice', options: [{ value: '', label: 'Choose one' }, ...options] });
    const ROLE = ['Attended', 'Presented'];
    const PA = ['P · Presented', 'A · Attended'], YN = ['Yes', 'No'], PN = ['P · Presented', 'N · Not presented'];
    const refl3 = [area('r1', 'What Happened? (What did you learn during the whole process?)'), area('r2', 'So What? (How did this learning influence you?)'), area('r3', 'What Next? (How do you plan to make best use of your learning?)')];
    const RATING = ['M · Meets expectations', 'B · Below expectations', 'E · Exceeds expectations'], DECISION = ['C · Certified', 'R · Repeat', 'Re · Remedial'];
    const reflVisit = [area('r1', 'What Happened? (What did you learn from the whole visit?)'), area('r2', 'So What? (How did this learning influence you?)'), area('r3', 'What Next? (How do you plan to make best use of your learning?)')];
    const refl4 = [area('q1', 'What happened? What did you learn?'), area('q2', 'What does the experience mean? Why?'), area('q3', 'How valuable was the learning experience?'), area('q4', 'How will you apply your learning?')];
    const ageHint = { hint: 'e.g. 34 / F' };
    switch (catId) {
      case 'skill': return [{ title: 'Record', fields: [t('compNo', 'Competency No.'), t('activity', 'Name of the Activity'), t('dateDone', 'Date Completed', 'date')] }];
      case 'sdl': {
        // WEEK is specific to the DVL logbook — shown only when the subject is Dermatology, Venereology & Leprosy
        const dvl = /derma|venere|lepr|DVL/i.test(subject || '');
        return [{ title: 'Record', note: dvl ? 'The DVL logbook records the teaching week for each SDL session.' : '', fields: [...(dvl ? [t('week', 'WEEK')] : []), t('compNo', 'Competency No.'), t('topic', 'Topic'), t('dateDone', 'Date Completed', 'date')] }];
      }
      case 'cert': {
        const anat = ['Human Anatomy', 'Anatomy', 'Physiology', 'Biochemistry'].includes(subject);
        return [
          { title: 'Record', note: anat ? `${subject} is a Phase I foundation subject — “Number required to certify” is not recorded.` : '', fields: [t('compNo', 'Competency No.'), t('activity', 'Name of the Activity'), ...(anat ? [] : [t('numReq', 'Number required to certify', 'number')]), t('dateDone', 'Date Completed', 'date')] },
          { title: 'Faculty grading', locked: true, note: 'Completed by the certifying faculty after verification. Read-only for learners.', fields: [sel('attempt', 'Attempt at Activity (F/R/Re)', ['F · First', 'R · Repeat', 'Re · Remedial']), sel('rating', 'Rating (M/B/E)', RATING), sel('decision', 'Decision of Faculty (C/R/Re)', DECISION)] },
        ];
      }
      case 'remedial': return [
        { title: 'Record', note: 'Counts as a further attempt at the same certifiable competency.', fields: [t('compNo', 'Competency No.'), t('activity', 'Name of Activity'), t('dateDone', 'Date completed', 'date')] },
        { title: 'Faculty grading', locked: true, note: 'Completed by the certifying faculty after verification. Read-only for learners.', fields: [sel('attempt', 'Attempt at Activity (R/Re)', ['R · Repeat', 'Re · Remedial']), sel('rating', 'Rating (M/B/E)', RATING), sel('decision', 'Decision of Faculty (C/R/Re)', DECISION)] },
      ];
      case 'ece': return [
        { title: 'Record', fields: [t('compNo', 'Competency No.'), t('topic', 'Topic'), t('dateDone', 'Date Completed', 'date')] },
        { title: 'Reflective writing on ECE', note: 'Signed off by the facilitator (Initial of Facilitator).', fields: refl4 },
      ];
      case 'aetcom': return [
        { title: 'Record', fields: [t('moduleNo', 'Module No.'), t('topic', 'Topic'), t('dateDone', 'Date Completed', 'date')] },
        { title: 'Reflective writing on AETCOM session', note: 'Filed against the Module No. above. Signed off by the facilitator (Initial of Facilitator / Signature of Faculty).', fields: refl4 },
      ];
      case 'vi': return [{ title: 'Record', fields: [t('compNo', 'Competency No.'), t('topic', 'Topic'), t('dateDone', 'Date Completed', 'date'), t('depts', 'Integrated department(s)')] }];
      case 'hi': return [{ title: 'Record', note: 'Integration with a department of the same phase (vertical integration is logged separately).', fields: [t('compNo', 'Competency No.'), t('topic', 'Topic'), t('dateDone', 'Date Completed', 'date'), t('depts', 'Integrated department(s)', 'text', { hint: 'Same-phase department(s)' })] }];
      case 'sgt': return [{ title: 'Record', fields: [choice('sessionType', 'Type of session', ['Tutorial', 'Seminar', 'Symposium', 'Small group discussion']), t('topic', 'Topic'), t('dateDone', 'Date', 'date'), toggle('role', 'Role', ROLE)] }];
      case 'jc': return [{ title: 'Record', fields: [choice('sessionType', 'Type of session', ['Journal club', 'Clinico-pathological conference (CPC)', 'Grand round', 'Mortality & morbidity meeting']), t('topic', 'Topic / case'), t('dateDone', 'Date', 'date'), toggle('role', 'Role', ROLE)] }];
      case 'prac': return [{ title: 'Record', fields: [t('exerciseNo', 'Exercise No.'), t('activity', 'Title of the exercise'), t('dateDone', 'Date', 'date'), area('observation', 'Observation / result')] }];
      case 'slab': return [{ title: 'Record', note: 'Practice on models and simulators — the certifiable performance on a patient is logged as a Certifiable Skill Competency.', fields: [t('activity', 'Skill practised'), t('station', 'Station / model', 'text', { hint: 'e.g. IV arm trainer, airway mannequin' }), t('dateDone', 'Date', 'date'), t('attemptNo', 'Attempt No.', 'number')] }];
      case 'proc': return [{ title: 'Record', note: 'Every procedure seen in the posting, with your level of participation.', fields: [t('activity', 'Procedure'), t('pid', 'Patient ID'), t('date', 'Date', 'date'), choice('level', 'Level of participation', ['O · Observed', 'A · Assisted', 'PS · Performed under supervision', 'PI · Performed independently'])] }];
      case 'emerg': return [{ title: 'Record', fields: [t('date', 'Date of duty', 'date'), toggle('shift', 'Shift', ['Day', 'Evening', 'Night']), t('cases', 'No. of cases seen', 'number'), area('notable', 'Notable case / learning')] }];
      case 'obg': return [{ title: 'Record', fields: [choice('recordType', 'Type of record', ['Delivery witnessed', 'Delivery conducted (supervised)', 'Antenatal case examined', 'Partograph plotted']), t('pid', 'Patient ID'), t('parity', 'Age / parity', 'text', { hint: 'e.g. 26 / G2P1' }), t('date', 'Date', 'date'), t('outcome', 'Diagnosis / outcome')] }];
      case 'imm': return [{ title: 'Record', fields: [choice('sessionType', 'Type of session', ['Immunisation clinic', 'Well-baby clinic', 'Growth monitoring']), t('date', 'Date', 'date'), t('children', 'No. of children seen', 'number'), t('vaccines', 'Vaccines given / observations')] }];
      case 'pm': return [{ title: 'Record', fields: [choice('recordType', 'Type of record', ['Postmortem witnessed', 'Medico-legal case', 'Court visit']), t('caseNo', 'PM / case No.'), t('date', 'Date', 'date'), t('findings', 'Cause of death / findings')] }];
      case 'pharm': return [{ title: 'Record', fields: [choice('exerciseType', 'Type of exercise', ['Prescription writing / audit', 'Adverse drug reaction (ADR) report', 'P-drug exercise', 'Critical appraisal of drug promotional literature']), t('activity', 'Drug(s) / case'), t('dateDone', 'Date', 'date'), area('summary', 'Summary of the exercise')] }];
      case 'chs': return [{ title: 'Record', fields: [choice('activityType', 'Type of activity', ['Clinico-social case study', 'Health education / IEC session', 'Health camp', 'School health visit']), t('place', 'Place'), t('date', 'Date', 'date'), t('beneficiaries', 'Participants / beneficiaries', 'number'), area('findings', 'Key findings / learning')] }];
      case 'spec': return [{ title: 'Record', fields: [t('specimenNo', 'Specimen / slide No.'), t('activity', 'Diagnosis / identification'), t('dateDone', 'Date', 'date')] }];
      case 'ccp': return [
        { title: 'Record', fields: [t('serial', 'Serial No.', 'number'), t('date', 'Date', 'date'), t('pid', 'Patient ID'), t('ageGender', 'Age/Gender', 'text', ageHint), t('dx', 'Diagnosis'), toggle('pa', 'Case Presented/Attended Write P/A', PA)] },
        { title: 'Reflections: Clinical Case Presentation', note: 'Serial No., Patient ID, Age/Gender, Diagnosis and Date carry over from the record above. Faculty signs and dates the reflection on verification.', fields: refl3 },
      ];
      case 'clerk': return [{ title: 'Record', fields: [t('sno', 'S.No', 'number'), t('pid', 'Patient ID'), t('ageGender', 'Age/Gender', 'text', ageHint), t('provDx', 'Provisional Diagnosis'), t('admit', 'Date of admission of the patient', 'date'), t('discharge', 'Date of discharge of the patient', 'date')] }];
      case 'fap': return [{ title: 'Record', fields: [t('place', 'Place of visit'), t('families', 'Total no of families allotted', 'number'), t('dateVisit', 'Date of visit', 'date'), t('members', 'No of members in each family', 'text', { hint: 'e.g. 4, 6, 3' }), area('findings', 'Key findings'), toggle('followUp', 'Follow up visit Done or not (Yes/No)', YN)] }];
      case 'fvs': return [
        { title: 'Documentation of survey', note: 'Day, village and data count apply to survey days — leave them blank for a PHC, CHC, Anganwadi, Subcentre, CSSD or industrial visit and fill the reflection below.', fields: [t('day', 'Day', 'text', { optional: true }), t('village', 'Name of village', 'text', { optional: true }), t('dateSurvey', 'Date of survey / visit', 'date'), t('dataCount', 'No of Data collection done', 'number', { optional: true }), area('analysis', 'Analysis done'), toggle('pn', 'Presented/Not presented Write P/N', PN)] },
        { title: 'Reflections of field visit', note: 'Applies to PHC, CHC, Anganwadi, Subcentre, CSSD and industrial visits. Date and presented (Y/N) carry over from the documentation above; faculty signs and dates the reflection on verification.', fields: [t('serial', 'Serial Number', 'number'), t('place', 'Place of visit', 'text', { hint: 'e.g. Kunnamangalam PHC', required: true }), ...reflVisit] },
      ];
      case 'ach': return [{ title: 'Record', fields: [t('sno', 'S.No', 'number'), t('activity', 'Name of the Activity')] }];
      default: return [];
    }
  }
