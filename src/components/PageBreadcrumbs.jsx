import { ChevronRight } from 'lucide-react'

function PageBreadcrumbs({ items = [] }) {
  if (!items.length) return null

  return (
    <nav className="vx-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={`${item.label}-${index}`} className="vx-breadcrumb-item">
            <span className={`vx-breadcrumb-pill ${isLast ? 'is-current' : ''}`}>
              {item.label}
            </span>
            {!isLast ? <ChevronRight size={16} strokeWidth={2.4} className="vx-breadcrumb-separator" aria-hidden="true" /> : null}
          </div>
        )
      })}
    </nav>
  )
}

export default PageBreadcrumbs
