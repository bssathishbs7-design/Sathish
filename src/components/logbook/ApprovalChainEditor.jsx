import { useState } from 'react'
import { ArrowUp, ArrowDown, Trash2, ChevronRight } from 'lucide-react'
import { actorName, defaultChain, REVIEWERS, saveApprovalChain } from '../../services/adminLogbook'
import LogbookDrawer from './LogbookDrawer'
import LogbookConfirm from './LogbookConfirm'
import './ApprovalChainEditor.css'

/** Subject-level signing order. Saved changes apply only to future submissions.
 * @param {{chain:string[],subject:string,actor:Object,theme:string,onChanged:Function}} props
 */
export default function ApprovalChainEditor({ chain, subject, actor, theme, onChanged }) {
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(chain)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [discard, setDiscard] = useState(false)
  const changed = JSON.stringify(draft) !== JSON.stringify(chain)
  const close = () => { if (!busy) { if (changed) setDiscard(true); else setOpen(false) } }
  const move = (index, direction) => setDraft(current => { const next = [...current]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next })
  const save = async () => {
    setBusy(true); setError('')
    try { await saveApprovalChain(draft, subject, actor); setOpen(false); onChanged('Approval chain saved.') }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <>
    <div className="faculty-chain-preview">
      <div><strong>Approval order</strong><small>For future submissions</small></div>
      <ol>{chain.map((id, index) => <li key={id}><span className="faculty-chain-number">{index + 1}</span><span>{actorName(id)}</span>{index < chain.length - 1 && <ChevronRight size={14} aria-hidden="true" />}</li>)}</ol>
      <button className="lb-btn" onClick={() => { setDraft(chain); setError(''); setDiscard(false); setOpen(true) }}>Edit</button>
    </div>
    {open && <LogbookDrawer title="Edit approval order" subtitle={subject} theme={theme} onClose={close} busy={busy} variant="compact">
      <div className="lb-drawer-body faculty-chain-body">
        <p className="lb-muted">Approvers sign in the order below. Changes apply to future submissions; current approvals keep their existing order.</p>
        {error && <p className="lb-error" role="alert">{error}</p>}
        {discard && <LogbookConfirm title="Discard approval order changes?" confirmLabel="Discard changes" onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); setOpen(false) }} />}
        <fieldset disabled={busy} className="faculty-fieldset faculty-chain-fields"><legend>Signing order</legend>
          <ol className="faculty-chain-order">{draft.map((id, index) => <li className="faculty-chain-row" key={id}>
            <span className="faculty-chain-number">{index + 1}</span><strong>{actorName(id)}</strong>
            <button className="lb-btn" aria-label={`Move ${actorName(id)} up`} title="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} aria-hidden="true" /></button>
            <button className="lb-btn" aria-label={`Move ${actorName(id)} down`} title="Move down" disabled={index === draft.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} aria-hidden="true" /></button>
            <button className="lb-btn" aria-label={`Remove ${actorName(id)}`} title="Remove approver" disabled={draft.length === 1} onClick={() => setDraft(draft.filter(value => value !== id))}><Trash2 size={16} aria-hidden="true" /></button>
          </li>)}</ol>
          <label className="lb-field">Add approver<select value="" onChange={event => { if (event.target.value) setDraft([...draft, event.target.value]) }}><option value="">Choose approver</option>{REVIEWERS.filter(person => !draft.includes(person.id)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          <button className="lb-btn faculty-chain-reset" onClick={() => setDraft(defaultChain(subject))}>Reset to default order</button>
        </fieldset>
      </div>
      <footer className="lb-drawer-foot faculty-chain-actions"><button className="lb-btn" disabled={busy} onClick={close}>Cancel</button><button className="lb-btn lb-primary" disabled={busy || !changed} onClick={save}>{busy ? 'Saving...' : 'Save order'}</button></footer>
    </LogbookDrawer>}
  </>
}
