import { useLayoutEffect } from 'react'

/** Fits the grid below its preceding content; recalculates for syllabus, shell and viewport changes. */
export default function useStudentGridHeight(gridRef) {
  useLayoutEffect(() => {
    const grid = gridRef.current
    let frame
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const styles = getComputedStyle(grid)
        const gutter = parseFloat(styles.getPropertyValue('--s-4')) || 16
        const viewport = window.visualViewport
        const viewportHeight = viewport?.height || window.innerHeight
        const top = grid.getBoundingClientRect().top + window.scrollY
        const parentPadding = parseFloat(getComputedStyle(grid.parentElement).paddingBottom) || 0
        const table = grid.querySelector('.sm-students-table')
        const rows = table ? [...table.tBodies[0].rows].slice(0, 2) : []
        const rowHeight = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0)
        const headerHeight = table?.tHead?.getBoundingClientRect().height || 0
        const footerHeight = grid.querySelector('.sm-student-footer')?.getBoundingClientRect().height || 0
        const minimum = table ? headerHeight + rowHeight + footerHeight + 2 : 240
        const height = Math.max(minimum, viewportHeight - top - parentPadding - gutter) + 'px'
        if (grid.style.getPropertyValue('--student-grid-height') !== height) grid.style.setProperty('--student-grid-height', height)
      })
    }
    const observer = new ResizeObserver(measure)
    let child = grid
    while (child.parentElement && !child.classList.contains('vx-main')) {
      for (const sibling of child.parentElement.children) if (sibling !== child) observer.observe(sibling)
      child = child.parentElement
    }
    const observeContent = () => {
      grid.querySelectorAll('.sm-students-table, .sm-student-footer, .sm-selection-float').forEach(element => observer.observe(element))
      measure()
    }
    observeContent()
    const content = new MutationObserver(observeContent)
    content.observe(grid, { childList: true, subtree: true })
    const attributes = new MutationObserver(measure)
    attributes.observe(grid, { attributes: true, attributeFilter: ['class', 'style'] })
    window.visualViewport?.addEventListener('resize', measure)
    window.addEventListener('resize', measure)
    document.addEventListener('animationend', measure)
    measure()
    return () => { content.disconnect(); attributes.disconnect(); window.visualViewport?.removeEventListener('resize', measure); observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', measure); document.removeEventListener('animationend', measure) }
  }, [gridRef])
}
