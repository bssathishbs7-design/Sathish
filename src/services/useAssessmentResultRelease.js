import { useEffect, useRef } from 'react'
import { reconcileAssessmentResults, RESULT_RELEASE_EVENT } from './assessmentResultRelease'

/** Reconcile local results using the shared practice grader and saved faculty marks. */
export default function useAssessmentResultRelease(onReady) {
  const notify = useRef(onReady)
  useEffect(() => { notify.current = onReady }, [onReady])
  useEffect(() => {
    let reportedFailure = false
    const reconcile = () => {
      try {
        const before = JSON.parse(localStorage.getItem('vx-assessment-published') || '[]')
        if (reconcileAssessmentResults()) {
          window.dispatchEvent(new Event(RESULT_RELEASE_EVENT))
          window.dispatchEvent(new Event('vx-assessment-published-changed'))
          const after = JSON.parse(localStorage.getItem('vx-assessment-published') || '[]')
          // Current student identity matches the existing exam and student portal adapters.
          for (const assessment of after) {
            const result = assessment.studentResults?.MC2568
            const previous = before.find(row => row.id === assessment.id)?.studentResults?.MC2568
            if (result?.status === 'published' && previous?.status !== 'published') notify.current?.(`${assessment.assessmentName || 'Assessment'}: your result is ready.`)
          }
        }
        reportedFailure = false
      } catch (error) {
        window.dispatchEvent(new CustomEvent(RESULT_RELEASE_EVENT, { detail: { error: 'Unable to save evaluation. Retrying automatically.' } }))
        if (!reportedFailure) {
          notify.current?.('Unable to save evaluation. Retrying automatically.', 'warning')
          console.warn('Assessment result persistence failed', error)
          reportedFailure = true
        }
      }
    }
    reconcile()
    const timer = window.setInterval(reconcile, 1000)
    window.addEventListener('storage', reconcile)
    return () => { clearInterval(timer); window.removeEventListener('storage', reconcile) }
  }, [])
}
