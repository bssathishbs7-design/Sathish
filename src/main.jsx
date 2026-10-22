import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { assessmentDemoEnabled } from './services/assessmentDemoSession'

async function startApp() {
  let DemoTools = null
  let initialError = ''
  if (assessmentDemoEnabled()) {
    const [{ installAssessmentDemo }, tools] = await Promise.all([
      import('./services/assessmentDemo/storage.js'), import('./components/AssessmentDemoTools.jsx'),
    ])
    DemoTools = tools.default
    try { installAssessmentDemo() }
    catch (error) { initialError = `Demo data could not be loaded: ${error.message}`; console.error(initialError) }
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode><App />{DemoTools && <DemoTools initialError={initialError} />}</StrictMode>,
  )
}
startApp()
