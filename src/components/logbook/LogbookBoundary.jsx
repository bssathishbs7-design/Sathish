import { Component } from 'react'
import './LogbookBoundary.css'

/** Isolates rendering failures from the surrounding application shell. */
export default class LogbookBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <section className="lb-boundary" role="alert"><h2>Logbook could not be displayed</h2><p>Your saved records have been kept. Reload to try again.</p><button onClick={() => window.location.reload()}>Reload page</button></section> : this.props.children
  }
}
