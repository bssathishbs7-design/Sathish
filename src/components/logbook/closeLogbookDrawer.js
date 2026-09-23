/** Animate the current drawer out before its owner removes it.
 * @param {Function} finish Called after the exit motion completes.
 */
export async function closeLogbookDrawer(finish) {
  const node = document.querySelector('.lb-drawer[open]')
  if (!node) { finish(); return }
  if (node.classList.contains('is-closing')) return
  node.classList.add('is-closing')
  node.inert = true
  await Promise.allSettled(node.getAnimations().map(animation => animation.finished))
  finish()
}
