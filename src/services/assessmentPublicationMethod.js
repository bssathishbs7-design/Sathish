/** Resolve original publication provenance; unknown historical records remain unlabelled.
 * @param {Object} record Published assessment, including saved setup and publication log.
 * @returns {'direct'|'approval'|''}
 */
export function getAssessmentPublicationMethod(record = {}) {
  const explicit = record.publicationMethod ?? record.setup?.publicationMethod
  if (['direct','approval'].includes(explicit)) return explicit
  const notes = (record.publishedLog || []).map(row => String(row.remarks || '').toLowerCase())
  if (notes.some(note => note.includes('approved and published') || note.includes('approval publish'))) return 'approval'
  if (notes.some(note => note.includes('direct publish'))) return 'direct'
  if (!record.publishedAt) return ''
  if (record.setup?.approvalFlow === 'Send to Approval' && (record.approvalStatus === 'Approved' || record.reviewedAt)) return 'approval'
  if (record.setup?.approvalFlow === 'Direct Publish') return 'direct'
  return ''
}
