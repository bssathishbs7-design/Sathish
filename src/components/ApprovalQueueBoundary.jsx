import { Component } from 'react'
import './ApprovalQueueBoundary.css'

/** Contains queue-render errors so the surrounding navigation stays available. */
export default class ApprovalQueueBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <section className="approval-queue-scope aq-error" role="alert"><h2>Unable to display the approval queue</h2><p>Your saved requests have not been changed. Reload to try again.</p><button onClick={() => window.location.reload()}>Reload queue</button></section>
  }
}
