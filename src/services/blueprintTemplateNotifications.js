export const BLUEPRINT_TEMPLATE_UNREAD_KEY = 'medsy-blueprint-template-unread-v1'

/** Unseen template IDs persist independently of assessment drafts and blueprint enablement. */
export function readUnreadBlueprintTemplates(storage = localStorage) {
  try {
    const ids = JSON.parse(storage.getItem(BLUEPRINT_TEMPLATE_UNREAD_KEY) || '[]')
    return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string'))] : []
  } catch { return [] }
}

/** Notification storage failure must not turn a successful template save into an error. */
export function updateUnreadBlueprintTemplates({ added = [], seen = [] }, storage = localStorage) {
  const ids = [...new Set([...readUnreadBlueprintTemplates(storage), ...added])].filter(id => !seen.includes(id))
  try { storage.setItem(BLUEPRINT_TEMPLATE_UNREAD_KEY, JSON.stringify(ids)) } catch { /* Keep this visit usable when storage is unavailable. */ }
  return ids
}
