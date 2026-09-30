import useLogbookNavigation from './useLogbookNavigation'
export const ADMIN_LOGBOOK_SECTIONS = ['Overview', 'Queue', 'Students', 'Subjects', 'Categories', 'Skills', 'History', 'Sign-offs', 'Search']
export default function useAdminLogbookRoute() {
  const [view, navigate, history] = useLogbookNavigation('/adminLogbook', 'view', 'Overview')
  return [{ ...view, section: view.view }, (next, replace) => { const { section, ...filters } = next; navigate({ ...filters, view: section }, replace) }, history]
}
