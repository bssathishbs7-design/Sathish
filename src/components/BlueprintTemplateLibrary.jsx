import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Search, Pencil, Trash2, Share2, Send } from 'lucide-react'
import BlueprintDownloadMenu from './BlueprintDownloadMenu'
import FloatingTooltip from './FloatingTooltip'
import BlueprintSharePopover from './BlueprintSharePopover'
import { resolveTemplateCognition } from '../services/blueprintTemplates'
import { getBlueprintTemplateStatus } from '../services/blueprintTemplateStatus'
import './BlueprintTemplateLibrary.css'

/** Only complete blueprint templates are listed; search narrows that list.
 * @param {{templates:Array,selectedId?:string,newIds?:string[],disabled?:boolean,error?:string,onAction:Function,busyId?:string,onEdit:Function,onDelete:Function,onDisable:Function,workflow?:Object,renderProgress?:Function}} props
 */
export default function BlueprintTemplateLibrary({ templates, selectedId, newIds = [], disabled, error, onAction, busyId, onEdit, onDelete, onDisable, workflow, renderProgress }) {
  const [query, setQuery] = useState('')
  const [shareTarget, setShareTarget] = useState(null)
  const closeShare = useCallback(() => setShareTarget(null), [])
  const [exporting, setExporting] = useState(null)
  const [exportMessage, setExportMessage] = useState('')
  const exportLock = useRef(false)
  const download = async (template, format) => {
    if (exportLock.current) return
    exportLock.current = true
    setExporting({ id: template.id, format })
    setExportMessage('')
    try {
      const exporter = await import('../services/blueprintTemplateExport.js')
      await (format === 'pdf' ? exporter.downloadBlueprintPdf(template) : exporter.downloadBlueprintExcel(template))
    } catch (failure) { setExportMessage(`Unable to download: ${failure.message || 'Please try again.'}`) }
    finally { exportLock.current = false; setExporting(null) }
  }
  const completeTemplates = templates.filter(template => template.schemaVersion === 2 && template.blueprint)
  const activeTemplateId = completeTemplates.find(template => getBlueprintTemplateStatus(template, selectedId, workflow).tone === 'active')?.id
  useEffect(() => { setQuery('') }, [activeTemplateId])
  const rows = completeTemplates.filter(template => activeTemplateId
    ? template.id === activeTemplateId
    : `${template.name} ${template.blueprint?.blueprintDraft.subject || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(newIds.includes(b.id)) - Number(newIds.includes(a.id))
      || Number(b.id === selectedId) - Number(a.id === selectedId)
      || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  return <section className="blueprint-template-library qb-sort-scope" aria-labelledby="blueprint-library-title" tabIndex={-1}>
    {shareTarget && <BlueprintSharePopover key={shareTarget.template.id} template={shareTarget.template} anchor={shareTarget.anchor} onClose={closeShare} />}
    {error && <p role="alert">{error}</p>}
    {exportMessage && <p role="status">{exportMessage}</p>}
    <div className="blueprint-library-tools">
      <h3 id="blueprint-library-title">All Saved Blueprint Templates <span>({completeTemplates.length})</span></h3>
      <label><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search Blueprint Template" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Blueprint Template" /></label>
    </div>
    <div className="blueprint-library-scroll" tabIndex={0} role="region" aria-label="Saved blueprint templates">
      <table>
        <thead><tr><th scope="col">ID &amp; Date</th><th scope="col">Template</th><th scope="col">Subject</th><th scope="col" className="is-number">Marks</th><th scope="col">Tools</th><th scope="col">Action</th><th scope="col" className="blueprint-library-use">Use Blueprint</th><th scope="col">Status</th></tr></thead>
        <tbody>{rows.map(template => {
          const cognition = resolveTemplateCognition(template)
          const status = getBlueprintTemplateStatus(template, selectedId, workflow)
          const approval = template.templateApprovalStatus || (workflow?.snapshot?.blueprintDraft?.template === template.id ? workflow.status : null)
          const pending = approval === 'Pending Approval'
          const changesRequested = ['Rejected', 'Approval Rejected', 'Revision required'].includes(approval)
          const approved = approval === 'Approved' || template.approved
          const approvalLabel = ['Rejected', 'Revision required'].includes(approval) ? 'Resent for Approval' : 'Send for Approval'
          const blueprintId = [template.blueprintId, template.blueprint?.blueprintId, workflow?.snapshot?.blueprintDraft?.template === template.id ? workflow.blueprintId : null, template.id]
            .find(value => typeof value === 'string' && /(?:^|-)BP-/.test(value)) || 'Not assigned'
          const created = template.createdAt ? new Date(template.createdAt) : null
          const createdDate = created && !Number.isNaN(created.getTime()) ? created.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not available'

          const blockedByActive = Boolean(selectedId && selectedId !== template.id)
          const actionsLocked = blockedByActive || status.tone === "active"
          const blockedHint = "Turn off the active blueprint first."
          const withBlockedHint = (control, locked = blockedByActive) => locked ? <FloatingTooltip content={blockedHint} className="blueprint-library-tool-tip" tooltipClassName="blueprint-library-tooltip" arrow>{control}</FloatingTooltip> : control
          const useSwitch = <button type="button" role="switch" className="blueprint-library-switch" aria-label={"Use Blueprint: " + template.name} aria-checked={selectedId === template.id} disabled={disabled || Boolean(busyId) || !template.blueprint || blockedByActive || pending || changesRequested} onClick={() => { if (blockedByActive || pending || changesRequested) return; selectedId === template.id ? onDisable() : onAction(template.id, "continue") }}><span aria-hidden="true" /></button>
          return <Fragment key={template.id}><tr className={selectedId === template.id ? 'is-selected' : ''}>
          <td data-label="ID & Date" className="blueprint-library-identity"><span title={blueprintId}>{blueprintId}</span><small>{createdDate}</small></td>
          <td data-label="Template"><strong>{template.name}</strong>{newIds.includes(template.id) && <span className="blueprint-library-new">New</span>}<small>{template.scope === 'institution' ? 'Institution' : template.createdBy || 'Personal template'}</small></td>
          <td data-label="Subject"><strong>{template.blueprint?.blueprintDraft.subject || 'Choose when applying'}</strong><small className="blueprint-library-cognition">LoT: {cognition ? `${Number(Number(cognition.lot).toFixed(2))}%` : '—'} · HoT: {cognition ? `${Number(Number(cognition.hot).toFixed(2))}%` : '—'}</small></td>


          <td data-label="Marks" className="is-number">{template.totalMarks}</td>
          <td data-label="Tools">
            <div className="blueprint-library-downloads" aria-busy={exporting?.id === template.id}>
              {withBlockedHint(<BlueprintDownloadMenu name={template.name} disabled={blockedByActive || Boolean(exporting)} busy={exporting?.id === template.id} onDownload={format => download(template, format)} />)}
              {!approved && <FloatingTooltip content={pending ? "Awaiting approval." : actionsLocked ? blockedHint : "Edit template"} className="blueprint-library-tool-tip" tooltipClassName="blueprint-library-tooltip" triggerTabIndex={pending || actionsLocked ? 0 : -1} arrow><button type="button" data-tool="Edit template" aria-label={`Edit template ${template.name}`} disabled={pending || actionsLocked || disabled || Boolean(busyId) || template.scope === 'institution' || template.approved} onClick={() => onEdit(template)}><Pencil size={14} aria-hidden="true" /></button></FloatingTooltip>}
              {!approved && <FloatingTooltip content={pending ? "Awaiting approval." : actionsLocked ? blockedHint : "Delete template"} className="blueprint-library-tool-tip" tooltipClassName="blueprint-library-tooltip" triggerTabIndex={pending || actionsLocked ? 0 : -1} arrow><button type="button" data-tool="Delete template" aria-label={`Delete template ${template.name}`} disabled={pending || actionsLocked || disabled || Boolean(busyId) || template.scope === 'institution' || template.approved} onClick={() => onDelete(template)}><Trash2 size={14} aria-hidden="true" /></button></FloatingTooltip>}
              <FloatingTooltip content={actionsLocked ? blockedHint : "Share template"} className="blueprint-library-tool-tip" tooltipClassName="blueprint-library-tooltip" triggerTabIndex={actionsLocked ? 0 : -1} arrow><button type="button" data-tool="Share template" disabled={actionsLocked} aria-label={`Share template ${template.name}`} aria-haspopup="dialog" aria-expanded={shareTarget?.template.id === template.id} onClick={event => setShareTarget(shareTarget?.template.id === template.id ? null : { template, anchor: event.currentTarget })}><Share2 size={14} aria-hidden="true" /></button></FloatingTooltip>
            </div>
            {exporting?.id === template.id && <small role="status">Preparing {exporting.format === 'pdf' ? 'PDF' : 'Excel'}…</small>}
          </td>
          <td data-label="Action">
            <div className="blueprint-library-row-actions" aria-busy={busyId === template.id}>
              {!approved && withBlockedHint(<button type="button" disabled={actionsLocked || disabled || Boolean(busyId) || !template.blueprint || template.templateApprovalStatus === 'Pending Approval'} className={approvalLabel === "Resent for Approval" ? "is-resubmit" : undefined} aria-label={`${approvalLabel}: ${template.name}`} onClick={() => onAction(template.id, 'approval')}><Send size={14} aria-hidden="true" /><span>{approvalLabel}</span></button>, actionsLocked)}
            </div>
            {busyId === template.id && <small role="status">Preparing blueprint…</small>}
          </td>
          <td data-label="Use Blueprint" className="blueprint-library-use">{pending || changesRequested || blockedByActive ? <FloatingTooltip content={pending ? "Awaiting approval." : changesRequested ? "Resolve the requested changes and obtain approval before using this blueprint." : blockedHint} className="blueprint-library-tool-tip" tooltipClassName="blueprint-library-tooltip" label={"Use Blueprint unavailable for " + template.name} arrow>{useSwitch}</FloatingTooltip> : useSwitch}</td>
          <td data-label="Status"><span className={`blueprint-library-status is-${status.tone}`}>{status.label}</span></td>
        </tr>
          {status.tone === "active" && renderProgress && <tr className="blueprint-library-child"><td colSpan={8}>{renderProgress()}</td></tr>}
        </Fragment>})}
        {!rows.length && <tr><td colSpan={8}>{query ? 'No matching templates.' : 'No templates saved yet. Use Create blueprint to save your first template.'}</td></tr>}
        </tbody>
      </table>
    </div>
  </section>
}
