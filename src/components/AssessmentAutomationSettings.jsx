import { createElement } from 'react'
import { CheckSquare, PenLine, ClipboardCheck, Send, Eye } from 'lucide-react'
import { getAssessmentAutomationConfiguration } from '../services/assessmentAutomation'
import './AssessmentAutomationSettings.css'

/** @param {{setup:Object, types:Object, onChange:Function, onAnswerChange:Function, errors?:Object}} props Current settings and existing update handlers. */
export default function AssessmentAutomationSettings({ setup, types, onChange, onAnswerChange, errors = {} }) {
  const policy = getAssessmentAutomationConfiguration(setup, types)
  const hybrid = policy.rows.length === 2
  const publishEligible = policy.rows.length > 0 && policy.rows.every(row => row.evaluation)
  const publishHelp = hybrid
    ? publishEligible ? 'Publish the combined result automatically after both sections are evaluated.' : 'Requires Enter answers for both sections and AI evaluation for Descriptive in an online exam.'
    : publishEligible ? 'Publish results automatically after evaluation.' : 'Requires Enter answers and automatic evaluation in an online exam.'
  return <div className={'assessment-automation qb-sort-scope' + (hybrid ? ' is-hybrid' : '')}>
    <section className="assessment-automation-answers" aria-label="Answers and results">
    <header className="assessment-automation-title"><strong><ClipboardCheck size={16} aria-hidden="true" /> Answers &amp; Results</strong></header>
    {policy.rows.map(row => {
      const TypeIcon = row.key === 'mcq' ? CheckSquare : PenLine
      return <section className={'assessment-automation-card is-' + row.key} key={row.key} aria-label={row.label + ' settings'}>
        <header><span className="assessment-automation-type-icon"><TypeIcon size={16} aria-hidden="true" /></span><strong>{row.label}</strong></header>
        <div className="assessment-automation-response">
          <div className="assessment-automation-field">
            <span><PenLine size={14} aria-hidden="true" /> Student Response <em>*</em></span>
            <div className="assessment-automation-options" role="group" aria-label={row.label + ' answer mode'}>
              {['Answer Input', 'Read-Only'].map(option => <button type="button" key={option} aria-pressed={setup[row.key + 'DisplayType'] === option} onClick={() => onAnswerChange(row.key + 'DisplayType', option)}>{option === 'Answer Input' ? 'Enter answers' : 'Read-only'}</button>)}
            </div>
            {errors[row.key + 'DisplayType'] && <small className="assessment-automation-error" role="alert">{errors[row.key + 'DisplayType']}</small>}
          </div>
        </div>
        <div className="assessment-automation-fields">
          {!row.enabled ? <p className="assessment-automation-manual"><Eye size={16} aria-hidden="true" /><span>{row.readOnly ? 'Read-only questions' : 'Offline assessment'}<br /><small>{row.readOnly ? 'Students can view questions but cannot enter answers. ' : ''}Manual evaluation and publishing.</small></span></p> : [
            {name:'Evaluation', field:row.key+'AutoEvaluation', active:row.evaluation, fixed:row.key === 'mcq', labels:['AI','Manual'], reason:row.key === 'mcq' ? 'AI Evaluated Automatically' : row.evaluation ? 'AI Evaluated Automatically' : 'Faculty evaluate student responses.', Icon:ClipboardCheck},
          ].map(({Icon, ...control}) => <div className="assessment-automation-field" key={control.field}>
            <span>{createElement(Icon, { size: 14, 'aria-hidden': true })}{control.name}</span>
            {control.fixed ? <span className="assessment-automation-fixed"><CheckSquare size={14} aria-hidden="true" />Automatic</span> : <div className="assessment-automation-options" role="group" aria-label={row.label+' '+control.name}>
              {['Yes','No'].map((option, index) => <button type="button" key={option} disabled={option === 'Yes' && control.automaticDisabled} title={option === 'Yes' && control.automaticDisabled ? control.reason : undefined} aria-pressed={control.active === (option === 'Yes')} onClick={() => onChange(control.field, control.field.endsWith('AutoPublish') ? option === 'Yes' ? 'On' : 'Off' : option)}>{control.labels[index]}</button>)}
            </div>}
            {control.reason && <small className="assessment-automation-note">{control.reason}</small>}
          </div>)}
        </div>
      </section>
    })}
    </section>
    {policy.rows.length > 0 && <div className="assessment-automation-shared-publish">
      <div className="assessment-automation-field">
        <span><Send size={14} aria-hidden="true" />Auto Publish</span>
        <small className="assessment-automation-note" id="assessment-publish-help">{publishHelp}</small>
      </div>
      <div className="assessment-automation-options" role="group" aria-label={hybrid ? "Hybrid auto publish" : policy.rows[0].label + " Auto Publish"} aria-describedby="assessment-publish-help">
        {['On', 'Off'].map(option => <button type="button" key={option} disabled={option === 'On' && !publishEligible} aria-pressed={policy.canAutoPublishCombined === (option === 'On')} onClick={() => onChange(hybrid ? 'hybridAutoPublish' : policy.rows[0].key + 'AutoPublish', option)}>{option}</button>)}
      </div>
    </div>}
  </div>
}
