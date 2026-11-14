import { Children, cloneElement, createElement, isValidElement, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, Circle, Clock3, FileText, Layers, Eye, Flag, Info, ListChecks, LoaderCircle, LogOut, Moon, ShieldCheck, Sun } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import './ExamWorkspaceChrome.css'
import './ExamWorkspaceResponsive.css'


/** Measure wrapping chrome so long titles, zoom and safe areas cannot cover exam content. */
function useChromeSize(property) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    const root = node?.closest('#exam-workspace')
    if (!root) return
    const measure = () => root.style.setProperty(property, property === '--exam-footer-space' ? `calc(${node.getBoundingClientRect().height}px + var(--s-4))` : `${node.getBoundingClientRect().height}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    measure()
    return () => { observer.disconnect(); root.style.removeProperty(property) }
  }, [property])
  return ref
}

/** Shared exam chrome. Exam pages retain answers, timers, submission and proctor enforcement.
 * @param {{assessment:Object,setup:Object,logo?:string,chips:Array<{label:string,value:string|number,tone:string,isCritical?:boolean}>,theme:string,onToggleTheme:Function,onExit?:Function,proctored?:boolean,locked?:boolean}} props
 */
export function ExamWorkspaceHeader({ assessment, setup, logo, chips, theme, onToggleTheme, onExit, proctored = false, locked = false }) {
  const headerRef = useChromeSize('--exam-header-space')
  const [detailsOpen, setDetailsOpen] = useState(false)
  if (locked && detailsOpen) setDetailsOpen(false)
  const ThemeIcon = theme === 'dark' || theme === 'oled' ? Sun : Moon
  return <header ref={headerRef} className="online-practice-header exam-workspace-header">
    <div className="exam-workspace-identity">
      {logo ? <img src={logo} alt={setup.logoName || 'College logo'} /> : <ListChecks size={22} aria-hidden="true" />}
      <div><h1>{assessment.assessmentName || 'Assessment'}</h1><p>{[assessment.examCategory, assessment.assignTo || setup.assignYear, proctored ? 'Proctored exam' : 'Practice exam'].filter(Boolean).join(' · ')}</p></div>
    </div>
    <div className="exam-workspace-header-metrics" aria-label="Exam summary">
      {chips.map(chip => <span key={chip.tone} className={`exam-workspace-chip is-${chip.tone} ${chip.isCritical ? 'is-critical' : ''}`}>
        {createElement(chip.tone === 'duration' ? Clock3 : chip.tone === 'marks' ? Award : chip.tone === 'extended' ? Clock3 : Layers, { size: 17, 'aria-hidden': true })}<span>{chip.label}</span><strong>{chip.value}</strong>
      </span>)}
    </div>
    <div className="exam-workspace-header-actions">
      <button type="button" aria-label="Exam information" title="Exam information" onClick={() => setDetailsOpen(true)} disabled={locked}><Info size={18} /></button>
      <button type="button" aria-label="Toggle theme" title="Toggle theme" onClick={onToggleTheme} disabled={locked}><ThemeIcon size={18} /></button>
      {onExit && <button type="button" onClick={onExit} disabled={locked}><LogOut size={16} aria-hidden="true" />Exit</button>}
    </div>
    {detailsOpen && <SaveChangesDialog className="exam-information-dialog" theme={theme} title={<><Info size={20} aria-hidden="true" />Exam information</>} description={assessment.assessmentName} onCancel={() => setDetailsOpen(false)} cancelLabel="Close" showClose>
      <dl className="exam-information-list">{[
        ['College', setup.collegeName || assessment.collegeName], ['Academic year', setup.academicYear],
        ['Assigned to', assessment.assignTo], ['Mode', assessment.supervisionType], ['Type', assessment.examType],
        ['Start date', assessment.startDate], ['Start time', assessment.startTime], ['End date', assessment.endDate],
        ['Duration', assessment.totalDuration], ['Total questions', assessment.questionCount ?? assessment.questionRows?.length], ['Total marks', assessment.totalMarks],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
      {setup.instructions && typeof setup.instructions === 'string' && <p>{setup.instructions}</p>}
    </SaveChangesDialog>}
  </header>
}

/** Tabs keep section availability and completion controlled by the owning exam page.
 * @param {{sections:Array<{id:string,label:string,count:number,disabled:boolean,complete:boolean}>,active:string,onSelect:Function,children?:import('react').ReactNode}} props
 */
export function ExamWorkspaceSections({ sections, active, onSelect, children }) {
  return <div className="exam-workspace-section-bar"><div className="exam-workspace-sections" role="group" aria-label="Exam sections">
    {sections.map(section => <button key={section.id} type="button" aria-pressed={section.id === active} disabled={section.disabled} onClick={() => onSelect(section.id)}>
      {section.complete ? <Check size={16} aria-hidden="true" /> : section.id === 'mcq' ? <ListChecks size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}{section.label}<span>{section.count}</span>{section.complete && <small>Submitted</small>}
    </button>)}
  </div>{children}</div>
}

/** Fixed navigation keeps its order identical in both sections. children holds the original guarded submit action.
 * @param {{index:number,total:number,questionNumber?:number,sectionId?:string,flagged:boolean,onFlag:Function,onPrevious:Function,onNext:Function,flagDisabled?:boolean,previousDisabled?:boolean,nextDisabled?:boolean,navigationVisible?:boolean,children?:import('react').ReactNode}} props
 */
export function ExamWorkspaceFooter({ index, total, questionNumber, sectionId = 'exam', flagged, onFlag, onPrevious, onNext, flagDisabled, previousDisabled, nextDisabled, navigationVisible = true, children }) {
  const footerRef = useChromeSize('--exam-footer-space')
  const atLastQuestion = total > 0 && index >= total - 1
  const [highlightedSections, setHighlightedSections] = useState([])
  const canReview = Children.toArray(children).some(child => isValidElement(child) && !child.props.disabled)
  const highlightReview = navigationVisible && atLastQuestion && canReview
  const pulseReview = highlightReview && !highlightedSections.includes(sectionId)
  return <footer ref={footerRef} className="exam-workspace-footer" aria-label="Exam actions">
    {navigationVisible ? <button type="button" className="exam-workspace-flag" aria-pressed={flagged} onClick={onFlag} disabled={flagDisabled}><Flag size={16} aria-hidden="true" />{flagged ? 'Unmark review' : 'Mark for review'}</button> : <span />}
    {navigationVisible ? <div className="exam-workspace-paging">
      <span aria-live="polite">Question {questionNumber ?? index + 1}<small>({index + 1} of {total})</small></span>
      <button type="button" className="exam-workspace-previous" onClick={onPrevious} disabled={previousDisabled}><ArrowLeft size={16} aria-hidden="true" />Previous</button>
      <button type="button" className="exam-workspace-next" onClick={onNext} disabled={atLastQuestion || nextDisabled}>Next question<ArrowRight size={16} aria-hidden="true" /></button>
    </div> : <span />}
    <div className={`exam-workspace-submit${highlightReview ? ' is-review-ready' : ''}${pulseReview ? ' is-review-pulsing' : ''}`} onAnimationEnd={event => { if (event.animationName === 'exam-review-cue') setHighlightedSections(current => current.includes(sectionId) ? current : [...current, sectionId]) }}>{Children.map(children, child => isValidElement(child) ? cloneElement(child, {}, <ListChecks size={16} aria-hidden="true" />, child.props.disabled ? child.props.children : (child.props['data-review-label'] || 'Review & Submit')) : child)}</div>
  </footer>
}

/** One navigator instance becomes a native modal at narrow widths; the browser traps/restores focus.
 * @param {{children:import('react').ReactNode,theme:string,locked?:boolean}} props
 */
export function ExamWorkspaceNavigator({ children, theme, locked = false }) {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const change = () => { setNarrow(media.matches); setOpen(false) }
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  if (locked && open) setOpen(false)
  if (!narrow) return <aside className="online-practice-side-nav exam-workspace-navigator" aria-label="Question navigation">{children}</aside>
  return <div className="exam-workspace-mobile-navigator">
    <button type="button" onClick={() => setOpen(true)} disabled={locked}><ListChecks size={16} aria-hidden="true" />Questions</button>
    {open && <SaveChangesDialog className="exam-workspace-drawer" theme={theme} title="Questions" description="Choose a question to return to the exam." onCancel={() => setOpen(false)} cancelLabel="Back to exam" showClose>
      <aside className="exam-workspace-navigator" onClick={event => { if (event.target.closest('.online-practice-number-nav button')) setOpen(false) }}>{children}</aside>
    </SaveChangesDialog>}
  </div>
}

/** Live state only: never infer fullscreen or monitoring from the exam type. */
export function ExamProctorStatus({ fullscreen, locked, violations }) {
  return <div className="exam-workspace-proctor-status" role="status"><ShieldCheck size={16} aria-hidden="true" /><span>{locked ? 'Session restricted' : 'Monitoring active'}</span><span>{fullscreen ? 'Fullscreen active' : 'Fullscreen inactive'}</span><span>Violations <strong>{violations}</strong></span></div>
}

/** Counts and symbols use the same per-question states as the number grid. */
export function ExamQuestionStatusLegend({ statuses, includePartial = false, answeredCount, partialCount }) {
  return <div className="exam-workspace-status-counts" aria-label="Question status counts">{[
    ['answered', 'Answered', Check], ...(includePartial ? [['partially-answered', 'Partial', Circle]] : []), ['try-later', 'For review', Flag], ['not-viewed', 'Not viewed', Circle], ['viewed', 'Viewed', Eye],
  ].map(([status, label, StatusIcon]) => <span key={status} className={`is-${status}`} title={status === 'try-later' ? 'Marked questions may also have an answer.' : undefined}>{createElement(StatusIcon, { size: 13, 'aria-hidden': true })}<span>{label}</span><strong>{(status === 'answered' ? answeredCount : status === 'partially-answered' ? partialCount : undefined) ?? statuses.filter(value => value === status).length}</strong></span>)}</div>
}

/** Positive feedback is displayed only after the persistence adapter reports success. */
export function ExamSaveStatus({ saved, error, uploading }) {
  return <span className="exam-workspace-save-state" role="status">{uploading ? <><LoaderCircle size={14} aria-hidden="true" />Uploading image...</> : error ? 'Answers not saved' : saved ? <><Check size={14} aria-hidden="true" />Saved locally</> : 'Saving...'}</span>
}

/** Compact overview keeps whole-exam totals distinct from the active section. */
export function ExamWorkspaceSummary({ totalQuestions, totalMarks, section, questions, marks }) {
  return <div className="exam-workspace-summary">
    <div className="exam-workspace-summary-title"><BookOpen size={17} aria-hidden="true" /><strong>Exam overview</strong></div>
    <div className="exam-workspace-summary-kpis">
      <div><ListChecks size={18} aria-hidden="true" /><strong>{totalQuestions}</strong><span>Total questions</span></div>
      <div><Award size={18} aria-hidden="true" /><strong>{totalMarks}</strong><span>Total marks</span></div>
    </div>
    <div className="exam-workspace-section-summary"><span>{section}</span><strong>{questions} questions / {marks} marks</strong></div>
  </div>
}
