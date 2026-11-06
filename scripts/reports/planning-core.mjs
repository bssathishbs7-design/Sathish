import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';


export const transitions = {
  'Not reviewed': ['Pending AI review', 'Blocked'],
  'Pending AI review': ['AI reviewing', 'Blocked'],
  'AI reviewing': ['Plan ready', 'Needs clarification', 'Blocked'],
  'Needs clarification': ['Pending AI review', 'Blocked'],
  'Plan ready': ['Awaiting approval', 'Pending AI review', 'Blocked'],
  'Awaiting approval': ['Approved for implementation', 'Changes required', 'Blocked'],
  'Approved for implementation': ['In progress', 'Changes required', 'Blocked'],
  'In progress': ['Pending verification', 'Blocked'],
  'Pending verification': ['Complete', 'Changes required', 'Blocked'],
  'Changes required': ['Pending AI review', 'In progress', 'Blocked'],
  'Complete': ['Needs re-review'],
  'Needs re-review': ['Pending AI review', 'Blocked'],
  'Blocked': ['Pending AI review'],
};
export const now = () => new Date().toISOString();
export const id = () => randomUUID();

/** Durable local state. Corrupt files fail closed and are never silently replaced. */
export function storage(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'workspace.json');
  const state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { modules: {}, drafts: {}, runs: [], plans: [] };
  if (!state.modules || !state.drafts || !Array.isArray(state.runs) || !Array.isArray(state.plans)) throw Error('Invalid workspace storage; restore a backup before starting.');
  state.reviews ??= []; state.reviewDrafts ??= {};
  if (!Array.isArray(state.reviews) || !state.reviewDrafts || typeof state.reviewDrafts !== 'object' || Array.isArray(state.reviewDrafts)) throw Error('Invalid review storage.');
  return { state, save() { const temp = file + '.tmp'; fs.writeFileSync(temp, JSON.stringify(state, null, 2)); fs.renameSync(temp, file); } };
}

export function syncModules(state, report) {
  for (const module of report.modules) {
    const fingerprint = module.observedSource?.fingerprint || module.version;
    let record = state.modules[module.id];
    if (!record) record = state.modules[module.id] = { status: module.reviewState === 'Needs re-review' ? 'Needs re-review' : 'Not reviewed', fingerprint, revision: 0, history: [] };
    if (record.fingerprint !== fingerprint) {
      record.status = 'Needs re-review'; record.fingerprint = fingerprint; record.revision++;
      record.history.unshift({ at: now(), status: record.status, note: 'Source changed. Historical plans retained; review required.' });
      state.plans.filter(p => p.moduleId === module.id).forEach(p => { p.outdated = true; });
      (state.reviews || []).filter(r => r.moduleId === module.id).forEach(r => { r.outdated = true; });
      if ((state.reviews || []).some(r => r.moduleId === module.id)) record.reviewStatus = 'Needs re-review';
      delete record.approvedPlanId;
    }
  }
}

export function transition(state, moduleId, status, note, revision, planId) {
  const record = state.modules[moduleId];
  if (!record || record.revision !== revision) throw Error('This module changed. Refresh before updating it.');
  if (!(transitions[record.status] || []).includes(status)) throw Error('This lifecycle transition is not allowed.');
  if (['Pending AI review', 'AI reviewing', 'Plan ready', 'Needs clarification'].includes(status)) throw Error('This status is managed by the AI run.');
  if (!note?.trim() || note.trim().length < 20) throw Error('Record a reason or verification evidence of at least 20 characters.');
  if (status === 'Approved for implementation') {
    const plan = state.plans.find(p => p.id === planId && p.moduleId === moduleId && !p.outdated);
    if (!plan || plan.fingerprint !== record.fingerprint) throw Error('Select a current plan version before approval.');
    record.approvedPlanId = plan.id;
  }
  if (['In progress', 'Pending verification', 'Complete'].includes(status) && !state.plans.some(p => p.id === record.approvedPlanId && !p.outdated)) throw Error('A current approved plan is required.');
  record.status = status; record.revision++;
  record.history.unshift({ at: now(), status, note: note.trim(), planId: record.approvedPlanId || planId || null });
}

/** Attachments stay local until the user confirms a paid AI request. */
export function validateRequest(body, report) {
  const module = report.modules.find(m => m.id === body.moduleId);
  if (!module) throw Error('Unknown module.');
  if (typeof body.context !== 'string' || body.context.trim().length < 20 || body.context.length > 16000) throw Error('Context must contain 20–16,000 characters.');
  if (!['Review existing flow', 'Fix issue', 'Suggest enhancements', 'Plan new feature'].includes(body.requestType)) throw Error('Select a request type.');
  if (!Array.isArray(body.pageIds) || body.pageIds.some(id => !report.pages.some(p => p.id === id && p.moduleId === module.id && !p.removed))) throw Error('Invalid page scope.');
  const attachments = body.attachments || [];
  const allowed = { pdf: 'application/pdf', txt: 'text/plain', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  if (!Array.isArray(attachments) || attachments.length > 3) throw Error('Attach up to three documents.');
  let total = 0;
  for (const file of attachments) {
    const ext = String(file.name).split('.').pop().toLowerCase();
    if (!allowed[ext] || file.type !== allowed[ext] || typeof file.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) throw Error('Unsupported attachment. Use Word, PDF, text, PNG or JPEG.');
    const bytes = Buffer.from(file.data, 'base64'); total += bytes.length;
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw Error('Each attachment must be between 1 byte and 5 MB.');
    if (ext === 'pdf' && bytes.subarray(0, 5).toString() !== '%PDF-') throw Error('Invalid PDF document.');
    if (ext === 'docx' && bytes.subarray(0, 2).toString() !== 'PK') throw Error('Invalid Word document.');
  }
  if (total > 10 * 1024 * 1024) throw Error('Total attachments exceed 10 MB.');
  return { includeAI: body.includeAI === true, moduleId: module.id, requestType: body.requestType, context: body.context.trim(), constraints: String(body.constraints || '').slice(0, 8000), pageIds: body.pageIds, attachments };
}
