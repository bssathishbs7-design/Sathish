import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { approvalQueueSamples } from './services/approvalQueueSamples'
import { restoreQueueCache } from './services/approvalQueue'
import { assessmentDemoEnabled } from './services/assessmentDemoSession'

async function startApp() {
  let DemoTools = null
  let initialError = ''
  if (assessmentDemoEnabled()) {
    const [{ installAssessmentDemo }, tools] = await Promise.all([
      import('./services/assessmentDemo/storage.js'), import('./components/AssessmentDemoTools.jsx'),
    ])
    DemoTools = tools.default
    try {
      const key = 'vx-approval-queue-rows'
      const cached = restoreQueueCache(localStorage)
      if (!sessionStorage.getItem(key) && cached) sessionStorage.setItem(key, JSON.stringify(cached))
      installAssessmentDemo()
      const merged = JSON.parse(sessionStorage.getItem(key) || '[]')
      if (!localStorage.getItem('medsy-approval-samples-v1')) {
        merged.push(...approvalQueueSamples().filter(row => !merged.some(item => item.id === row.id)))
        sessionStorage.setItem(key, JSON.stringify(merged))
        localStorage.setItem('medsy-approval-samples-v1', '1')
      } else sessionStorage.setItem(key, JSON.stringify(merged))
    }
    catch (error) { initialError = `Demo data could not be loaded: ${error.message}`; console.error(initialError) }
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode><App />{DemoTools && <DemoTools initialError={initialError} />}</StrictMode>,
  )
}
startApp()
