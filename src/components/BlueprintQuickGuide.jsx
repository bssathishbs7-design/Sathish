import './BlueprintQuickGuide.css'

/** Compact reference for the allocation matrix notation. */
export default function BlueprintQuickGuide() {
  return <section className="blueprint-quick-guide" aria-label="Blueprint quick guide">
    <h4>Quick guide</h4>
    <div className="blueprint-quick-guide-laq">
      <strong>LAQ sub-questions</strong>
      <p><b>1a</b> is the first sub-question of LAQ Question 1. <b>1b</b> is the next one.</p>
    </div>
    <strong className="blueprint-quick-guide-label">SAQ types</strong>
    <ul>{[['D', 'Direct'], ['R', 'Reasoning'], ['C', 'AETCOM'], ['A', 'Application']].map(([initial, label]) =>
      <li key={initial}><span className={'is-' + initial} aria-hidden="true">{initial}</span>{label}</li>
    )}</ul>
  </section>
}
