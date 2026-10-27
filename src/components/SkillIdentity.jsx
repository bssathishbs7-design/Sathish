import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import CopyIdBadge from './CopyIdBadge'
import SaveChangesDialog from './SaveChangesDialog'
import { ensureSkillIdentity, skillIdentityKey } from '../services/skillIdentity'
import './SkillIdentity.css'

/** Shared skill ID and history; assignment instances resolve to their immutable source activity key. */
export default function SkillIdentity({ record, assigned = false }) {
  const [identity, setIdentity] = useState(null), [error, setError] = useState(''), [open, setOpen] = useState(false)
  const key = skillIdentityKey(record)
  const { activityCode, draftCode, createdAt, assignedAt } = record
  useEffect(() => {
    let alive = true
    Promise.resolve().then(() => ensureSkillIdentity({ id: key, activityCode, draftCode, createdAt, assignedAt }, assigned)).then(value => { if (alive) { setIdentity(value); setError('') } }, reason => { if (alive) setError(reason.message) })
    return () => { alive = false }
  }, [key, assigned, activityCode, draftCode, createdAt, assignedAt])
  return <span className="skill-identity" onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
    {identity && <><CopyIdBadge value={identity.code} label="skill activity ID" /><button type="button" aria-label={`Activity history ${identity.code}`} title="Activity history" onClick={() => setOpen(true)}><History size={14}/></button></>}
    {error && <small role="alert">{error}</small>}
    {open && <SaveChangesDialog title="Activity history" description={<CopyIdBadge value={identity.code} label="skill activity ID" />} onCancel={() => setOpen(false)} cancelLabel="Close"><ol>{identity.history.map((event,index) => <li key={index}><strong>{event.action}</strong> <CopyIdBadge value={event.code} label="skill activity ID" /><p>{new Date(event.timestamp).toLocaleString()}</p></li>)}</ol></SaveChangesDialog>}
  </span>
}
