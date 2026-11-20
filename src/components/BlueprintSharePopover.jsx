import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Mail, MessageCircle, Send, X } from 'lucide-react'
import './BlueprintSharePopover.css'

/** Share one saved blueprint. Native sharing requires the user to choose the target app;
 * fallback drafts cannot attach files and therefore download them for manual attachment.
 * @param {{template:Object,anchor:HTMLElement,onClose:Function}} props
 */
export default function BlueprintSharePopover({ template, anchor, onClose }) {
  const panel = useRef(null)
  const [channel, setChannel] = useState('whatsapp')
  const [format, setFormat] = useState('pdf')
  const [prepared, setPrepared] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const lock = useRef(false)
  const [position, setPosition] = useState({ left: 16, top: 16 })
  useLayoutEffect(() => {
    const place = () => {
      const rect = anchor.getBoundingClientRect(), box = panel.current.getBoundingClientRect()
      setPosition({ left: Math.max(12, Math.min(rect.right - box.width, window.innerWidth - box.width - 12)), top: Math.max(12, rect.bottom + box.height + 12 < window.innerHeight ? rect.bottom + 8 : rect.top - box.height - 8) })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [anchor, error, message, prepared])
  useEffect(() => {
    panel.current.querySelector('input')?.focus()
    const outside = event => { if (!panel.current?.contains(event.target) && !anchor.contains(event.target)) onClose() }
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const elements = [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')]
        const first = elements[0], last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard); if (anchor.isConnected) anchor.focus() }
  }, [anchor, onClose])
  useEffect(() => {
    let cancelled = false
    setError(''); setMessage('')
    import('../services/blueprintTemplateExport.js').then(async module => {
      const formats = format === 'both' ? ['pdf', 'excel'] : [format]
      const files = await Promise.all(formats.map(value => module.createBlueprintFile(template, value)))
      if (!cancelled) setPrepared({ format, files, download: module.downloadBlueprintFile })
    }).catch(failure => { if (!cancelled) setError(`Unable to prepare files: ${failure.message}`) })
    return () => { cancelled = true }
  }, [template, format])
  const ready = prepared?.format === format
  const nativeShare = ready && typeof navigator.share === 'function' && navigator.canShare?.({ files: prepared.files })
  const send = async () => {
    if (!ready || lock.current) return
    lock.current = true; setSending(true); setError(''); setMessage('')
    try {
      if (nativeShare) {
        await navigator.share({ files: prepared.files, title: template.name, text: `Blueprint: ${template.name}` })
        setMessage('Files handed to the selected sharing app.')
      } else {
        const text = `Blueprint: ${template.name}\nPlease attach the downloaded blueprint files: ${prepared.files.map(file => file.name).join(', ')}.`
        if (channel === 'whatsapp') {
          const draft = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
          if (draft) draft.opener = null
          else throw new Error('Allow pop-ups, then click Send again to open WhatsApp.')
        } else {
          const link = document.createElement('a')
          link.href = `mailto:?subject=${encodeURIComponent(`Blueprint: ${template.name}`)}&body=${encodeURIComponent(text)}`
          link.click()
        }
        prepared.files.forEach(prepared.download)
        setMessage('Files downloaded. Attach them in the draft, choose a recipient, and confirm sending.')
      }
    } catch (failure) {
      if (failure.name === 'AbortError') setMessage('Sharing cancelled. Nothing was sent by this app.')
      else setError(failure.message || 'Unable to open sharing. Please try again.')
    } finally { lock.current = false; setSending(false) }
  }
  return createPortal(<section ref={panel} className="blueprint-share-popover qb-sort-scope" role="dialog" aria-modal="true" aria-labelledby="blueprint-share-title" style={position}>
    <header><h3 id="blueprint-share-title">Share blueprint</h3><button type="button" aria-label="Close share options" onClick={onClose}><X size={16} /></button></header>
    <p className="blueprint-share-name">{template.name}</p>
    <fieldset disabled={sending}><legend>Share via</legend>
      <label><input type="radio" name="blueprint-share-channel" checked={channel === 'whatsapp'} onChange={() => setChannel('whatsapp')} /><MessageCircle size={16} />WhatsApp Share</label>
      <label><input type="radio" name="blueprint-share-channel" checked={channel === 'email'} onChange={() => setChannel('email')} /><Mail size={16} />Email Share</label>
    </fieldset>
    <fieldset disabled={sending}><legend>File format</legend><div className="blueprint-share-formats">
      {[['pdf', 'PDF'], ['excel', 'Excel'], ['both', 'Both']].map(([value, label]) => <label key={value}><input type="radio" name="blueprint-share-format" checked={format === value} onChange={() => setFormat(value)} />{label}</label>)}
    </div></fieldset>
    <p>{nativeShare ? `Choose ${channel === 'whatsapp' ? 'WhatsApp' : 'your email app'} in the share sheet, then select a recipient.` : 'Files will download. Attach them manually in the WhatsApp or email draft.'}</p>
    {!ready && !error && <p role="status">Preparing files…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <button className="blueprint-share-send" type="button" disabled={!ready || sending} onClick={send}><Send size={16} />{sending ? 'Opening…' : 'Send'}</button>
  </section>, document.body)
}
