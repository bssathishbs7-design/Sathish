import { ChevronLeft, ChevronRight } from 'lucide-react'
import '../styles/page-navigation-header.css'

function PageNavigationHeader({
  items = [],
  onBack,
  onForward,
  canBack = true,
  canForward = true,
}) {
  const breadcrumbItems = items
    .map((item) => (typeof item === 'string' ? { label: item } : item))
    .filter((item) => item?.label)

  if (!breadcrumbItems.length) return null

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }

    window.history.back()
  }

  const handleForward = () => {
    if (onForward) {
      onForward()
      return
    }

    window.history.forward()
  }

  return (
    <nav className="page-navigation-header" aria-label="Page navigation">
      <div className="page-navigation-history" aria-label="History controls">
        <button type="button" onClick={handleBack} disabled={!canBack} aria-label="Go back">
          <ChevronLeft size={16} strokeWidth={2.2} />
        </button>
        <button type="button" onClick={handleForward} disabled={!canForward} aria-label="Go forward">
          <ChevronRight size={16} strokeWidth={2.2} />
        </button>
      </div>

      <span className="page-navigation-divider" aria-hidden="true" />

      <ol className="page-navigation-crumbs">
        {breadcrumbItems.map((item, index) => {
          const isCurrent = index === breadcrumbItems.length - 1

          return (
            <li key={`${item.label}-${index}`} className={isCurrent ? 'is-current' : ''}>
              {item.label}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default PageNavigationHeader
