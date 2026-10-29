import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Search, Users, ChevronRight } from 'lucide-react'
import PageNavigationHeader from '../components/PageNavigationHeader'
import ApprovalQueuePanel from '../components/ApprovalQueuePanel'
import { groupByFaculty, hasUnseenDecision, requestStatus, isNewRequest, matchesRequest, queueItems, requestKey, visibleRequests } from '../services/approvalQueue'
import { findQuestionDuplicates, readInstitutionBank } from '../services/approvalDuplicates'
import '../styles/medsy/question-sort-tokens.css'
import './ApprovalQueueByFaculty.css'

/** Request data remains owned by App; this page projects individual questions for queue browsing. */
export default function ApprovalQueueByFaculty({ approvalQueueRows = [], currentUser, onMarkSeen, onMarkDecisionsSeen, onViewApproval, onReschedule }) {
  const pageRef = useRef(null)
  useLayoutEffect(() => {
    const page = pageRef.current, topbar = document.querySelector('.vx-topbar'), toolbar = page.querySelector('.aq-toolbar-sticky')
    const update = () => {
      page.style.setProperty('--aq-topbar-height', (topbar?.getBoundingClientRect().height || 0) + 'px')
      page.style.setProperty('--aq-toolbar-height', (toolbar?.getBoundingClientRect().height || 0) + 'px')
    }
    const observer = new ResizeObserver(update)
    if (topbar) observer.observe(topbar)
    if (toolbar) observer.observe(toolbar)
    update()
    return () => observer.disconnect()
  }, [])
  const [resultStatus, setResultStatus] = useState(null)
  const [query, setQuery] = useState('')
  const [oldestAcross, setOldestAcross] = useState(false)
  const [resetSeen, setResetSeen] = useState(0)
  const [now, setNow] = useState(Date.now)
  const [bank, setBank] = useState(() => readInstitutionBank(localStorage))
  const visible = useMemo(() => visibleRequests(approvalQueueRows, currentUser), [approvalQueueRows, currentUser])
  const items = useMemo(() => queueItems(visible), [visible])
  const groups = useMemo(() => groupByFaculty(items, currentUser).map(group => ({ ...group, decisionCount: group.rows.filter(row => hasUnseenDecision(row, currentUser)).length })), [items, currentUser])
  const [facultyId, setFacultyId] = useState(() => groups[0]?.id || '')
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    const update = () => setBank(readInstitutionBank(localStorage))
    const events = ['storage', 'question-bank-questions', 'question-bank-published-questions']
    events.forEach(name => window.addEventListener(name, update))
    return () => events.forEach(name => window.removeEventListener(name, update))
  }, [])
  const duplicates = useMemo(() => findQuestionDuplicates(approvalQueueRows, bank), [approvalQueueRows, bank])
  const matching = groups.filter(group => group.rows.some(row => matchesRequest(row, query)))
  const faculty = matching.find(group => group.id === facultyId) || matching[0]
  const unseen = items.filter(row => isNewRequest(row, currentUser))
  const waiting = groups.reduce((sum, group) => sum + group.waiting, 0)
  const openFaculty = group => {
    const update = group.rows.find(row => hasUnseenDecision(row, currentUser))
    setFacultyId(group.id)
    setOldestAcross(false)
    setResultStatus(update ? requestStatus(update) : null)
  }
  const clear = () => { setQuery(''); setOldestAcross(false); setFacultyId(groups[0]?.id || '') }
  return <section ref={pageRef} className="vx-content approval-queue-scope aq-page">
    <PageNavigationHeader items={['My Pages', 'Approval Queue']} />
    <header className="aq-overview">
      <div className="aq-overview-main"><h1>Approval queue</h1><p className="aq-context">{currentUser?.role === 'Admin' ? 'Admin view - requests for all reviewers' : 'Requests awaiting your review'}</p></div>
      <div className="aq-overview-action"><h2><span className="aq-waiting-count">{waiting}</span> requests waiting <span className="aq-faculty-total">from {groups.filter(group => group.waiting).length} faculty</span></h2>{unseen.length > 0 ? <button className="aq-summary-actions" onClick={() => { onMarkSeen?.(unseen.map(requestKey)); setResetSeen(value => value + 1) }}><BellRing size={16} />{unseen.length} new - mark all seen</button> : <p>No unseen requests.</p>}</div>
    </header>
    <div className="aq-toolbar-sticky"><div className="aq-tools"><label className="aq-search"><Search size={18} aria-hidden="true" /><input aria-label="Search approval requests and faculty" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by ID, tag or name..." /></label>
      <button type="button" className="aq-view-all" aria-pressed={oldestAcross} onClick={() => setOldestAcross(true)}><Users size={16} aria-hidden="true" />View all</button></div></div>
    <div className="aq-layout">
      <aside className="aq-faculty" aria-label="Faculty requests"><h2 className="aq-faculty-list-title"><Users size={18} aria-hidden="true" /><span>Faculty</span><span className="aq-faculty-count">{matching.length}</span></h2>
        <div className="aq-faculty-list">{matching.map(group => <button key={group.id} className="aq-person" aria-pressed={!oldestAcross && faculty?.id === group.id} onClick={() => { openFaculty(group) }}>
          <span className="aq-avatar" aria-hidden="true">{group.name.replace(/^Dr\.?\s*/i, '').split(/\s+/).slice(0, 2).map(word => word[0]).join('')}{group.newCount > 0 && <small>{group.newCount > 99 ? '99+' : group.newCount}</small>}</span>
          <span><strong>{group.name}</strong><small>{group.waiting ? group.waiting + ' requests - ' + group.newCount + ' new' : 'All reviewed'}</small></span><ChevronRight size={16} aria-hidden="true" />{group.decisionCount > 0 && <span className="aq-decision-badge" aria-label={`${group.decisionCount} unseen decision updates`} title={`${group.decisionCount} unseen decision updates`}>{group.decisionCount > 99 ? "99+" : group.decisionCount}</span>}
        </button>)}
        {!matching.length && <p>No faculty match this search.</p>}</div>
      </aside>
      <ApprovalQueuePanel key={oldestAcross ? 'all' : `${faculty?.id || 'empty'}:${resultStatus || 'requests'}`} initialStatus={oldestAcross ? null : resultStatus} faculty={oldestAcross ? null : faculty} items={oldestAcross ? items : faculty?.rows || []}
        allItems={items} query={query} oldestAcross={oldestAcross} currentUser={currentUser} resetSeen={resetSeen} now={now} duplicates={duplicates}
        onMarkSeen={onMarkSeen} onMarkDecisionsSeen={onMarkDecisionsSeen} onViewApproval={onViewApproval} onReschedule={onReschedule} onClearFilters={clear} />
    </div>
  </section>
}
