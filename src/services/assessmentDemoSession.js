/** Local demo mode is automatic for npm run dev, opt-in for preview builds, and disabled with false. */
export const assessmentDemoEnabled = () => import.meta.env?.VITE_ASSESSMENT_DEMO === 'true' || (import.meta.env?.DEV && import.meta.env?.VITE_ASSESSMENT_DEMO !== 'false')
export function persistAssessmentDemoQueue(rows,storage=localStorage) {
 if(!assessmentDemoEnabled() || !storage.getItem('vx-assessment-demo-v1')) return
 try {
  storage.setItem('vx-assessment-demo-queue',JSON.stringify(rows.filter(row=>String(row?.setup?.assessmentId || '').startsWith('demo-assessment-'))))
 } catch (error) {
  console.warn('Demo approval queue could not be mirrored; the current session remains available.', error)
 }
}
