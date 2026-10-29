import { useEffect, useRef, useState } from 'react'
import { CalendarClock, Check, CheckCheck, Clock3, CopyCheck, Eye, Hourglass, Info, Undo2, X } from 'lucide-react'
import CopyIdBadge from './CopyIdBadge'
import QuestionHistoryButton from './QuestionHistoryButton'
import { isPendingAssessmentExpired } from '../services/assessmentScheduleExpiry'
import { APPROVAL_STATUSES, APPROVAL_TYPES, hasUnseenDecision, isNewRequest, isWithdrawnQuestion, matchesRequest, queueInsights, requestKey,
  requestStatus, requestTitle, requestType, returnDays, seenToken, sortQueueItems, submittedTime, waitingDays } from '../services/approvalQueue'
import { durationLabel, facultyDates, insightSummary, plainQuestionText, questionOrigin, queueItemId, queueTime } from '../services/approvalQueuePresentation'
import './ApprovalQueuePanel.css'

const typeClass = row => requestType(row).toLowerCase().replaceAll(' ', '-')
const initials = name => name.replace(/^Dr\.?\s*/i, '').split(/\s+/).slice(0, 2).map(word => word[0]).join('')

function Insights({ items, allItems, now }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null), trigger = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const outside = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const escape = event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); trigger.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const own = queueInsights(items, now), total = queueInsights(allItems, now)
  return <div className="aq-insights-wrap" ref={ref}>
    <button ref={trigger} aria-expanded={open} aria-controls="aq-insights-readout" disabled={!items.length} onClick={() => setOpen(value => !value)}><Info size={16} />Insights</button>
    {open && <section id="aq-insights-readout" className="aq-insights" aria-label="Last 90 days">
      <header><h3>Last 90 days</h3><button aria-label="Close insights" onClick={() => { setOpen(false); trigger.current?.focus() }}><X size={16} /></button></header>
      <p>{insightSummary(own, total)}</p><dl>
        <div><dt>Approved</dt><dd>{own.percent === null ? 'No decisions' : `${own.percent}%`}</dd></div>
        <div><dt>Usually decided in</dt><dd>{durationLabel(own.days)}</dd></div>
        <div><dt>Waiting now</dt><dd>{own.waiting}</dd></div>
      </dl><p>Whole queue: {total.waiting} waiting · usually {durationLabel(total.days)} · {total.percent === null ? 'no decisions' : `${total.percent}% approved`}</p>
    </section>}
  </div>
}

/** Faculty panel remounts on faculty change, keeping the opened session's New tags until leaving. */
export default function ApprovalQueuePanel({ faculty, items, allItems, query, oldestAcross, currentUser, resetSeen, now, duplicates, onMarkSeen, onMarkDecisionsSeen, initialStatus, onViewApproval, onReschedule, onClearFilters }) {
  const [status, setStatus] = useState(() => initialStatus || (items.some(row => requestStatus(row) === 'Requests' || hasUnseenDecision(row, currentUser)) ? 'Requests' : 'Approved'))
  const [type, setType] = useState('All')
  const [openedNew] = useState(() => ({ version: resetSeen, tokens: new Set(items.filter(row => isNewRequest(row, currentUser)).map(seenToken)) }))
  const marked = useRef(false)
  useEffect(() => {
    if (marked.current || oldestAcross || !items.length) return
    marked.current = true
    const unseen = items.filter(row => isNewRequest(row, currentUser))
    if (unseen.length) onMarkSeen?.(unseen.map(requestKey))
  }, [items, currentUser, onMarkSeen, oldestAcross])
  const searched = items.filter(row => matchesRequest(row, query))
  const active = searched.filter(row => requestStatus(row) !== 'Withdrawn')
  const inStatus = active.filter(row => requestStatus(row) === status)
  const typeCounts = new Map(APPROVAL_TYPES.map(value => [value, inStatus.filter(row => value === 'All' || requestType(row) === value).length]))
  const visibleTypes = APPROVAL_TYPES.filter(value => typeCounts.get(value) > 0)
  const selectedType = typeCounts.get(type) > 0 ? type : 'All'
  if (type !== selectedType) setType(selectedType)
  const rows = sortQueueItems(inStatus.filter(row => selectedType === 'All' || requestType(row) === selectedType), status)
  useEffect(() => {
    const unseen = rows.filter(row => hasUnseenDecision(row, currentUser))
    if (unseen.length) onMarkDecisionsSeen?.(unseen.map(requestKey))
  }, [rows, currentUser, onMarkDecisionsSeen])
  const dates = facultyDates(items)
  const withdrawn = items.filter(row => requestStatus(row) === 'Withdrawn').length
  const entirelyWithdrawn = [...new Map(items.filter(row => row.sourceRequest && requestStatus(row.sourceRequest) === 'Requests'
    && row.sourceRequest.questionRows?.length && row.sourceRequest.questionRows.every(isWithdrawnQuestion))
    .map(row => [row.sourceRequest.id, row.sourceRequest])).values()]
  const open = row => {
    const source = row.sourceRequest || row
    onMarkSeen?.([requestKey(source)])
    if (isPendingAssessmentExpired(source, new Date(now))) { onReschedule?.(source); return }
    onViewApproval?.({ ...source, focusQuestionId: row.question?.id, submissionReadOnly: requestStatus(row) !== 'Requests' })
  }
  const emptyText = !allItems.length ? 'Nothing has been sent for approval yet.'
    : query ? 'Nothing here matches the search.'
      : type !== 'All' ? `No ${type.toLowerCase()} ${status === 'Requests' ? 'requests' : status.toLowerCase() + ' items'} from this faculty member.`
        : status === 'Requests' ? 'No requests waiting from this faculty member.' : `Nothing ${status.toLowerCase()} yet.`
  return <main className="aq-panel" aria-label="Approval requests">
    <header className="aq-panel-head"><div className="aq-faculty-heading">{faculty && <span className="aq-avatar" aria-hidden="true">{initials(faculty.name)}</span>}
      <div><h2>{oldestAcross ? 'All faculty' : faculty?.name || 'Approval requests'}</h2><p>{faculty?.designation || 'Requests grouped by faculty'}</p></div></div>
      <Insights items={items} allItems={allItems} now={now} />
      <dl className="aq-faculty-details"><div><dt>Employee ID</dt><dd>{faculty?.id || 'All faculty'}</dd></div><div><dt>Requests sent</dt><dd>{dates.count}</dd></div>
        <div><dt>First sent</dt><dd title={queueTime(dates.first, now)}>{queueTime(dates.first, now, false)}</dd></div><div><dt>Last sent</dt><dd title={queueTime(dates.last, now)}>{queueTime(dates.last, now, false)}</dd></div></dl>
    </header>
    <div className="aq-filters aq-status-filters" role="group" aria-label="Request status">{APPROVAL_STATUSES.map(value => <button key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{value}<span>{active.filter(row => requestStatus(row) === value).length}</span></button>)}</div>
    {visibleTypes.length > 0 && <div className="aq-filters aq-type-filters" role="group" aria-label="Request type"><span className="aq-filter-label">Type</span>{visibleTypes.map(value => {
      const count = typeCounts.get(value)
      return <button key={value} className={`aq-type-${value.toLowerCase().replaceAll(' ', '-')}`} aria-pressed={selectedType === value} onClick={() => setType(value)}><i className="aq-type-dot" aria-hidden="true" />{value}<span>{count}</span></button>
    })}</div>}
    <div className="aq-results" aria-live="polite">{rows.length} {rows.length === 1 ? 'item' : 'items'}</div>
    <div className="aq-cards">{rows.map(row => {
      const state = requestStatus(row), pending = state === 'Requests', source = row.sourceRequest || row
      const expired = isPendingAssessmentExpired(source, new Date(now)), age = waitingDays(row, now), returns = returnDays(row, now)
      const duplicate = duplicates.get(requestKey(row)), title = plainQuestionText(requestTitle(row)), id = queueItemId(row)
      const isNew = pending && (isNewRequest(row, currentUser) || resetSeen === openedNew.version && openedNew.tokens.has(seenToken(row)))
      return <article className={`aq-card aq-type-${typeClass(row)}`} key={requestKey(row)}>
        <div className="aq-card-heading"><div><div className="aq-chips"><span className="aq-chip aq-section-tag"><i className="aq-type-dot" aria-hidden="true" />{requestType(row)}</span>
          {isNew && <span className="aq-chip aq-new">New</span>}{id && <span title={String(id).startsWith('DRF-') ? 'Draft reference. The question ID is issued on approval.' : 'Permanent item ID'}><CopyIdBadge value={id} label="item ID" /></span>}
          {!pending && <span className={`aq-chip aq-outcome-${state.toLowerCase()}`}>{state === 'Approved' ? <Check size={14} /> : <Undo2 size={14} />}{state}</span>}
          {pending && age >= 7 && <span className="aq-chip aq-warning"><Hourglass size={14} />Waiting {age} days</span>}
          {pending && returns !== null && returns <= 3 && <span className="aq-chip aq-danger">{returns ? `Returns in ${returns} days` : 'Returns today'}</span>}
          {expired && <span className="aq-chip aq-danger"><CalendarClock size={14} />Start time passed · reschedule to continue</span>}
          {pending && duplicate && <span className="aq-chip aq-warning" title="Very similar wording to another question"><CopyCheck size={14} />Possible duplicate of {duplicate.id} ({Math.round(duplicate.score * 100)}%)</span>}{row.question && <QuestionHistoryButton question={row.question} />}</div>
          <h3 title={title}>{title}</h3></div>
          <button className={pending ? 'aq-primary' : ''} onClick={() => open(row)}>{expired ? <CalendarClock size={16} /> : <Eye size={16} />}{expired ? 'Reschedule' : pending ? 'Review' : 'View'}</button></div>
        {oldestAcross && <p>{row.senderName}</p>}
        {row.question && <p>{questionOrigin(row.question, source)}</p>}
        {row.question?.changeKind && <p><strong>Reason:</strong> {row.question.changeReason || 'Not supplied'} · Used {Number(row.question.usageCount) || 0} times</p>}
        <p className="aq-time"><Clock3 size={14} />Requested {queueTime(submittedTime(row), now)}</p>
        {row.reviewRemarks && <p><strong>Remarks:</strong> {row.reviewRemarks}</p>}
        {!pending && row.reviewedAt && <p>{state} {queueTime(row.reviewedAt, now, false)}{row.reviewedBy ? ` by ${row.reviewedBy}` : ''}</p>}
      </article>
    })}</div>
    {!rows.length && <div className="aq-empty"><CheckCheck size={28} /><h3>{emptyText}</h3>
      {!allItems.length && <p>When a faculty member sends a question, assessment, blueprint or skill assessment, they appear here.</p>}
      {(query || type !== 'All') && <button onClick={() => { setType('All'); onClearFilters() }}>Clear filters</button>}</div>}
    {withdrawn > 0 && <p className="aq-withdrawn"><Undo2 size={14} />{withdrawn} {withdrawn === 1 ? 'item was' : 'items were'} withdrawn by the author.</p>}
    {entirelyWithdrawn.map(source => <button key={source.id} onClick={() => onViewApproval?.({ ...source, submissionReadOnly: false })}>Close withdrawn request: {source.activityName}</button>)}
  </main>
}
