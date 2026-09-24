import { useEffect, useState } from 'react'

export const ADMIN_LOGBOOK_SECTIONS = ['Overview', 'Queue', 'Students', 'Subjects', 'Categories', 'Skills', 'History', 'Sign-offs', 'Search']
const readView = () => {
  const params = new URLSearchParams(window.location.search)
  const section = params.get('view') || 'Overview'
  return { section: ADMIN_LOGBOOK_SECTIONS.includes(section) ? section : 'Overview', id: params.get('id') || '', subject: params.get('subject') || '', query: params.get('query') || '', status: params.get('status') || '', category: params.get('category') || '', show: params.get('show') || 'all', range: params.get('range') || 'all' }
}
/** App-owned URL state: navigation pushes history; filter changes replace it. */
export default function useAdminLogbookRoute() {
  const [view, setView] = useState(readView)
  useEffect(() => { const pop = () => setView(readView()); window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop) }, [])
  const navigate = (next, replace = false) => {
    const params = new URLSearchParams()
    Object.entries(next).forEach(([key, value]) => { if (value && value !== 'all' && value !== 'Overview') params.set(key === 'section' ? 'view' : key, value) })
    const url = window.location.pathname + (params.size ? `?${params}` : '')
    window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', url)
    setView({ section: 'Overview', id: '', query: '', status: '', category: '', show: 'all', range: 'all', ...next })
  }
  return [view, navigate]
}
