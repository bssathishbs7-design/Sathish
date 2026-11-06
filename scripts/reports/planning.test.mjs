import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { syncModules, transition, validateRequest } from './planning-core.mjs';
import { wordDocument } from './planning-export.mjs';
import { createPlanningServer } from './planning-server.mjs';
import { sections } from './planning-provider.mjs';

const report = { version: '1.0', modules: [{ id: 'student', name: 'Student', version: '1.0', observedSource: { fingerprint: 'a' }, reviewState: 'Not reviewed' }], pages: [{ id: 'P1', moduleId: 'student' }], findings: [] };
const state = () => ({ modules: {}, drafts: {}, runs: [], plans: [] });
const request = { moduleId: 'student', context: 'Review student onboarding and downstream permission flows.', requestType: 'Review existing flow', pageIds: [], attachments: [] };
test('source changes invalidate approvals and retain historical plans', () => {
  const data = state(); syncModules(data, report); data.modules.student.approvedPlanId = 'plan'; data.plans.push({ id: 'plan', moduleId: 'student' });
  syncModules(data, { ...report, modules: [{ ...report.modules[0], observedSource: { fingerprint: 'b' } }] });
  assert.equal(data.modules.student.status, 'Needs re-review'); assert.equal(data.modules.student.approvedPlanId, undefined); assert.equal(data.plans[0].outdated, true);
});
test('completion requires approval and verification, with stale update protection', () => {
  const data = state(); syncModules(data, report); const record = data.modules.student; record.status = 'Pending verification';
  assert.throws(() => transition(data, 'student', 'Complete', 'Verified all acceptance checks with recorded evidence.', 0), /approved/);
  record.approvedPlanId = 'plan'; data.plans.push({ id: 'plan', moduleId: 'student', outdated: false });
  assert.throws(() => transition(data, 'student', 'Complete', '', 0), /evidence/);
  transition(data, 'student', 'Complete', 'Verified all acceptance checks with recorded evidence.', 0);
  assert.throws(() => transition(data, 'student', 'Needs re-review', 'Review due to a new dependency change.', 0), /changed/);
});
test('request validation rejects wrong page ownership and oversized documents', () => {
  assert.equal(validateRequest(request, report).moduleId, 'student');
  assert.throws(() => validateRequest({ ...request, pageIds: ['foreign'] }, report), /scope/);
  assert.throws(() => validateRequest({ ...request, attachments: [{ name: 'x.pdf', type: 'application/pdf', data: Buffer.from('not a pdf').toString('base64') }] }, report), /Invalid PDF/);
});
test('Word exports are valid Open XML ZIP documents and escape content', () => {
  const files = unzipSync(wordDocument(['Student report', '<scope> & evidence']));
  assert.ok(files['[Content_Types].xml']); assert.match(strFromU8(files['word/document.xml']), /&lt;scope&gt; &amp; evidence/);
});

test('HTTP planning: confirmation, idempotency, hierarchical stages, version persistence and local origin boundary', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'medsy-planning-test-'));
  fs.mkdirSync(path.join(root, 'reports/product-review'), { recursive: true }); fs.writeFileSync(path.join(root, 'reports/product-review/data.json'), JSON.stringify(report));
  const result = Object.fromEntries(sections.map(key => [key, key === 'questions' ? '' : 'Fixture planning output; no actual AI call.']));
  let calls = 0;
  const server = createPlanningServer({ root, refresh: false, config: { ready: true, model: 'test-fixture' }, provider: async () => { calls++; return result; } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = (route, body, origin = base) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });
  try {
    assert.equal((await post('/api/drafts', request, 'https://untrusted.example')).status, 403);
    assert.equal((await post('/api/drafts', request)).status, 200);
    assert.equal((await post('/api/runs', request)).status, 400);
    const confirmed = { ...request, confirmed: true, idempotencyKey: 'test-once', fingerprint: 'a' };
    const first = await (await post('/api/runs', confirmed)).json();
    assert.equal((await (await post('/api/runs', confirmed)).json()).runId, first.runId);
    let workspace;
    for (let n = 0; n < 40; n++) { workspace = await (await fetch(base + '/api/bootstrap')).json(); if (workspace.runs[0].status === 'Complete') break; await new Promise(r => setTimeout(r, 10)); }
    assert.equal(workspace.modules.student.status, 'Plan ready'); assert.equal(calls, 10); assert.equal(workspace.plans.length, 1);
    assert.equal(workspace.runs[0].steps.length, 10); assert.equal(workspace.plans[0].hierarchyVersion, '1.1'); assert.equal(workspace.plans[0].roles.at(-1).id, 'executive'); assert.equal(workspace.runs[0].steps.at(-1).roleId, 'executive'); assert.equal(workspace.drafts.student.context, request.context);
    const disk = JSON.parse(fs.readFileSync(path.join(root, '.product-planning.local/workspace.json'))); assert.equal(disk.plans[0].version, '1.0');
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(root, { recursive: true, force: true }); }
});

test('cancelled and failed runs never publish plans; unconfigured service keeps drafts usable', async () => {
  for (const mode of ['cancel', 'failure', 'disconnected']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'medsy-planning-failure-'));
    fs.mkdirSync(path.join(root, 'reports/product-review'), { recursive: true }); fs.writeFileSync(path.join(root, 'reports/product-review/data.json'), JSON.stringify(report));
    const provider = async (_config, _context, _worker, signal) => { if (mode === 'failure') throw Error('Test provider failure'); await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); };
    const server = createPlanningServer({ root, refresh: false, config: { ready: mode !== 'disconnected', model: 'test-fixture' }, provider });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const post = (route, body) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) });
    try {
      assert.equal((await post('/api/drafts', request)).status, 200);
      const response = await post('/api/runs', { ...request, confirmed: true, idempotencyKey: mode, fingerprint: 'a' });
      assert.equal(response.status, mode === 'disconnected' ? 400 : 202);
      if (mode === 'cancel') assert.equal((await post('/api/cancel', { moduleId: 'student' })).status, 200);
      let workspace;
      for (let n = 0; n < 30; n++) { workspace = await (await fetch(base + '/api/bootstrap')).json(); if (!workspace.runs.some(r => ['Running', 'Queued'].includes(r.status))) break; await new Promise(r => setTimeout(r, 10)); }
      assert.equal(workspace.plans.length, 0);
      if (mode !== 'disconnected') { assert.equal(workspace.runs[0].status, mode === 'cancel' ? 'Cancelled' : 'Failed'); assert.equal(workspace.modules.student.status, 'Blocked'); }
      assert.ok(workspace.drafts.student);
    } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(root, { recursive: true, force: true }); }
  }
});
