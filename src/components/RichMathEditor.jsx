import { useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  List,
  Pilcrow,
  Sigma,
  Subscript,
  Superscript,
  Underline,
} from 'lucide-react'
import MathText from './MathText'
import {
  hasMathText,
  normalizeFormulaText,
  renderMathTextToHtml,
  stripHtml,
} from '../utils/mathText'

const FORMAT_BUTTONS = [
  { command: 'bold', label: 'Bold', icon: Bold },
  { command: 'italic', label: 'Italic', icon: Italic },
  { command: 'underline', label: 'Underline', icon: Underline },
  { command: 'superscript', label: 'Superscript', icon: Superscript },
  { command: 'subscript', label: 'Subscript', icon: Subscript },
  { command: 'insertUnorderedList', label: 'Bulleted list', icon: List },
]

const encodeAttribute = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const formulaLinePattern = /([=+\-*/^_{}()[\]\\]|\b(frac|sqrt|Delta|alpha|beta|gamma|theta|lambda|mu|pi|sigma|Omega)\b|[\u00b0-\u00b3\u00b5\u00b9\u00bc-\u00be\u2070-\u209c\u2113\u2126\u2190-\u21ff\u2200-\u22ff\u03b1-\u03c9\u0391-\u03a9])/

const renderPlainTextPaste = (text) => text
  .split(/\r?\n/)
  .map((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return '<div><br></div>'

    if (!formulaLinePattern.test(trimmedLine)) {
      return `<div>${escapeHtml(line)}</div>`
    }

    const normalizedLine = normalizeFormulaText(line)
    return [
      '<div>',
      `<span class="rich-math-editor-formula math-text" data-math="${encodeAttribute(normalizedLine)}">`,
      renderMathTextToHtml(normalizedLine),
      '</span>',
      '</div>',
    ].join('')
  })
  .join('')

const readImageFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export default function RichMathEditor({
  value,
  onChange,
  placeholder,
  minRows = 3,
  compact = false,
  ariaLabel,
  allowPastedImages = true,
  onPasteImageRejected,
  toolbarActions = null,
}) {
  const editorRef = useRef(null)
  const currentValue = value ?? ''
  const plainText = stripHtml(currentValue)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || editor.innerHTML === currentValue) return
    editor.innerHTML = currentValue
  }, [currentValue])

  const emitChange = () => {
    onChange?.(editorRef.current?.innerHTML ?? '')
  }

  const runCommand = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    emitChange()
  }

  const insertFormula = () => {
    const formula = window.prompt('Enter formula using LaTeX syntax', '\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}')
    if (!formula?.trim()) return

    const latex = formula.trim()
    const formulaHtml = [
      `<span class="rich-math-editor-formula math-text" data-math="${encodeAttribute(latex)}" contenteditable="false">`,
      renderMathTextToHtml(latex),
      '</span>&nbsp;',
    ].join('')

    editorRef.current?.focus()
    document.execCommand('insertHTML', false, formulaHtml)
    emitChange()
  }

  const handlePaste = (event) => {
    const imageFiles = [...event.clipboardData.files].filter((file) => file.type.startsWith('image/'))
    const html = event.clipboardData.getData('text/html')
    const hasHtmlImage = /<img\b/i.test(html) || /data:image\//i.test(html)
    if (!allowPastedImages && (imageFiles.length || hasHtmlImage)) {
      event.preventDefault()
      onPasteImageRejected?.()
      return
    }

    if (imageFiles.length) {
      event.preventDefault()
      Promise.all(imageFiles.map(readImageFileAsDataUrl))
        .then((imageUrls) => {
          const imageHtml = imageUrls.map((imageUrl) => (
            `<figure class="rich-math-editor-image-formula"><img src="${imageUrl}" alt="Pasted formula" /></figure>`
          )).join('')

          editorRef.current?.focus()
          document.execCommand('insertHTML', false, imageHtml)
          emitChange()
        })
      return
    }

    const text = event.clipboardData.getData('text/plain')
    if (!text) return

    event.preventDefault()
    document.execCommand('insertHTML', false, renderPlainTextPaste(text))
    emitChange()
  }

  return (
    <div className={`rich-math-editor ${compact ? 'is-compact' : ''}`}>
      <div className="rich-math-editor-toolbar" aria-label="Rich text formatting">
        {FORMAT_BUTTONS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.command}
              type="button"
              className="rich-math-editor-tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(item.command)}
              aria-label={item.label}
              title={item.label}
            >
              <Icon size={15} strokeWidth={2.2} />
            </button>
          )
        })}
        <button
          type="button"
          className="rich-math-editor-tool"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('formatBlock', 'p')}
          aria-label="Paragraph"
          title="Paragraph"
        >
          <Pilcrow size={15} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="rich-math-editor-tool is-formula"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertFormula}
          aria-label="Insert formula"
          title="Insert formula"
        >
          <Sigma size={15} strokeWidth={2.2} />
        </button>
        {toolbarActions}
      </div>
      <div
        ref={editorRef}
        className="rich-math-editor-surface"
        contentEditable
        role="textbox"
        aria-label={ariaLabel ?? placeholder}
        data-placeholder={placeholder}
        data-empty={plainText ? 'false' : 'true'}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        style={{ minHeight: `${Math.max(minRows, 1) * 34}px` }}
        suppressContentEditableWarning
      />
      {hasMathText(plainText) ? (
        <div className="rich-math-editor-preview" aria-label="Formula preview">
          <MathText text={plainText} />
        </div>
      ) : null}
    </div>
  )
}
