import { useRef } from 'react'

/** Moves the selection card within its content width and viewport using pointer or keyboard input. */
export default function useSelectionCardDrag(wrapperRef) {
  const drag = useRef(null)
  const move = (dx, dy) => {
    const wrapper = wrapperRef.current, card = wrapper?.firstElementChild
    if (!card) return
    const bounds = card.getBoundingClientRect(), area = wrapper.getBoundingClientRect()
    const x = Number(card.dataset.dragX || 0), y = Number(card.dataset.dragY || 0)
    const left = Math.max(0, area.left), right = Math.min(window.innerWidth, area.right)
    const nextX = x + Math.max(left - bounds.left, Math.min(dx, right - bounds.right))
    const nextY = y + Math.max(0 - bounds.top, Math.min(dy, window.innerHeight - bounds.bottom))
    card.setAttribute('data-drag-x', nextX); card.setAttribute('data-drag-y', nextY)
    card.style.setProperty('transform', 'translate(' + nextX + 'px, ' + nextY + 'px)')
  }
  return {
    constrain: () => {
      const card = wrapperRef.current?.firstElementChild
      if (Number(card?.dataset.dragX) || Number(card?.dataset.dragY)) move(0, 0)
    },
    handleProps: {
      onPointerDown: event => {
        if (event.button !== 0 || !event.isPrimary) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      },
      onPointerMove: event => {
        const previous = drag.current
        if (!previous || previous.id !== event.pointerId) return
        move(event.clientX - previous.x, event.clientY - previous.y)
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
      },
      onPointerUp: event => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        drag.current = null
      },
      onPointerCancel: () => { drag.current = null },
      onLostPointerCapture: () => { drag.current = null },
      onKeyDown: event => {
        const steps = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }
        if (steps[event.key]) { event.preventDefault(); move(...steps[event.key]) }
        if (event.key === 'Home') {
          event.preventDefault()
          const card = wrapperRef.current?.firstElementChild
          if (card) { card.setAttribute('data-drag-x', 0); card.setAttribute('data-drag-y', 0); card.style.removeProperty('transform'); move(0, 0) }
        }
      },
    },
  }
}
