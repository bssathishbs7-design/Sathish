import { BookOpen, Lightbulb } from 'lucide-react'
import './BlueprintQuickGuide.css'

/** Reference for question notation, allocation sources and matrix values. */
export default function BlueprintQuickGuide({ onSuggestions, suggestionsOpen = false }) {
  return <section className="blueprint-quick-guide" aria-label="Blueprint quick guide">
    <header className="blueprint-quick-guide-header">
      <h4><BookOpen size={22} aria-hidden="true" /><span>Quick Guide</span></h4>
    </header>
    <div className="blueprint-quick-guide-sections">
      <div className="blueprint-quick-guide-section">
        <strong>Long-Answer Questions (LAQ)</strong>
        <div className="blueprint-quick-guide-parts"><p><b>1a</b> = Question 1, Part a</p><p><b>1b</b> = Question 1, Part b</p></div>
      </div>
      <div className="blueprint-quick-guide-section">
        <strong>Short-Answer Types (SAQ)</strong>
        <ul>{[['D', 'Direct'], ['R', 'Reasoning'], ['C', 'AETCOM'], ['A', 'Application']].map(([initial, label]) =>
          <li key={initial}><span className={'is-' + initial}>{initial}</span>{label}</li>
        )}</ul>
      </div>
      <div className="blueprint-quick-guide-section">
        <strong>Allocation Source</strong>
        <div className="blueprint-allocation-legend" aria-label="Allocation Source"><span className="is-manual">Manual: Allocated By You</span><span className="is-auto">Auto-Filled: Allocated Automatically</span></div>
      </div>
    </div>
    <button type="button" className="blueprint-guide-suggestions" onClick={onSuggestions} aria-expanded={suggestionsOpen}><Lightbulb size={18} aria-hidden="true" />Suggestions</button>
  </section>
}
