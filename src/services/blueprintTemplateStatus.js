/** Resolve a template's status in the current assessment from its persisted workflow.
 * @param {Object} template Saved blueprint template.
 * @param {string} selectedId Enabled template ID, or an empty string when disabled.
 * @param {Object|null} workflow Current assessment blueprint workflow and saved snapshot.
 * @returns {{label:string,tone:string}}
 */
export function getBlueprintTemplateStatus(template, selectedId, workflow) {
  const linked = workflow?.snapshot?.blueprintDraft?.template === template.id
  const status = template.templateApprovalStatus || (linked ? workflow.status : null)
  if (template.templateApprovalStatus && selectedId === template.id) return { label: 'Active', tone: 'active' }
  if (status === 'Pending Approval') return { label: 'Pending', tone: 'pending' }
  if (status === 'Rejected' || status === 'Revision required') return { label: 'Needs revision', tone: 'changes' }
  if (selectedId === template.id && linked && ['Approved', 'Not required'].includes(status)) return { label: 'Active', tone: 'active' }
  if (status === 'Approved' || template.approved) return { label: 'Approved', tone: 'approved' }
  return { label: 'Ready', tone: 'ready' }
}
