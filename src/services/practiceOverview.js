/** Summarise shared cards. Sessions persist practiceAnswers when a learner opens the player.
 * @param {Array<Object>} cards Shared cards with practiceSessions (or legacy questions).
 * @returns {{available:number,inProgress:number,completed:number,remaining:number}}
 * Remaining questions belong to unfinished, unexpired sessions; answers count until submitted.
 */
export function getPracticeOverview(cards = []) {
  return cards.reduce((total, card) => {
    const sessions = card.practiceSessions?.length ? card.practiceSessions : card.questions?.length ? [card] : []
    const status = session => String(session.status || '').trim().toLowerCase()
    const completed = session => ['complete', 'completed'].includes(status(session)) || Boolean(session.practiceSubmitted)
    const active = sessions.filter(session => !completed(session) && status(session) !== 'expired')
    total.available += 1
    if (sessions.length && sessions.every(completed)) total.completed += 1
    if (active.some(session => session.startedAt || Object.hasOwn(session, 'practiceAnswers'))) total.inProgress += 1
    for (const session of active) {
      const count = ['mcq', 'saqs', 'laqs'].reduce((sum, key) => sum + Math.max(0, Number(session[key]) || 0), 0)
      total.remaining += count || session.questions?.length || 0
    }
    return total
  }, { available: 0, inProgress: 0, completed: 0, remaining: 0 })
}
