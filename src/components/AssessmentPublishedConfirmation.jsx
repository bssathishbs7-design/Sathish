import { Check } from 'lucide-react'
import SaveChangesDialog from './SaveChangesDialog'
import './AssessmentPublishedConfirmation.css'
/** Shared publication feedback. Navigation timing is owned by the calling workflow.
 * @param {{title?:string,message:string,theme?:string,onContinue:Function}} props
 */
export default function AssessmentPublishedConfirmation({title='Assessment published',message,theme,onContinue,continueLabel='Go to Published',navigationMessage='Opening the Published tab...'}) {
 return <SaveChangesDialog className="assessment-published-confirmation qb-sort-scope" theme={theme} title={title} description={message} onCancel={onContinue} cancelLabel={continueLabel}>
   <span className="assessment-published-check" aria-hidden="true"><Check size={32}/></span>
   <p role="status">{navigationMessage}</p>
 </SaveChangesDialog>
}
