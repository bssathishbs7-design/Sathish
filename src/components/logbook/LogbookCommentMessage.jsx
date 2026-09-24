import { useEffect, useRef, useState } from 'react'
import { useLogbookCommentRead } from '../../services/logbookCommentRead'
import './LogbookCommentMessage.css'

/** Mark a received comment as read only when its message enters the visible drawer viewport. */
export default function LogbookCommentMessage({ entryId, comment }) {
  const { isUnread, markRead } = useLogbookCommentRead(entryId)
  const [wasUnread] = useState(() => isUnread(comment))
  const element = useRef(null)
  useEffect(() => {
    const node = element.current
    if (!node) return undefined
    let visible = false
    const readVisible = () => { if (visible && document.visibilityState === 'visible') markRead(comment) }
    const observer = new IntersectionObserver(records => { visible = records[0].isIntersecting; readVisible() }, { threshold: 0.1 })
    observer.observe(node)
    document.addEventListener('visibilitychange', readVisible)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', readVisible) }
  }, [comment, markRead])
  return <article ref={element} className={'lb-comment' + (wasUnread ? ' is-new-comment' : '')}>
    <div className="lb-comment-avatar" aria-hidden="true">{comment.by === 'faculty' ? 'F' : 'L'}</div>
    <div><strong>{comment.who || (comment.by === 'faculty' ? 'Faculty' : 'Learner')}</strong>{wasUnread && <span className="lb-new-comment-label">New</span>}<small>{comment.by === 'faculty' ? 'Faculty' : 'Learner'} / {new Date(comment.date).toLocaleString('en-IN')}</small><p>{comment.text}</p></div>
  </article>
}
