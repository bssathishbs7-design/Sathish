import { Check, RotateCcw } from 'lucide-react'
import './BlueprintAdjustments.css'

/** Clickable row allocations; the page owns applying and undoing changes.
 * @param {{suggestion:object|null,onApply:Function,onUndo:Function,canUndo:boolean}} props
 */
export default function BlueprintAdjustments({ suggestion, onApply, onUndo, canUndo }) {
  if (!suggestion) return null
  const item = suggestion
  return (
    <tr className="blueprint-row-suggestion">
      <td colSpan={8}>
        <div className="blueprint-row-suggestion-content" role="group" aria-label={`${item.label} possible allocations`}>
          <div className="blueprint-allocation-cards">
            {item.options.map(option => (
              <button
                type="button"
                className={`blueprint-allocation-card${!option.canApply ? ' is-selected' : ''}`}
                key={option.id}
                aria-pressed={!option.canApply}
                aria-label={`${item.label}: ${option.totalMarks} marks, ${option.totalQuestions} questions, LoT ${option.lotQuestions}, HoT ${option.hotQuestions}`}
                title={`LoT ${option.lotQuestions} × ${option.perQuestionMarks} = ${option.lotMarks} marks; HoT ${option.hotQuestions} × ${option.perQuestionMarks} = ${option.hotMarks} marks. Leaves LoT ${option.remainingLot} and HoT ${option.remainingHot} marks.`}
                onClick={() => { if (option.canApply) onApply(option) }}
              >
                <span className="blueprint-allocation-title">{option.totalMarks} marks · {option.totalQuestions} {option.totalQuestions === 1 ? 'question' : 'questions'}</span>
                <span className="blueprint-allocation-split">LoT {option.lotQuestions} · HoT {option.hotQuestions}</span>
                {!option.canApply && <Check className="blueprint-allocation-check" size={13} aria-hidden="true" />}
              </button>
            ))}
            {item.selected && <div className="blueprint-allocation-card is-selected is-readonly" aria-label="Selected LAQ parts; edit in the LAQ editor" title={item.message}>
              <span className="blueprint-allocation-title">{item.selected.hotMarks + item.selected.lotMarks} marks · {item.selected.totalQuestions} LAQ {item.selected.totalQuestions === 1 ? 'question' : 'questions'}</span>
              <span className="blueprint-allocation-split">LoT {item.selected.lotQuestions} · HoT {item.selected.hotQuestions} parts</span>
              <Check className="blueprint-allocation-check" size={13} aria-hidden="true" />
            </div>}
            {canUndo && <button className="blueprint-allocation-undo" type="button" onClick={onUndo} aria-label={`Undo ${item.label} recommendation`}><RotateCcw size={12} aria-hidden="true" />Undo</button>}
          </div>
          {!item.options.length && !item.selected && item.message && <span className="blueprint-row-suggestion-meta">{item.message}</span>}
        </div>
      </td>
    </tr>
  )
}
