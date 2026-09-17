import { completePracticeTagAnalytics } from '../services/practiceTagAnalytics'
import { useEffect, useRef } from 'react'
import { AssessmentAnalyticsGraphGrid } from './AssessmentOverallAnalyticsDashboard'
import './CompetencyLearningGraphs.css'

/**
 * Read-only coverage graphs with keyboard navigation between chart data points.
 * @param {{analytics: Object<string, {total: number, unclassified: number, items: Array<{label: string, value: number, percentage: number}>}>}} props
 */
export default function CompetencyLearningGraphs({ analytics: sourceAnalytics }) {
  const analytics = completePracticeTagAnalytics(sourceAnalytics)
  const root = useRef(null)
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('clg-revealed')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.15 })
    root.current.querySelectorAll('.aoa-panel').forEach(panel => observer.observe(panel))
    return () => observer.disconnect()
  }, [])
  const items = Object.fromEntries(Object.entries(analytics).map(([key, group]) => [key, group.items]))
  const navigatePoints = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const chart = event.target.closest('.aoa-panel')
    const points = [...(chart?.querySelectorAll('[tabindex="0"]') ?? [])]
    const index = points.indexOf(event.target)
    if (index < 0) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + points.length) % points.length
    points[next].focus()
  }
  return (
    <section ref={root} className="clg" aria-label="Learning coverage across completed attempts" onKeyDown={navigatePoints}>
      <AssessmentAnalyticsGraphGrid tagAnalytics={items} coverage />
    </section>
  )
}
