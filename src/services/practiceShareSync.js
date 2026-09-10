/** Add newly shared sessions while preserving existing attempts and their in-page state. */
export function mergeNewPracticeSessions(current, incoming) {
  if (!current || !incoming) return current
  const matches = (current.id && String(current.id) === String(incoming.id))
    || (current.competencyCode && current.competencyCode === incoming.competencyCode)
  if (!matches) return current
  const sessions = Array.isArray(current.practiceSessions) ? current.practiceSessions : []
  const seen = new Set(sessions.map((session) => String(session.id)))
  const additions = (Array.isArray(incoming.practiceSessions) ? incoming.practiceSessions : []).filter((session) => {
    if (!session?.id || seen.has(String(session.id))) return false
    seen.add(String(session.id))
    return true
  })
  if (!additions.length) return current
  return { ...current, ...incoming, practiceSessions: [...sessions, ...additions] }
}
