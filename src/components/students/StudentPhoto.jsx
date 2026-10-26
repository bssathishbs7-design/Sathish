import { useState, useRef } from 'react'
import { Camera, Upload } from 'lucide-react'
import { prepareStudentPhoto } from '../../services/studentPhoto'
import './StudentPhoto.css'

/** Photo selection is separate from persistence, allowing profile saves to succeed independently. */
export default function StudentPhoto({ value, onChange, disabled = false, onBusyChange }) {
  const input = useRef(null)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [removing, setRemoving] = useState(false)
  return <div className="sm-photo">
    <button type="button" className="sm-photo-tile" disabled={disabled || busy} onClick={() => input.current?.click()} aria-label={value ? 'Change student photo' : 'Upload student photo'}>{value ? <img src={value} alt="Student profile preview" /> : <Camera size={24} />}<span><Upload size={12} />{value ? 'Change photo' : 'Upload photo'}</span><small><span>Optional Max.</span><span>5 MB</span><span>JPG / PNG</span></small></button>
    <label className="sm-photo-input"><span>Photo (optional)</span><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
      setBusy(true); onBusyChange?.(true); setError('')
      try { onChange(await prepareStudentPhoto(file)) } catch (failure) { setError(failure.message) } finally { setBusy(false); onBusyChange?.(false) }
    }} /></label>
    {busy && <p role="status">Preparing photo...</p>}
    {value && !removing && <button type="button" className="lb-btn" disabled={disabled || busy} onClick={() => setRemoving(true)}>Remove photo</button>}
    {removing && <div role="group" aria-label="Confirm photo removal"><p>Remove this photo?</p><button type="button" className="lb-btn" onClick={() => { onChange(''); setRemoving(false) }}>Remove</button><button type="button" className="lb-btn" onClick={() => setRemoving(false)}>Keep photo</button></div>}
    {error && <p role="alert" className="sm-error">{error}</p>}
  </div>
}
