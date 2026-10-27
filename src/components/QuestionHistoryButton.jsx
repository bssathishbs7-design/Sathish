import { useState } from 'react'
import { History } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import CopyIdBadge from './CopyIdBadge'
import { questionDisplayId } from '../utils/questionLifecycle'
import './QuestionHistoryButton.css'
/** Displays persisted provenance and audit events without inventing versions. */
export default function QuestionHistoryButton({ question }) {
  const [open,setOpen] = useState(false)
  return <span className="question-history-control" onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><button type="button" aria-label={`Question history ${questionDisplayId(question)}`} onClick={()=>setOpen(true)}><History size={14}/></button>{open && <SaveChangesDialog title="Question history" description={<CopyIdBadge value={questionDisplayId(question)} label="question ID" />} onCancel={()=>setOpen(false)} cancelLabel="Close">
    {question.draftCode && <p>Draft ID <CopyIdBadge value={question.draftCode} label="draft question ID" /></p>}
    {question.derivedFrom && <p>Derived from <CopyIdBadge value={question.derivedFrom} label="source question ID" /></p>}
    {question.approvedAt && <p>Approved: {new Date(question.approvedAt).toLocaleString()}</p>}
    {(question.history || []).map((event,index)=><p key={index}><strong>{event.action}</strong>{event.timestamp && <> · {new Date(event.timestamp).toLocaleString()}</>}</p>)}
    {!question.history?.length && !question.approvedAt && <p>No recorded changes yet.</p>}
  </SaveChangesDialog>}</span>
}
