import { useMemo, useState } from 'react'
import { ClipboardCheck, FlaskConical, Stethoscope } from 'lucide-react'
import '../styles/ospe-activity.css'

const ospeStations = [
  {
    id: 'station-1',
    code: 'OSPE-01',
    title: 'Upper Limb Surface Anatomy',
    domain: 'Anatomy',
    duration: '5 min',
    status: 'Ready',
    focus: 'Landmarks, muscle groups, and palpation prompts.',
  },
  {
    id: 'station-2',
    code: 'OSPE-02',
    title: 'Histology Slide Identification',
    domain: 'Histology',
    duration: '4 min',
    status: 'In Review',
    focus: 'Layer recognition, labeling, and short viva notes.',
  },
  {
    id: 'station-3',
    code: 'OSPE-03',
    title: 'Clinical Instrument Spotter',
    domain: 'Skills Lab',
    duration: '3 min',
    status: 'Draft',
    focus: 'Instrument naming, use case, and safety checkpoints.',
  },
]

function OspeActivityPage({ onAlert }) {
  const [selectedStationId] = useState(ospeStations[0]?.id ?? '')
  const selectedStation = useMemo(
    () => ospeStations.find((station) => station.id === selectedStationId) ?? ospeStations[0],
    [selectedStationId],
  )

  const stationCount = ospeStations.length
  const readyCount = ospeStations.filter((station) => station.status === 'Ready').length
  const totalMinutes = ospeStations.reduce((sum, station) => sum + Number.parseInt(station.duration, 10), 0)

  return (
    <section className="vx-content forms-page ospe-page">
      <div className="ospe-shell">
        <div className="ospe-stats">
          <article className="vx-card ospe-stat-card">
            <span>Visible stations</span>
            <strong>{stationCount}</strong>
            <small>Filtered live from the activity plan.</small>
          </article>
          <article className="vx-card ospe-stat-card">
            <span>Ready for circuit</span>
            <strong>{readyCount}</strong>
            <small>Stations with finalized prompts and timing.</small>
          </article>
          <article className="vx-card ospe-stat-card">
            <span>Total circuit time</span>
            <strong>{totalMinutes} min</strong>
            <small>Combined duration across the current setup.</small>
          </article>
        </div>

        <div className="ospe-layout">
          <section className="vx-card ospe-detail-card">
            <div className="ospe-detail-head">
              <div>
                <span className="ospe-kicker">Selected station</span>
                <h2>{selectedStation?.title ?? 'No station selected'}</h2>
                <p>{selectedStation?.focus ?? 'Choose a station from the list to view the activity brief.'}</p>
              </div>
              <span className="skill-assessment-panel-pill is-live">
                {selectedStation?.status ?? 'Draft'}
              </span>
            </div>

            <div className="ospe-detail-grid">
              <article className="ospe-detail-panel">
                <div className="ospe-detail-label">
                  <ClipboardCheck size={16} strokeWidth={2.1} />
                  <span>Station Snapshot</span>
                </div>
                <div className="ospe-station-summary">
                  <span className="ospe-station-code">{selectedStation?.code ?? 'OSPE-00'}</span>
                  <div className="ospe-station-summary-meta">
                    <strong>{selectedStation?.domain ?? 'General'}</strong>
                    <span>{selectedStation?.duration ?? '0 min'}</span>
                  </div>
                  <em className={`ospe-status is-${selectedStation?.status?.toLowerCase().replace(/\s+/g, '-') ?? 'draft'}`}>
                    {selectedStation?.status ?? 'Draft'}
                  </em>
                </div>
              </article>

              <article className="ospe-detail-panel">
                <div className="ospe-detail-label">
                  <ClipboardCheck size={16} strokeWidth={2.1} />
                  <span>Examiner Checklist</span>
                </div>
                <ul>
                  <li>Confirm candidate identity and station timing before briefing.</li>
                  <li>Observe technique sequence and record key checkpoints.</li>
                  <li>Capture structured feedback before closing the station.</li>
                </ul>
              </article>

              <article className="ospe-detail-panel">
                <div className="ospe-detail-label">
                  <Stethoscope size={16} strokeWidth={2.1} />
                  <span>Student Prompt</span>
                </div>
                <p>
                  Ask the candidate to verbalize the key steps, demonstrate the identified
                  structure or instrument, and explain one clinical correlation.
                </p>
              </article>

              <article className="ospe-detail-panel">
                <div className="ospe-detail-label">
                  <FlaskConical size={16} strokeWidth={2.1} />
                  <span>Preparation Note</span>
                </div>
                <p>
                  Keep one backup station card and image sheet ready so the circuit continues
                  smoothly if a workstation needs to be reset.
                </p>
              </article>
            </div>

            <div className="ospe-detail-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => onAlert?.({ tone: 'primary', message: 'OSPE preview opened for the selected station.' })}
              >
                Preview Station
              </button>
              <button
                type="button"
                className="tool-btn green"
                onClick={() => onAlert?.({ tone: 'secondary', message: 'Selected OSPE station saved successfully.' })}
              >
                Save Station
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default OspeActivityPage
