import './AssessmentCardCollection.css'

/** @param {{view:string,children:import('react').ReactNode}} props */
export default function AssessmentCardCollection({ view, children }) {
  return <div className="assessment-card-collection">
    <div className="assessment-create-draft-grid" data-card-view={view}>
      {children}
    </div>
  </div>
}
