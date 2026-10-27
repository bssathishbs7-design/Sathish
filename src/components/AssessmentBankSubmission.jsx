import { useState } from 'react'
import CopyIdBadge from './CopyIdBadge'
import AssessmentPublicationDialog from './AssessmentPublicationDialog'
import { createDraftRecordCode } from '../utils/draftReference'
import { appendAssessmentHistory } from '../services/assessmentHistory'
import './AssessmentBankSubmission.css'

/** Submit published assessment-owned questions as independent QB drafts; AQ provenance stays on the bank record. */
export default function AssessmentBankSubmission({ assessment, onSendToApproval, theme }) {
  const [selected,setSelected] = useState([]), [open,setOpen] = useState(false), [notice,setNotice] = useState('')
  const rows = (assessment.questionRows || []).filter(question => question.assessmentQuestionId)
  if (!rows.length) return null
  let pending = [], bank = []
  try { pending = JSON.parse(sessionStorage.getItem('vx-approval-queue-rows') || '[]'); bank = JSON.parse(localStorage.getItem('vx-question-bank-published-questions') || '[]') } catch { return <p role="alert">Question Bank submission status could not be read.</p> }
  const alreadySent = question => bank.some(row => row.derivedFrom === question.assessmentQuestionId) || pending.some(request => request.approvalStatus === 'Pending Approval' && request.questionRows?.some(row => row.derivedFrom === question.assessmentQuestionId))
  const send = async ({ reviewer }) => {
    const questions = rows.filter(question => selected.includes(question.id) && !alreadySent(question))
    if (!questions.length) return false
    const payload = { activityId: `assessment-bank-${crypto.randomUUID()}`, activityType: 'Question Bank', activityName: assessment.assessmentName || 'Assessment questions', approvalStatus: 'Pending Approval', status: 'Pending Approval', approvalFaculty: reviewer,
      questionRows: questions.map(question => ({ ...question, id: `question-${crypto.randomUUID()}`, draftCode: createDraftRecordCode('QB'), derivedFrom: question.assessmentQuestionId, assessmentQuestionId: undefined, questionBankId: undefined, status:'Sent to Approval' })) }
    const result = await onSendToApproval(payload)
    if (!result) return false
    appendAssessmentHistory(assessment,{action:'Assessment questions sent to Question Bank approval',notes:questions.map(question=>question.assessmentQuestionId).join(', ')})
    setSelected([]); setOpen(false); setNotice('Sent to Question Bank approval. Assessment question IDs remain unchanged.')
    return true
  }
  return <section className="assessment-bank-submission"><h3>Questions written in this assessment</h3>{rows.map(question => <label key={question.id}>{onSendToApproval && <input type="checkbox" checked={selected.includes(question.id)} disabled={alreadySent(question)} onChange={event=>setSelected(current=>event.target.checked ? [...current,question.id] : current.filter(id=>id!==question.id))}/>}<CopyIdBadge value={question.assessmentQuestionId} label="assessment question ID" /><span>{alreadySent(question) ? 'Sent to Question Bank' : 'Not sent'}</span></label>)}{onSendToApproval && <button type="button" disabled={!selected.length} onClick={()=>setOpen(true)}>Send to Question Bank</button>}{notice && <p role="status">{notice}</p>}{open && <AssessmentPublicationDialog action="Send to Approval" name={assessment.assessmentName} theme={theme} onCancel={()=>setOpen(false)} onConfirm={send}/>}</section>
}
