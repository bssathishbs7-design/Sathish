import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ManagementMultiSelect from './ManagementMultiSelect'
import { DIRECTORY_EVENT, getStudentDirectory, YEARS } from '../services/studentManagement'
import { assessmentGroupKey, eligibleAssessmentStudents } from '../services/assessmentAssignment'
import './AssessmentAssignmentFields.css'

/** Controlled cascading assignment scope. Student IDs are directory IDs, never labels.
 * @param {{value:{assignBatch:string,assignYear:string,assignGroups:string[],assignStudentIds:string[]},onChange:Function,onValidityChange:Function,disabled?:boolean}} props
 * Loading/errors remain local; the parent retains the selection when publication method changes.
 */
export default function AssessmentAssignmentFields({ value, onChange, onValidityChange, disabled = false }) {
  const [directory, setDirectory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const batchRef = useRef(null)
  useEffect(() => {
    let active = true
    getStudentDirectory().then(data => {
      eligibleAssessmentStudents(data)
      if (active) { setDirectory(data); setError(''); setLoading(false) }
    }).catch(reason => { if (active) { setError(reason.message || 'Unable to load students. Please try again.'); setLoading(false) } })
    return () => { active = false }
  }, [reload])
  const retry = () => { setLoading(true); setError(''); setReload(current => current + 1) }
  useEffect(() => {
    const refresh = () => { setLoading(true); setReload(current => current + 1) }
    window.addEventListener(DIRECTORY_EVENT, refresh)
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(DIRECTORY_EVENT)
    if (channel) channel.onmessage = refresh
    return () => { window.removeEventListener(DIRECTORY_EVENT, refresh); channel?.close() }
  }, [])
  useEffect(() => { if (!loading && !error) batchRef.current?.focus() }, [loading, error])
  const eligible = directory ? eligibleAssessmentStudents(directory) : []
  const batches = [...new Set([...(directory?.batches || []).map(batch => String(batch.id)), ...eligible.map(student => student.batch)].filter(Boolean))].sort().reverse()
  const batchStudents = eligible.filter(student => student.batch === value.assignBatch)
  const years = [...new Set(batchStudents.map(student => student.year))].sort((a, b) => YEARS.indexOf(a) - YEARS.indexOf(b))
  const yearStudents = batchStudents.filter(student => student.year === value.assignYear)
  const groups = [...new Set(yearStudents.map(student => assessmentGroupKey(student.section)).filter(Boolean))].sort()
  const visibleStudents = yearStudents.filter(student => value.assignGroups.map(assessmentGroupKey).includes(assessmentGroupKey(student.section)))
  const studentOptions = visibleStudents.map(student => ({ value: student.id, label: `${student.name} (${student.registrationId || student.id})` }))
  const selectedCount = visibleStudents.filter(student => value.assignStudentIds.includes(student.id)).length
  const valid = !loading && !error && batches.includes(value.assignBatch) && years.includes(value.assignYear)
    && value.assignGroups.length > 0 && value.assignGroups.every(group => groups.includes(assessmentGroupKey(group)))
    && value.assignStudentIds.length > 0 && selectedCount === value.assignStudentIds.length
  useEffect(() => { onValidityChange(Boolean(valid)) }, [valid, onValidityChange])
  const locked = disabled || loading || Boolean(error)
  const changeGroups = nextGroups => {
    const allowed = yearStudents.filter(student => nextGroups.map(assessmentGroupKey).includes(assessmentGroupKey(student.section))).map(student => student.id)
    onChange({ ...value, assignGroups: nextGroups, assignStudentIds: allowed })
  }
  const changeYear = assignYear => {
    const students = batchStudents.filter(student => student.year === assignYear && assessmentGroupKey(student.section))
    onChange({ ...value, assignYear,
      assignGroups: [...new Set(students.map(student => 'SGT Group ' + assessmentGroupKey(student.section)))],
      assignStudentIds: students.map(student => student.id) })
  }
  const wholeYear = yearStudents.length > 0 && selectedCount === yearStudents.length
  const summary = !value.assignYear ? 'Choose a batch and year to select all eligible students.'
    : !selectedCount ? 'No students selected. Choose students to continue.'
    : wholeYear ? 'All ' + selectedCount + ' eligible student' + (selectedCount === 1 ? '' : 's') + ' in ' + value.assignYear + ', Batch ' + value.assignBatch + '.'
    : selectedCount + ' of ' + yearStudents.length + ' eligible students selected in ' + value.assignYear + ', Batch ' + value.assignBatch + '.'
  return <div className="assessment-assignment-fields" aria-busy={loading}>
    <div className="publication-dialog-grid">
      <label>Batch <em>*</em><span className="publication-select"><select ref={batchRef} required disabled={locked} value={value.assignBatch} onChange={event => onChange({ assignBatch: event.target.value, assignYear: '', assignGroups: [], assignStudentIds: [] })}>
        <option value="">{loading ? 'Loading batches...' : 'Select batch'}</option>{batches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
      </select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <label>Year <em>*</em><span className="publication-select"><select required disabled={locked || !value.assignBatch} value={value.assignYear} onChange={event => changeYear(event.target.value)}>
        <option value="">{value.assignBatch ? years.length ? 'Select year' : 'No eligible years' : 'Select batch first'}</option>{years.map(year => <option key={year}>{year}</option>)}
      </select><ChevronDown size={16} aria-hidden="true" /></span></label>
      <ManagementMultiSelect label={<>SGT <em>*</em></>} options={groups.map(group => ({ value: `SGT Group ${group}`, label: `SGT ${group}` }))}
        value={value.assignGroups} onChange={changeGroups} disabled={locked || !value.assignYear}
        placeholder={value.assignYear ? 'Select SGT groups' : 'Select year first'} searchLabel="Search SGT groups" emptyLabel="No eligible SGT groups." allLabel="All SGT groups" allowSelectAll compact floating />
      <ManagementMultiSelect label={<>Student <em>*</em></>} options={studentOptions} value={value.assignStudentIds}
        onChange={assignStudentIds => onChange({ ...value, assignStudentIds })} disabled={locked || !value.assignGroups.length}
        placeholder={value.assignGroups.length ? 'Select students' : 'Select SGT groups first'} searchLabel="Search students" emptyLabel="No eligible students." allLabel="All students" allowSelectAll compact floating />
    </div>
    {error ? <div className="assessment-assignment-error" role="alert"><span>{error}</span><button type="button" disabled={disabled} onClick={retry}>Retry</button></div>
      : <p className="assessment-assignment-status" role="status">{loading ? 'Loading student directory...' : summary}</p>}
    {!loading && !error && value.assignStudentIds.length > selectedCount && <p className="assessment-assignment-error" role="alert">Some selected students are no longer eligible. Clear the student selection and choose again.</p>}
  </div>
}
