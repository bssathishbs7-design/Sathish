import { zipSync, strToU8 } from 'fflate';
const xml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Complete, filter-independent module snapshot and optional immutable plan. */
export function reportLines(report, state, moduleId, planId) {
  const module = report.modules.find(m => m.id === moduleId);
  if (!module) throw Error('Unknown module.');
  const plan = planId ? state.plans.find(p => p.id === planId && p.moduleId === moduleId) : null;
  if (planId && !plan) throw Error('Unknown plan.');
  const record = state.modules[moduleId];
  const lines = [module.name, `Report v${report.version} / Module v${module.version}`, `Exported ${new Date().toISOString()}`, `Source: ${module.observedSource?.commit} / ${module.observedSource?.fingerprint}`, `Lifecycle: ${record.status}; audit: ${module.reviewState}`, module.summary, 'End-to-end journey', JSON.stringify(module.journey, null, 2), 'Pages'];
  for (const page of report.pages.filter(p => p.moduleId === moduleId && !p.removed)) lines.push(`${page.id}: ${page.name}`, `Functionality: ${page.functionality}; design: ${page.design}`, `Roles: ${JSON.stringify(page.roles)}; scope: ${JSON.stringify(page.scope)}`, `Review: ${page.reviewedAt || 'Not reviewed'}`);
  lines.push('Findings and recommendations');
  for (const finding of report.findings.filter(f => f.moduleId === moduleId)) {
    for (const key of ['id', 'title', 'type', 'state', 'priority', 'accountableTeam', 'supportingTeams', 'detail', 'evidence', 'sourceFiles', 'reproduction', 'expected', 'impact', 'solution', 'acceptance']) lines.push(`${key}: ${typeof finding[key] === 'string' ? finding[key] : JSON.stringify(finding[key] ?? '')}`);
    lines.push(`Implementation prompt: Review ${finding.id} against current source. ${finding.solution} Verify ${JSON.stringify(finding.acceptance)}. Do not change unrelated flows. Report actual evidence and limitations.`);
  }
  lines.push('Historical review evidence (not a fresh test run)', JSON.stringify(module.currentReview || module.review, (key, value) => key === 'mobileImage' ? '[Screenshot retained in reference page]' : value, 2), 'Module version history', JSON.stringify(module.history, null, 2), 'Lifecycle history', JSON.stringify(record.history, null, 2));
  if (plan) {
    lines.push(`AI plan v${plan.version} — ${plan.outdated ? 'Outdated' : 'Current source baseline'}`, `Created ${plan.at}; source ${plan.fingerprint}`, `Approval applies only to: ${record.approvedPlanId || 'None'}`, 'Request', JSON.stringify(plan.request, (key, value) => key === 'data' ? '[Attachment content excluded from export]' : value, 2));
    for (const [key, value] of Object.entries(plan.result)) lines.push(key, value);
    lines.push('Hierarchy version: '+(plan.hierarchyVersion||'Legacy seven-stage workflow'), 'Participating roles', JSON.stringify(plan.roles||plan.workers.map(w=>w.worker)), 'AI worker outputs', JSON.stringify(plan.workers, null, 2));
  }
  if(module.codexReview)lines.push('Codex responsibility review',JSON.stringify(module.codexReview,null,2));
  if(module.codexPlan)lines.push('Codex implementation plan',JSON.stringify(module.codexPlan,null,2));
  lines.push('Recorded module dependencies',JSON.stringify(module.related||[]));
  lines.push('Limitations', 'AI proposals are not verified behaviour. Approving a baseline does not execute code. Complete is a recorded verification attestation, not an automatic test pass. This document is a snapshot and does not monitor source changes.');
  return lines.filter(value => value !== undefined && value !== null).flatMap(value => String(value).split('\n'));
}

/** Genuine Open XML Word document, with no HTML masquerading as a .docx file. */
export function wordDocument(lines) {
  const paragraphs = lines.map((line, index) => `<w:p>${index === 0 ? '<w:pPr><w:pStyle w:val="Title"/></w:pPr>' : ''}<w:r><w:t xml:space="preserve">${xml(line)}</w:t></w:r></w:p>`).join('');
  const files = {
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/_rels/document.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'word/styles.xml': '<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:sz w:val="36"/><w:b/><w:color w:val="0F6844"/></w:rPr></w:style></w:styles>',
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/></w:sectPr></w:body></w:document>`,
  };
  return zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
}

export function printDocument(lines) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${xml(lines[0])} — PDF report</title><style>body{font:11pt/1.5 Arial,sans-serif;max-width:180mm;margin:12mm auto;color:#333}p{white-space:pre-wrap;overflow-wrap:anywhere}h1{color:#0f6844;font-size:20pt}@page{size:A4;margin:15mm}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Save as PDF using the print dialog</button><h1>${xml(lines[0])}</h1>${lines.slice(1).map(line => `<p>${xml(line)}</p>`).join('')}</body></html>`;
}
