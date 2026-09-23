import { useState } from 'react'
import LogbookDrawer from './LogbookDrawer'
import { LEARNERS, REVIEWERS } from '../../services/logbookPeople'
import './LogbookAccountDrawer.css'

/** Account preview for the local prototype; production supplies an authenticated session. */
export default function LogbookAccountDrawer({ mode, account, theme, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const accounts = mode === 'faculty' ? REVIEWERS : LEARNERS
  return <LogbookDrawer title="Logbook account" subtitle="Sample accounts for previewing the connected workflow." theme={theme} onClose={onClose}>
    <div className="lb-drawer-body lb-stack"><label className="lb-field">Find account<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      {accounts.filter(person => [person.name, person.id, ...(person.departments || [])].join(' ').toLowerCase().includes(query.toLowerCase())).map(person => <button key={person.id} className="lb-account-row" aria-pressed={person.id === account.id} onClick={() => onSelect(person.id)}><strong>{person.name}</strong><small>{person.role === 'Faculty' ? person.departments.join(' / ') : person.role} · {person.id}</small></button>)}
    </div>
  </LogbookDrawer>
}
