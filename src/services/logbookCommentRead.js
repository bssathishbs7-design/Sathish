import { createContext, useContext, useSyncExternalStore } from 'react'

/** Per-account, per-entry read receipts in this browser. IDs avoid missing comments with equal timestamps. */
export const LogbookReaderContext = createContext({ id: '', name: '', role: '' })
const prefix = 'medsy-logbook-comment-read:'
const eventName = 'medsy-logbook-comment-read-changed'
const fallback = new Map()
export const commentKey = comment => comment.id || `${comment.date}|${comment.by}|${comment.who}|${comment.text}`
const keyFor = (reader, entryId) => `${prefix}${encodeURIComponent(reader.id)}:${encodeURIComponent(entryId)}`
const snapshot = key => { try { return fallback.get(key) ?? localStorage.getItem(key) ?? '[]' } catch { return fallback.get(key) || '[]' } }
const parse = value => { try { const rows = JSON.parse(value); return Array.isArray(rows) ? rows : [] } catch { return [] } }
const subscribe = callback => {
  window.addEventListener(eventName, callback)
  window.addEventListener('storage', callback)
  return () => { window.removeEventListener(eventName, callback); window.removeEventListener('storage', callback) }
}
export function isOwnComment(comment, reader) {
  return comment.authorId ? comment.authorId === reader.id : Boolean(reader.name && comment.who === reader.name && comment.by === reader.role)
}
export function useLogbookCommentRead(entryId) {
  const reader = useContext(LogbookReaderContext)
  const key = keyFor(reader, entryId)
  const value = useSyncExternalStore(subscribe, () => snapshot(key), () => '[]')
  const read = new Set(parse(value))
  return {
    reader,
    isUnread: comment => Boolean(reader.id && !isOwnComment(comment, reader) && !read.has(commentKey(comment))),
    markRead: comment => {
      if (!reader.id) return
      const ids = new Set(parse(snapshot(key)))
      const id = commentKey(comment)
      if (ids.has(id)) return
      ids.add(id)
      const next = JSON.stringify([...ids])
      try { localStorage.setItem(key, next); fallback.delete(key) } catch { fallback.set(key, next) }
      window.dispatchEvent(new Event(eventName))
    },
  }
}
