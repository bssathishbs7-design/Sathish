import { Component } from 'react'
import './DemoVideoBoundary.css'

/** A demo failure must never prevent faculty from using the page underneath. */
export default class DemoVideoBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <aside className="demo-scope demo-failure" data-theme={this.props.theme} role="alert"><p>Demo videos could not open.</p><button onClick={() => this.setState({ failed: false })}>Try again</button><button onClick={this.props.onDisable}>Turn off demos</button></aside>
  }
}
