import './BlueprintApprovalSummary.css'
/** @param {{flow:Object}} props Immutable blueprint submission and decision metadata. */
export default function BlueprintApprovalSummary({ flow }) {
 const snapshot = flow?.snapshot || {}
 const draft = snapshot.blueprintDraft || {}
 return <section className="blueprint-approval-summary">
  <header><strong>{flow?.blueprintId || 'Blueprint'}</strong><span>{flow?.status || 'Draft'} / Revision {flow?.revision || 1}</span></header>
  <p>{draft.subject || 'Subject not specified'} · {(draft.topics || []).join(', ')} · {draft.totalMark || 0} marks</p>
  {flow?.reviewRemarks && <p><strong>Reviewer remarks:</strong> {flow.reviewRemarks}</p>}
  <div className="blueprint-approval-table"><table><thead><tr><th>Requirement</th><th>Questions</th><th>Marks each</th><th>Total marks</th></tr></thead><tbody>
   {(snapshot.pickerRows || []).map((row,index) => <tr key={row.id || index}><td>{row.label || row.questionType || row.type || `Requirement ${index + 1}`}{row.topic ? ` / ${row.topic}` : ''}{row.competency ? ` / ${row.competency}` : ''}{row.level ? ` / ${row.level}` : ''}<div>{(row.parts || []).map(part => <small key={part.id}>Part {part.part}: {part.competency} / {part.level} / {part.marks} marks; </small>)}</div></td><td>{row.count}</td><td>{row.marks}</td><td>{Number(row.count) * Number(row.marks)}</td></tr>)}
  </tbody></table></div>
 </section>
}
