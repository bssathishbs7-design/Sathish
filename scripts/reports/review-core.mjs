import { validateRequest } from './planning-core.mjs';
export const reviewAreas = ['Functionality', 'Design', 'Permissions', 'Data validation', 'Downstream flows'];
const verdicts = ['No issue identified', 'Potential issue', 'Needs verification', 'Not assessed'];
const string = { type: 'string' };
const object = properties => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) });
export const reviewSchema = object({
  summary: string, limitations: string, questions: string, applicability: object({status:{type:'string',enum:['Applicable','Not applicable']},reason:string}),
  pages: { type: 'array', items: object({ pageId: string,
    functionality: { type: 'string', enum: verdicts }, design: { type: 'string', enum: verdicts },
    findings: { type: 'array', items: object({ title: string, area: { type: 'string', enum: reviewAreas },
      classification: { type: 'string', enum: ['Confirmed issue', 'Potential issue', 'Pending verification'] },
      severity: { type: 'string', enum: ['High', 'Medium', 'Low'] }, evidence: string, recommendation: string, existingFindingId: string }) },
  }) },
});

export function validateReviewRequest(body, report) {
  const context = typeof body.context === 'string' && body.context.trim() ? body.context : 'Review the selected module scope using recorded evidence and source excerpts.';
  const request = validateRequest({ ...body, context: context.length < 20 ? 'Review instructions: ' + context : context, requestType: 'Review existing flow' }, report);
  if (!Array.isArray(body.reviewAreas) || !body.reviewAreas.length || body.reviewAreas.some(area => !reviewAreas.includes(area))) throw Error('Select at least one supported review area.');
  return { ...request, kind:'review', includeAI:true, reviewAreas: [...new Set(body.reviewAreas)] };
}

/** AI-only output cannot create a verified pass or promote a new defect to confirmed. */
export function validateReviewResult(result, request, report) {
  if (!result || ['summary', 'limitations', 'questions'].some(k => typeof result[k] !== 'string') || !Array.isArray(result.pages)) throw Error('Invalid review result.');
  const scoped = report.pages.filter(p => p.moduleId === request.moduleId && !p.removed && (!request.pageIds.length || request.pageIds.includes(p.id)));
  const seen = new Set();
  const pages = result.pages.map(page => {
    if (!scoped.some(p => p.id === page.pageId) || seen.has(page.pageId)) throw Error('AI returned a duplicate or out-of-scope page.');
    seen.add(page.pageId);
    if (!verdicts.includes(page.functionality) || !verdicts.includes(page.design) || !Array.isArray(page.findings)) throw Error('Invalid page review verdict.');
    const findings = page.findings.map((finding, index) => {
      if (['title', 'evidence', 'recommendation', 'existingFindingId'].some(k => typeof finding[k] !== 'string') || !reviewAreas.includes(finding.area) || !['High', 'Medium', 'Low'].includes(finding.severity) || !['Confirmed issue', 'Potential issue', 'Pending verification'].includes(finding.classification)) throw Error('Invalid review finding.');
      const confirmed = report.findings.some(f => f.id === finding.existingFindingId && f.moduleId === request.moduleId && f.pageIds?.includes(page.pageId) && f.type === 'Confirmed issue' && f.state !== 'Resolved');
      const recorded = confirmed ? report.findings.find(f => f.id === finding.existingFindingId) : null;
      return { ...finding, id: `${page.pageId}-F${index + 1}`, classification: finding.classification === 'Confirmed issue' && !confirmed ? 'Potential issue' : finding.classification,
        ...(finding.classification === 'Confirmed issue' && recorded ? { title: recorded.title, evidence: recorded.evidence } : {}) };
    }).filter(f => request.reviewAreas.includes(f.area));
    return { pageId: page.pageId, functionality: request.reviewAreas.includes('Functionality') ? page.functionality : 'Not assessed', design: request.reviewAreas.includes('Design') ? page.design : 'Not assessed', findings };
  });
  for (const page of scoped.filter(p => !seen.has(p.id))) pages.push({ pageId: page.id, functionality: 'Not assessed', design: 'Not assessed', findings: [] });
  const applicability=result.applicability?.status==='Not applicable'&&result.applicability?.reason?.trim()?result.applicability:{status:'Applicable',reason:''};
  return { applicability, summary: result.summary, limitations: result.limitations, questions: result.questions, pages };
}

export function reviewExportLines(review, report) {
  return [`AI review v${review.version}`, `Module: ${review.moduleId}; reviewed source: ${review.fingerprint}`, `Created: ${review.at}; ${review.outdated ? 'Needs re-review — source changed' : 'Source baseline current'}`, `Areas: ${review.request.reviewAreas.join(', ')}`, `Context: ${review.request.context}`, `Attachments: ${review.request.attachments.map(f => f.name).join(', ') || 'None'}`, review.result.summary,
    ...review.result.pages.flatMap(page => [`Page: ${report.pages.find(p => p.id === page.pageId)?.name || page.pageId}`, `Functionality: ${page.functionality}; Design: ${page.design}`, ...page.findings.flatMap(f => [`${f.id}: ${f.title}`, `${f.area} / ${f.classification} / ${f.severity} proposed severity`, `Evidence: ${f.evidence}`, `Next action: ${f.recommendation}`])]),
    `Limitations: ${review.result.limitations}`, `Questions: ${review.result.questions || 'None'}`, 'Test execution evidence: '+JSON.stringify(review.testEvidence||{status:'Pending verification',reason:'Legacy report; no test execution recorded.'}), 'Review status: '+(review.reviewStatus||'Complete'), 'Disagreements: '+JSON.stringify(review.result.disagreements||[]), 'Only recorded test evidence is verified. Browser and production integration checks remain pending. Module completion has not been promoted.', 'Hierarchy version: '+(review.hierarchyVersion||'Legacy seven-stage workflow'), 'Participating roles: '+(review.roles||review.workers).map(r=>r.name||r.worker).join(', '), 'Specialist contributions', JSON.stringify(review.workers, null, 2), 'Review worker history', ...review.workers.map(w => `${w.worker}: ${w.startedAt} — ${w.finishedAt}`)];
}
