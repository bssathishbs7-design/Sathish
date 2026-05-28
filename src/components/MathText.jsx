import '../styles/math-text.css'
import { renderMathTextToHtml } from '../utils/mathText'

export default function MathText({ text, children, className = '' }) {
  const value = String(text ?? children ?? '')

  return (
    <span
      className={`math-text ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMathTextToHtml(value) }}
    />
  )
}
