import { Users, Plus, UserPlus } from 'lucide-react'
import StudentMetrics from './StudentMetrics'
import './StudentManagementHeader.css'

/** Directory introduction, metrics and batch creation action. */
export default function StudentManagementHeader({ canEdit, onAddBatch, onAddStudent, data }) {
  return <header className="sm-intro-grid">
    <section className="sm-intro-copy"><h1>Student Management</h1><p>Manage enrolment, review batches and follow each student's academic journey.</p>{data && <StudentMetrics data={data} />}</section>
    <section className="sm-intro-directory"><span className="sm-directory-eyebrow"><Users size={14} aria-hidden="true"/>Student Directory</span><h2>Manage your student community</h2><p>Create an admission batch to organise students and their academic journey.</p><div className="sm-intro-actions"><button className="lb-btn" disabled={!canEdit || !data} onClick={onAddBatch}><Plus size={16} aria-hidden="true"/>Add New Batch</button><button className="lb-btn" disabled={!canEdit || !data?.batches.length} onClick={onAddStudent} title={!data?.batches.length ? 'Create a batch first' : undefined}><UserPlus size={16} aria-hidden="true"/>Add Students</button></div></section>
  </header>
}
