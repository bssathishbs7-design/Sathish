import { Plus, UserPlus } from 'lucide-react'
import StudentMetrics from './StudentMetrics'
import './StudentManagementHeader.css'
/** Reuses the Admin Logbook overview composition and its shared visual primitives. */
export default function StudentManagementHeader({ canEdit, onAddBatch, onAddStudent, data }) {
 return <div className="sm-directory-overview"><header className="my-skills-overview lb-page-head admin-page-head"><div className="my-skills-overview-main"><div className="my-skills-overview-copy"><h1>Student management</h1><p>Manage admission batches and follow each student's academic journey.</p></div>{data && <StudentMetrics data={data} />}</div><div className="my-skills-live-card lb-create-card admin-action-card"><div className="my-skills-live-card-body"><strong>Organise your students</strong><p>Create a batch, set its academic calendar and onboard students.</p></div><div className="sm-header-actions"><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!canEdit || !data} onClick={onAddBatch}><Plus size={16} />Add batch</button><button className="tool-btn my-skills-live-card-cta lb-new-entry-btn" disabled={!canEdit || !data?.batches.length} onClick={onAddStudent} title={!data?.batches.length ? 'Create a batch before adding a student' : undefined}><UserPlus size={16} />Add student</button></div></div></header></div>
}
