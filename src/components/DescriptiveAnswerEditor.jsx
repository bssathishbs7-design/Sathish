import { useEffect, useId, useRef, useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2, ImagePlus, Table2 } from 'lucide-react'
import { sanitizeRichHtml } from '../utils/sanitizeHtml'
import { answerHtml, escapeAnswerText, hasAnswerContent, uploadAnswerImage } from '../services/richAnswers'
import './DescriptiveAnswerEditor.css'

const tools = [['bold', 'Bold', Bold], ['italic', 'Italic', Italic], ['underline', 'Underline', Underline], ['insertUnorderedList', 'Bullet list', List], ['insertOrderedList', 'Numbered list', ListOrdered], ['undo', 'Undo', Undo2], ['redo', 'Redo', Redo2]]

/** One answerable leaf. onChange receives {format:'html',html:string}.
 * onBusyChange(editorId, boolean) lets the exam prevent submission during uploads.
 * Legacy string values are escaped before rendering. disabled locks every edit action.
 */
export default function DescriptiveAnswerEditor({ value, onChange, disabled = false, 'aria-label': ariaLabel, onBusyChange }) {
  const id = useId()
  const editor = useRef(null)
  const fileInput = useRef(null)
  const selection = useRef(null)
  const callbacks = useRef({ onChange, onBusyChange, disabled })
  const mounted = useRef(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [more, setMore] = useState(false)
  const [cell, setCell] = useState(null)
  const [image, setImage] = useState(null)
  const [active, setActive] = useState({})
  const locked = disabled || busy
  useEffect(() => { callbacks.current = { onChange, onBusyChange, disabled } }, [onChange, onBusyChange, disabled])
  useEffect(() => {
    const html = sanitizeRichHtml(answerHtml(value))
    if (editor.current && editor.current.innerHTML !== html) editor.current.innerHTML = html
  }, [value])
  useEffect(() => {
    mounted.current = true
    const track = () => {
      const selected = window.getSelection()
      if (!selected?.rangeCount || !editor.current?.contains(selected.anchorNode) || !editor.current.contains(selected.focusNode)) return
      selection.current = selected.getRangeAt(0).cloneRange()
      const node = selected.anchorNode.nodeType === 1 ? selected.anchorNode : selected.anchorNode.parentElement
      setCell(node.closest('td,th'))
      setActive(Object.fromEntries(tools.slice(0, 5).map(([command]) => [command, document.queryCommandState(command)])))
    }
    document.addEventListener('selectionchange', track)
    return () => { mounted.current = false; document.removeEventListener('selectionchange', track); callbacks.current.onBusyChange?.(id, false) }
  }, [id])
  const emit = () => {
    if (callbacks.current.disabled) return
    callbacks.current.onChange({ format: 'html', html: sanitizeRichHtml(editor.current.innerHTML) })
  }
  const restore = () => {
    editor.current.focus()
    const selected = window.getSelection()
    selected.removeAllRanges()
    const range = selection.current
    if (range && editor.current.contains(range.commonAncestorContainer)) selected.addRange(range)
    else { const end = document.createRange(); end.selectNodeContents(editor.current); end.collapse(false); selected.addRange(end) }
  }
  const command = (name, argument = null) => {
    if (locked) return
    restore()
    document.execCommand('styleWithCSS', false, false)
    document.execCommand(name, false, argument)
    emit()
  }
  const replaceNode = (node, html) => {
    const range = document.createRange()
    range.selectNode(node)
    selection.current = range
    command(html ? 'insertHTML' : 'delete', html || null)
    setCell(null)
    setImage(null)
  }
  const editTable = action => {
    if (!cell || !editor.current.contains(cell)) return
    const table = cell.closest('table')
    const copy = table.cloneNode(true)
    const rowIndex = cell.parentElement.rowIndex
    const columnIndex = cell.cellIndex
    if (action === 'delete') return replaceNode(table, '')
    if (action === 'row' && copy.rows.length < 20) {
      const row = copy.insertRow(rowIndex + 1)
      for (let i = 0; i < table.rows[0].cells.length; i++) row.insertCell().innerHTML = '<br>'
    }
    if (action === 'column' && copy.rows[0].cells.length < 8) Array.from(copy.rows).forEach(row => { row.insertCell(columnIndex + 1).innerHTML = '<br>' })
    if (action === 'remove-row') { if (copy.rows.length === 1) return replaceNode(table, ''); copy.deleteRow(rowIndex) }
    if (action === 'remove-column') { if (copy.rows[0].cells.length === 1) return replaceNode(table, ''); Array.from(copy.rows).forEach(row => row.deleteCell(columnIndex)) }
    replaceNode(table, copy.outerHTML)
  }
  const upload = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || locked) return
    if (editor.current.querySelectorAll('img').length >= 3) { setError('Use up to three images per answer. Remove an image to add another.'); return }
    setError(''); setBusy(true); onBusyChange?.(id, true)
    try {
      const result = await uploadAnswerImage(file)
      if (!mounted.current || callbacks.current.disabled) return
      restore()
      document.execCommand('insertHTML', false, `<img src="${result.url}" alt="${escapeAnswerText(result.name)}" width="100%"><p><br></p>`)
      emit()
    } catch (reason) { if (mounted.current) setError(reason.message) }
    finally { if (mounted.current) setBusy(false); callbacks.current.onBusyChange?.(id, false) }
  }
  return <div className="descriptive-editor" data-locked={disabled || undefined}>
    {!disabled && <div className="descriptive-editor-toolbar" role="group" aria-label="Answer formatting">
      {tools.map(([name, label, glyph], index) => { const Glyph = glyph; return <button className={index > 2 ? `descriptive-editor-extra ${more ? 'is-visible' : ''}` : ''} key={name} type="button" title={label} aria-label={label} aria-pressed={index < 5 ? Boolean(active[name]) : undefined} disabled={locked} onMouseDown={event => event.preventDefault()} onClick={() => command(name)}><Glyph size={16} /></button> })}
      <button type="button" title="Insert 2 by 2 table" aria-label="Insert table" disabled={locked} onMouseDown={event => event.preventDefault()} onClick={() => command('insertHTML', '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>')}><Table2 size={16} /></button>
      <button type="button" title="Upload image (PNG, JPEG or WebP, up to 512 KB)" aria-label="Upload image" disabled={locked} onMouseDown={event => event.preventDefault()} onClick={() => fileInput.current.click()}><ImagePlus size={16} /></button>
      <button className="descriptive-editor-more" type="button" aria-expanded={more} onClick={() => setMore(!more)}>More</button>
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={upload} />
    </div>}
    {!disabled && cell && editor.current?.contains(cell) && <div className="descriptive-editor-context" role="group" aria-label="Table controls">{[['row','Add row'],['column','Add column'],['remove-row','Remove row'],['remove-column','Remove column'],['delete','Delete table']].map(([action,label]) => <button type="button" key={action} disabled={locked || (action === 'row' && cell.closest('table').rows.length >= 20) || (action === 'column' && cell.closest('table').rows[0].cells.length >= 8)} onMouseDown={event => event.preventDefault()} onClick={() => editTable(action)}>{label}</button>)}</div>}
    {!disabled && image && editor.current?.contains(image) && <div className="descriptive-editor-context" role="group" aria-label="Image controls">{[25,50,100].map(width => <button key={width} type="button" disabled={locked} onMouseDown={event => event.preventDefault()} onClick={() => { const copy = image.cloneNode(); copy.setAttribute('width', `${width}%`); replaceNode(image, copy.outerHTML) }}>{width}%</button>)}<button type="button" disabled={locked} onClick={() => replaceNode(image, '')}>Remove image</button></div>}
    <div ref={editor} className="descriptive-editor-content" contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={ariaLabel} aria-readonly={disabled} aria-busy={busy} data-empty={!hasAnswerContent(value)} data-descriptive-answer="true" onInput={emit} onBlur={emit} onClick={event => setImage(event.target.tagName === 'IMG' ? event.target : null)} onPaste={event => { event.preventDefault(); command('insertText', event.clipboardData.getData('text/plain')) }} onDrop={event => event.preventDefault()} />
    {busy && <span role="status" className="descriptive-editor-note">Saving image… Please wait before submitting.</span>}
    {error && <span role="alert" className="descriptive-editor-error">{error}</span>}
  </div>
}
