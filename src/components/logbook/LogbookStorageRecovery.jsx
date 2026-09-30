import { useState } from 'react'
import { startSeparateLogbook } from '../../services/logbook'
import './LogbookStorageRecovery.css'

/** Non-destructive recovery when an HTML prototype shares the previous storage namespace. */
export default function LogbookStorageRecovery({ message }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  if (!message?.includes('HTML prototype data')) return null
  return <div className="lb-storage-recovery"><p>Your HTML prototype records will remain untouched. A separate app Logbook starts with the app’s sample records.</p>{error && <p role="alert">{error}</p>}<button className="lb-btn" disabled={busy} onClick={async () => { setBusy(true); try { await startSeparateLogbook() } catch (failure) { setError(failure.message); setBusy(false) } }}>{busy ? 'Starting…' : 'Start separate app Logbook'}</button></div>
}
