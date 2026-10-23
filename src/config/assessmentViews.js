import { Grid2X2, LayoutGrid, List } from 'lucide-react'

export const ASSESSMENT_VIEWS = [
  { value: 'large', label: 'Large cards', icon: LayoutGrid },
  { value: 'medium', label: 'Medium cards', icon: Grid2X2 },
  { value: 'list', label: 'List', icon: List },
]

/** One persisted presentation preference; storage failure must not block the UI. */
export function readAssessmentView() {
  try {
    const saved = localStorage.getItem('medsy-assessment-view')
    return ASSESSMENT_VIEWS.some(view => view.value === saved) ? saved : 'medium'
  } catch { return 'medium' }
}

