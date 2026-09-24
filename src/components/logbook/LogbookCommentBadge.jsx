import { MessageSquare, Paperclip } from 'lucide-react'
import { useLogbookCommentRead } from '../../services/logbookCommentRead'
import './LogbookCommentBadge.css'

/** Unread comments for the current account and attachment indicator.
 * @param {{entry:Object,showAttachments?:boolean}} props
 */
export default function LogbookCommentBadge({ entry, showAttachments = true }) {
  const { isUnread } = useLogbookCommentRead(entry.id)
  const comments = entry.extra?.comments || []
  const count = comments.filter(isUnread).length
  const attachments = showAttachments ? entry.extra?.attachments?.length || 0 : 0
  if (!comments.length && !attachments) return null
  const label = count ? `${count} unread ${count === 1 ? 'comment' : 'comments'}` : `${comments.length} comments, all read`
  const attachmentLabel = `${attachments} ${attachments === 1 ? 'attachment' : 'attachments'}`
  return <span className="lb-entry-indicators">
    {attachments > 0 && <span className="lb-attachment-indicator" aria-label={attachmentLabel} title={attachmentLabel}><Paperclip size={15} aria-hidden="true" /></span>}
    {comments.length > 0 && <span className="lb-chat-indicator" data-unread={count > 0 ? 'true' : undefined} aria-label={label} title={label}><MessageSquare size={15} aria-hidden="true" />{count > 0 && <span className="lb-comment-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}</span>}
  </span>
}
