import { useState, useSyncExternalStore } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, ChartNoAxesColumn, CircleAlert } from 'lucide-react'
import './BlueprintCountSuggestions.css'

const subscribeMobile = callback => {
  const query = window.matchMedia('(max-width: 767px)')
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
const isMobile = () => window.matchMedia('(max-width: 767px)').matches

/** Paged suggestions preserve existing allocation and selection behaviour.
 * @param {{suggestions:{cards:Array,message:string,totalCards?:number,currentIndex?:number,getPage?:Function},onSelect:Function}} props
 */
export default function BlueprintCountSuggestions({ suggestions, onSelect }) {
  const mobile = useSyncExternalStore(subscribeMobile, isMobile, () => false)
  const size = mobile ? 1 : 3
  const [navigation, setNavigation] = useState(null)
  const count = suggestions.totalCards ?? suggestions.cards.length
  const pages = Math.max(1, Math.ceil(count / size))
  const initial = suggestions.completedFirst ? 0 : Math.floor((suggestions.currentIndex ?? Math.max(0, suggestions.cards.findIndex(card => card.readOnly))) / size)
  const page = Math.min(pages - 1, navigation?.source === suggestions && navigation.size === size ? navigation.page : initial)
  const cards = suggestions.getPage ? suggestions.getPage(page, size) : suggestions.cards.slice(page * size, (page + 1) * size)
  if (!count && !suggestions.message) return null
  return <tr className="blueprint-count-suggestions-row"><td colSpan={6}>
    <div className="blueprint-count-suggestions-heading">
      <strong>Suggestions</strong>
      {pages > 1 && <nav className="blueprint-count-pagination" aria-label="Suggestion pages">
        <button type="button" aria-label="Previous suggestions" disabled={page === 0} onClick={() => setNavigation({ source: suggestions, size, page: page - 1 })}><ChevronLeft size={14} aria-hidden="true" /></button>
        <span aria-live="polite">{page + 1} / {pages}</span>
        <button type="button" aria-label="Next suggestions" disabled={page === pages - 1} onClick={() => setNavigation({ source: suggestions, size, page: page + 1 })}><ChevronRight size={14} aria-hidden="true" /></button>
      </nav>}
    </div>
    <div className="blueprint-count-suggestions" aria-label="Suggested question counts">
      {cards.map(card => {
        const Card = card.readOnly ? 'div' : 'button'
        const complete = card.after.total === 0 && card.after.hot === 0 && card.after.lot === 0
        const warning = card.warning && !card.warning.startsWith('Add another row') ? card.warning : ''
        const details = `HoT ${card.hotMarks} marks; LoT ${card.lotMarks} marks. Remaining: ${card.after.hot} HoT marks and ${card.after.lot} LoT marks.`
        return <Card className={`blueprint-count-card ${card.readOnly ? 'is-current' : ''} ${complete ? 'is-allocated' : ''}`} key={`${card.marksPerQuestion}-${card.count}`}
          {...(!card.readOnly ? { type: 'button', onClick: () => onSelect(card.field, card.value, card.lockedHotCents) } : { tabIndex: 0 })}
          title={details} aria-label={`${card.marksPerQuestion} marks times ${card.count} questions equals ${card.marks} marks. ${card.readOnly ? 'Current. ' : ''}${details}`}>
          <strong className="blueprint-count-equation"><b>{card.marksPerQuestion}</b> {card.marksPerQuestion === 1 ? 'mark' : 'marks'} × <b>{card.count}</b> {card.count === 1 ? 'question' : 'questions'} = <b>{card.marks}</b> marks</strong>
          <span className="blueprint-count-card-split">
            {card.isLaq ? <span>HoT/LoT assigned through splits</span> : <><span className="is-hot">HoT <b>{card.hotCount || '-'}</b></span><span className="is-lot">LoT <b>{card.lotCount || '-'}</b></span></>}
            {card.readOnly && <span className="blueprint-count-current"><CheckCircle2 size={12} aria-hidden="true" />Current</span>}
          </span>
          <span className={`blueprint-count-card-balance ${complete ? 'is-complete' : ''}`}>{complete ? <CheckCircle2 size={12} aria-hidden="true" /> : <ChartNoAxesColumn size={12} aria-hidden="true" />}{complete ? 'All marks allocated' : `Remaining: ${card.after.total} marks`}</span>
          {warning && <span className="blueprint-count-warning"><CircleAlert size={12} aria-hidden="true" />{warning}</span>}
        </Card>
      })}
    </div>
    {suggestions.message && <p className="blueprint-count-message" role="status"><CircleAlert size={14} aria-hidden="true" />{suggestions.message}</p>}
  </td></tr>
}
