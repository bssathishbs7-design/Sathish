import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import CopyIdBadge from './CopyIdBadge'
import { formatQid, MAX_SEQUENCE } from '../utils/qid'
import { CURRENT_INSTITUTION_CODE } from '../config/institution'
import './IdGuideDialog.css'

const sections = [
  ['Skills', 'SA', '9QH3WD', 12, 'First assigned', 'Skill activity draft', 'Given when the activity is created in Configuration. Used until the activity is first assigned.', 'Assigned skill activity', 'Replaces the draft ID when the activity is first assigned. The same ID shows on Evaluation, Dashboard, My Skill Activity and the Logbook.'],
  ['Assessment', 'AP', '7K2M9Q', 14, 'Published', 'Assessment draft', 'Given when the assessment is created. Used while it is a draft or waiting for approval.', 'Published assessment', 'Replaces the draft ID when the assessment is published, directly or after approval; never changes after that. Earlier ones read SRMC-AP-26-01 and stay valid.'],
  ['Blueprint', 'BP', '4F7Q2M', 3, 'Approved', 'Blueprint draft', 'Paired with its assessment draft until the blueprint is approved. Deleting the assessment deletes its blueprint.', 'Approved blueprint', 'Given when the blueprint is approved. It is stored in Saved Templates for reuse, stays there if the assessment is deleted, and keeps the same ID through revisions. Earlier ones read SRMC-BP-26-01 and stay valid.'],
  ['Question Bank', 'QB', '7K2M9Q', 13, 'Approved', 'Question draft', 'A new or edited Question Bank question before approval. Earlier drafts read DRF-7K2M9QX4 and stay valid.', 'Institution question', 'Replaces the draft ID when the question is approved into the Question Bank. An approved edit keeps the same ID and replaces the content without adding a version.'],
]
function Flow({ draft, permanent, event }) {
  return <div className="id-guide-flow"><div><CopyIdBadge value={draft} label="draft ID" /><small>Temporary</small></div><div className="id-guide-arrow"><span aria-hidden="true" /><small>{event}</small></div><div><CopyIdBadge value={permanent} label="permanent ID" /><small>Permanent</small></div></div>
}
/** Profile-menu legend. Native modal traps focus and restores the trigger on close. */
export default function IdGuideDialog({ onClose, theme }) {
  const dialog = useRef(null)
  useEffect(() => {
    const previous = document.activeElement, trigger = document.querySelector('.vx-profile-trigger'), node = dialog.current
    node.showModal()
    return () => { node.close(); (previous?.isConnected && previous !== document.body ? previous : trigger)?.focus() }
  }, [])
  return createPortal(<div className={theme === 'dark' ? 'theme-dark' : ''}><dialog ref={dialog} className={`id-guide-dialog qb-sort-scope ${theme === 'dark' ? 'theme-dark' : ''}`} aria-labelledby="id-guide-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <header><div><h2 id="id-guide-title">ID guide</h2><p>Draft IDs are temporary. Permanent IDs never change.</p></div><button type="button" onClick={onClose} aria-label="Close ID guide"><X size={20}/></button></header>
    <div className="id-guide-content"><section><h3>How an ID changes</h3><Flow draft="DRF-AP-7K2M9Q" permanent={formatQid('AP',14)} event="Assigned, published or approved" /></section>
    <details className="id-guide-topic" name="id-guide-topic"><summary><h3>Reading an ID</h3><ChevronDown size={16} aria-hidden="true" /></summary><dl><dt>{CURRENT_INSTITUTION_CODE} — Institution</dt><dd>MED for Medsy, DRF for drafts</dd><dt>AP — Type</dt><dd>SA, AP, BP, QB or AQ</dd><dt>00149 — Number</dt><dd>Counts up and never restarts. The last digit is a check digit</dd></dl><p>Questions (QB, AQ): 7 digits <CopyIdBadge value={formatQid('QB',13)} label="question ID" /></p><p>Skill activity, assessment, blueprint (SA, AP, BP): 5 digits <CopyIdBadge value={formatQid('AP',14)} /></p><p>Maximum, any type: 12 digits <CopyIdBadge value={formatQid('QB',MAX_SEQUENCE)} label="question ID" /></p><p>Every type uses the same shape. The check digit catches a mistyped ID. A draft ID has random letters in place of the number (DRF-AP-7K2M9Q) and is replaced by the permanent ID.</p></details>
    {sections.map(([title,type,token,sequence,event,draftName,draftText,name,text]) => <details className="id-guide-topic" name="id-guide-topic" key={type}><summary><h3>{title}</h3><span>{type}</span><ChevronDown size={16} aria-hidden="true" /></summary><Flow draft={`DRF-${type}-${token}`} permanent={formatQid(type,sequence)} event={event}/><p><strong>{draftName}</strong> — {draftText}</p><p><strong>{name}</strong> — {text}</p>{type === 'BP' && <p>Never sent for approval: stays a draft. Approved IDs are kept through revisions.</p>}{type === 'QB' && <><p>Own edit approved: same ID, no version.</p><Flow draft="DRF-AQ-3PX8RN" permanent={formatQid('AQ',13)} event="Assessment published"/><p><strong>Assessment question draft</strong> — A question written or edited inside an assessment, until that assessment is published.</p><p><strong>Assessment question</strong> — Replaces the draft ID when its assessment is published. Earlier ones read SRMC-AS-… and stay valid.</p><p>Sent to the bank, approved → <CopyIdBadge value={formatQid('QB',14)} label="question ID" /> New ID</p><p><CopyIdBadge value={formatQid('QB',1,'MED')} label="Medsy question ID" /> <strong>Medsy question</strong> — Supplied by Medsy. Editing one creates a new institution question after approval: <CopyIdBadge value={formatQid('QB',15)} label="question ID" /></p></>}</details>)}
    </div>
  </dialog></div>, document.body)
}
