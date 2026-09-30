import { logbookInsights, SAMPLE_POSTINGS } from '../../services/logbookInsights'
import { isGraded, awaitingRemedial } from '../../services/logbookPeople'
import './LogbookInsights.css'

/** Actionable insights inside the existing overview; sample schedules are explicitly identified. */
export default function LogbookInsights({ entries, identity, onNavigate, onSubject }) {
  const sample = (identity.id || identity.registerId) === 'MC2568'
  const data = logbookInsights(entries, identity.postings || (sample ? SAMPLE_POSTINGS : []))
  const unknown = data.skills.filter(skill => !skill.required).length
  const remedial = entries.filter(entry => isGraded(entry) && awaitingRemedial(entry, entries)).length
  return <section className="lb-overview-panel lb-learning-insights"><h2>Learning progress and follow-up</h2><div className="lb-insight-grid">
    <button className="lb-insight" onClick={() => onNavigate('search', undefined, 'Pending')}><strong>{data.aged} over 14 days</strong><span>{data.pending} waiting on faculty · oldest {data.oldest} days</span></button>
    <button className="lb-insight" onClick={() => onNavigate('subjects')}><strong>{data.skills.filter(skill => skill.complete).length}/{data.skills.length} started skills certified</strong><span>{remedial} returned attempts need follow-up{unknown ? ` · ${unknown} targets not configured` : ''}</span></button>
    <button className="lb-insight" onClick={() => onNavigate('subjects')}><strong>{data.unstarted.length} requirements not started</strong><span>In subjects with submitted work · {data.week} entries submitted in the last 7 days</span></button>
    {data.posting ? <button className="lb-insight" onClick={() => onSubject(data.posting.subject)}><strong>{data.posting.subject} · {data.posting.days} {data.posting.days === 1 ? 'day' : 'days'} left</strong><span>{data.posting.outstanding} category records outstanding · ends {data.posting.end}{sample && !identity.postings ? ' · sample schedule' : ''}</span></button> : <div className="lb-insight"><strong>Posting schedule not configured</strong><span>No upcoming posting dates are available for this learner.</span></div>}
  </div></section>
}
