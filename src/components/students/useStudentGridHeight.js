import { useLayoutEffect } from 'react'

/** Shows up to ten complete rows before the table body scrolls. */
export default function useStudentGridHeight(gridRef) {
  useLayoutEffect(() => {
    const grid = gridRef.current
    let frame
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const styles = getComputedStyle(grid)
        const table = grid.querySelector('.sm-students-table')
        const rows = table ? [...table.tBodies[0].rows].slice(0, 10) : []
        const rowHeight = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0)
        const headerHeight = table?.tHead?.getBoundingClientRect().height || 0
        const footerHeight = grid.querySelector('.sm-student-footer')?.getBoundingClientRect().height || 0
        const toolbarHeight = [...grid.querySelectorAll('.sm-table-toolbar, .sm-bulk-toolbar')].reduce((sum, toolbar) => sum + toolbar.getBoundingClientRect().height, 0)
        const borders = (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0)
        const height = Math.ceil(toolbarHeight + headerHeight + rowHeight + footerHeight + borders) + 'px'
        if (grid.style.getPropertyValue('--student-grid-height') !== height) grid.style.setProperty('--student-grid-height', height)
      })
    }
    const observer = new ResizeObserver(measure)
    const observeContent = () => {
      observer.disconnect()
      grid.querySelectorAll('.sm-students-table, .sm-students-table tr, .sm-student-footer, .sm-bulk-toolbar').forEach(element => observer.observe(element))
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
