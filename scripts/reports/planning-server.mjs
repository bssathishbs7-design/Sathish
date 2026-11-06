import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateReport } from './update-reference.mjs';
import { storage, syncModules, transition, validateRequest, id, now } from './planning-core.mjs';
import { connectionInput, verifyConnection, saveConnection } from './planning-connection.mjs';
import { runModuleTests } from './review-testing.mjs';
import { consolidateReview } from './review-summary.mjs';
import { hierarchyVersion, rolesForRequest } from './team-hierarchy.mjs';
import { configuration, generate } from './planning-provider.mjs';
import { reportLines, wordDocument, printDocument } from './planning-export.mjs';
import { pdfDocument } from './planning-pdf.mjs';
import { validateReviewRequest, validateReviewResult, reviewExportLines } from './review-core.mjs';

export function createPlanningServer({ root, directory = path.join(root, '.product-planning.local'), provider = generate, config = configuration(root), refresh = true, verifier = verifyConnection, testRunner = runModuleTests }) {
  const db = storage(directory), active = new Map();
  let linking = false;
  const readReport = () => { if (refresh) updateReport({ root }); return JSON.parse(fs.readFileSync(path.join(root, 'reports/product-review/data.json'), 'utf8')); };
  let report = readReport(); syncModules(db.state, report);
  for (const run of db.state.runs.filter(r => ['Running', 'Queued'].includes(r.status))) {
    run.status = 'Interrupted'; run.error = 'Local service restarted. Retry explicitly.';
    const record = db.state.modules[run.moduleId]; if(run.kind==='review')record.reviewStatus='Interrupted';else record.status = 'Blocked'; record.revision++;
    record.history.unshift({ at: now(), status: run.kind==='review'?'Review interrupted':'Blocked', note: run.error });
  }
  db.save();
  const sync = () => { report = readReport(); syncModules(db.state, report); db.save(); };
  async function execute(run, controller) {
    const record = db.state.modules[run.moduleId];
    const reviewing=run.kind==='review';
    const mark = status => { if(reviewing)record.reviewStatus=status;else record.status = status; record.revision++; record.history.unshift({ at: now(), status, note: `AI ${reviewing?'review':'plan'} run ${run.id}` }); db.save(); };
    try {
      run.status = 'Running'; mark('AI reviewing');
      const module = report.modules.find(m => m.id === run.moduleId);
      const source = []; let remaining = 90000;
      for (const file of module._watchedFiles || []) {
        if (!file.startsWith('src/') || !/\.(jsx?|css)$/.test(file) || remaining <= 0) continue;
        const resolved = path.resolve(root, file);
        if (!resolved.startsWith(path.resolve(root, 'src') + path.sep) || fs.lstatSync(resolved).isSymbolicLink()) continue;
        const text = fs.readFileSync(resolved, 'utf8'); const excerpt = text.slice(0, Math.min(12000, remaining)); remaining -= excerpt.length;
        source.push({ file, excerpt, truncated: excerpt.length < text.length });
      }
      if(reviewing){run.testEvidence={status:'Running',files:[]};db.save();run.testEvidence=await testRunner({root,moduleId:run.moduleId,signal:controller.signal});db.save();controller.signal.throwIfAborted();sync();if(record.fingerprint!==run.fingerprint)throw Error('Source changed during tests. Start a new review.');}
      const context = { testEvidence:run.testEvidence, request: { ...run.request, attachments: run.request.attachments.map(f => ({ name: f.name, type: f.type })) }, module: { name: module.name, summary: module.summary, journey: module.journey, audit: module.reviewState }, pages: report.pages.filter(p => p.moduleId === run.moduleId && (!run.request.pageIds.length || run.request.pageIds.includes(p.id))), findings: report.findings.filter(f => f.moduleId === run.moduleId), source, limitations: 'Bounded source excerpts. Only testEvidence records executed checks; no browser or production integration checks are executed.', previousPlan: db.state.plans.filter(p => p.moduleId === run.moduleId).at(-1)?.result };
      for (const role of run.roles) {
        const worker = role.name;
        controller.signal.throwIfAborted();
        const step = { roleId: role.id, worker, status: 'Running', startedAt: now() }; run.steps.push(step); db.save();
        let result = await provider(config, { ...context, role, hierarchyVersion: run.hierarchyVersion, synthesisInstruction: 'Use your functional ownership. Leadership must reconcile earlier outputs and surface unresolved disagreements; never approve scope, budgets or implementation.', mode: reviewing?'review':'plan', workerOutputs: run.steps.filter(s => s.result).map(s => ({ roleId: s.roleId, worker: s.worker, result: s.result })) }, worker, controller.signal, run.steps.length === 1 ? run.request.attachments : [], reviewing);
        if(reviewing)result=validateReviewResult(result,run.request,report);
        controller.signal.throwIfAborted(); sync();
        if (record.fingerprint !== run.fingerprint) throw Error('Source changed during planning. Results cannot become a current plan; review and retry.');
        step.result = result; step.status = 'Complete'; step.finishedAt = now(); db.save();
      }
      const result = reviewing?consolidateReview(run.steps):run.steps.at(-1).result;
      const collection=reviewing?db.state.reviews:db.state.plans;
      const plan = { ...(reviewing?{testEvidence:run.testEvidence,reviewStatus:'Complete'}:{}), hierarchyVersion: run.hierarchyVersion, roles: run.roles, id: id(), moduleId: run.moduleId, moduleVersion: module.version, version: `1.${collection.filter(p => p.moduleId === run.moduleId).length}`, at: now(), fingerprint: run.fingerprint, outdated: false, request: run.request, result, workers: run.steps.map(s => ({ roleId: s.roleId, worker: s.worker, result: s.result, startedAt:s.startedAt, finishedAt:s.finishedAt })) };
      collection.push(plan); run.status = 'Complete'; run[reviewing?'reviewId':'planId'] = plan.id; run.finishedAt = now(); mark(result.questions.trim() ? 'Needs clarification' : reviewing?'Complete':'Plan ready');
    } catch (error) {
      run.status = controller.signal.aborted ? 'Cancelled' : 'Failed'; run.error = error.message; run.finishedAt = now();
      for (const step of run.steps.filter(s => s.status === 'Running')) step.status = run.status;
      if(reviewing&&run.steps.some(s=>s.result)){
        const partial={id:id(),moduleId:run.moduleId,moduleVersion:report.modules.find(m=>m.id===run.moduleId).version,version:'1.'+db.state.reviews.filter(r=>r.moduleId===run.moduleId).length,at:now(),fingerprint:run.fingerprint,outdated:record.fingerprint!==run.fingerprint,request:run.request,result:consolidateReview(run.steps),workers:run.steps.filter(s=>s.result),roles:run.roles,hierarchyVersion:run.hierarchyVersion,testEvidence:run.testEvidence,reviewStatus:'Partial'};
        partial.result.summary='Partial review. Leadership synthesis did not complete. '+partial.result.summary;
        db.state.reviews.push(partial);run.reviewId=partial.id;
      }
      if (record.fingerprint === run.fingerprint) mark(reviewing&&run.reviewId?'Partial':'Blocked'); else db.save();
    } finally { active.delete(run.moduleId); }
  }
  const server = http.createServer(async (request, response) => {
    const send = (status, data) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); };
    try {
      const host = request.headers.host;
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host || '')) return send(403, { error: 'Local access only.' });
      if (request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Open the workspace directly on localhost.' });
      const url = new URL(request.url, `http://${host}`);
      response.setHeader('X-Content-Type-Options', 'nosniff'); response.setHeader('Referrer-Policy', 'no-referrer');
      if (request.method === 'GET' && ['/', '/business-analyst-reference.html'].includes(url.pathname)) {
        sync(); response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return response.end(fs.readFileSync(path.join(root, 'business-analyst-reference.html')));
      }
      if (request.method === 'GET' && url.pathname === '/api/connection') return send(200, { hasKey: Boolean(config.key), model: config.model || '', ready: config.ready });
      if (request.method === 'GET' && url.pathname === '/api/bootstrap') {
        sync(); return send(200, { ...db.state, ready: config.ready, model: config.ready ? config.model : null, reportVersion: report.version });
      }
      if (request.method === 'GET' && url.pathname === '/api/export') {
        sync(); const moduleId = url.searchParams.get('module'); const lines = reportLines(report, db.state, moduleId, url.searchParams.get('plan'));
        if(url.searchParams.has('review')||(!url.searchParams.has('plan')&&db.state.reviews.some(r=>r.moduleId===moduleId))){
          const review=url.searchParams.has('review')?db.state.reviews.find(r=>r.id===url.searchParams.get('review')&&r.moduleId===moduleId):db.state.reviews.filter(r=>r.moduleId===moduleId).at(-1);
          if(!review)throw Error('Unknown module review.');lines.push(...reviewExportLines(review,report));
        }
        if (url.searchParams.get('format') === 'pdf') { const pdf = await pdfDocument(printDocument(lines), directory); response.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${moduleId}-report.pdf"` }); return response.end(pdf); }
        if (url.searchParams.get('format') !== 'docx') throw Error('Only Word or PDF is supported.');
        response.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="${moduleId}-report.docx"` }); return response.end(wordDocument(lines));
      }
      if (request.method !== 'POST' || request.headers.origin !== `http://${host}` || request.headers['content-type'] !== 'application/json') return send(403, { error: 'Use the local workspace for this action.' });
      let length = 0; const chunks = [];
      for await (const chunk of request) { length += chunk.length; if (length > 15 * 1024 * 1024) throw Error('Request exceeds 15 MB.'); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString()); sync();
      if (url.pathname === '/api/connection') {
        if (linking || active.size) throw Error('Wait for the current connection check or AI runs to finish.');
        const candidate = connectionInput(body, config);
        linking = true;
        try { await verifier(candidate); saveConnection(root, candidate); Object.assign(config, candidate); return send(200, { ready: true, model: config.model, hasKey: true }); }
        finally { linking = false; }
      }
      if (url.pathname === '/api/drafts') { const draft = validateRequest(body, report); db.state.drafts[draft.moduleId] = { ...draft, savedAt: now() }; db.save(); return send(200, { saved: true }); }
      if(url.pathname==='/api/review-drafts'){const draft=validateReviewRequest(body,report);db.state.reviewDrafts[draft.moduleId]={...draft,savedAt:now()};db.save();return send(200,{saved:true});}
      if(url.pathname==='/api/review-to-plan'){
        const review=db.state.reviews.find(r=>r.id===body.reviewId&&r.moduleId===body.moduleId);
        if(!review||review.reviewStatus==='Partial'||review.outdated||review.fingerprint!==db.state.modules[body.moduleId]?.fingerprint)throw Error('Review source is outdated. Run a new review before preparing a plan.');
        if(!Array.isArray(body.findingIds)||!body.findingIds.length)throw Error('Select at least one finding.');
        const all=review.result.pages.flatMap(page=>page.findings.map(f=>({...f,pageId:page.pageId})));
        if(body.findingIds.some(id=>!all.some(f=>f.id===id)))throw Error('Unknown review finding.');
        const selected=all.filter(f=>body.findingIds.includes(f.id));
        const draft={includeAI:review.request.includeAI===true,moduleId:body.moduleId,requestType:'Fix issue',pageIds:[...new Set(selected.map(f=>f.pageId))],attachments:[],constraints:'Investigate potential issues before implementation. Preserve approved baseline scope.',context:`Prepare a plan for selected findings from AI review v${review.version} (${review.id}). See the review test evidence for executed checks; browser and production integration verification remain pending.\n`+selected.map(f=>`${f.id} / ${f.classification} / ${f.title}\nEvidence: ${f.evidence}\nRecommended next action: ${f.recommendation}`).join('\n\n')};
        if(draft.context.length>16000)throw Error('Selected findings exceed the planning context limit. Select fewer findings.');
        return send(200,{draft});
      }
      if (url.pathname === '/api/transition') {
        if (active.has(body.moduleId)) throw Error('Wait for the current AI run or cancel it.');
        transition(db.state, body.moduleId, body.status, body.note, body.revision, body.planId); db.save(); return send(200, { saved: true });
      }
      if (url.pathname === '/api/cancel') { const controller = active.get(body.moduleId); if (!controller) throw Error('No active run.'); controller.abort(Error('Cancelled by user.')); return send(200, { cancelled: true }); }
      if (url.pathname === '/api/runs' || url.pathname === '/api/reviews') {
        const reviewing=url.pathname==='/api/reviews';
        if (linking) throw Error('Wait for the connection check to finish.');
        if (!config.ready) throw Error('AI is not configured. Use the AI connection button in the header. Drafts remain available.');
        if (body.confirmed !== true || typeof body.idempotencyKey !== 'string' || body.idempotencyKey.length > 100) throw Error('Confirm the planning request first.');
        const existing = db.state.runs.find(r => r.key === body.idempotencyKey); if (existing) {if(existing.moduleId!==body.moduleId||(existing.kind==='review')!==reviewing)throw Error('Confirmation key belongs to a different request.');return send(200, { runId: existing.id });}
        const draft = reviewing?validateReviewRequest(body, report):validateRequest(body, report), record = db.state.modules[draft.moduleId];
        if (active.has(draft.moduleId)) throw Error('An AI run is already active for this module.');
        if (body.fingerprint !== record.fingerprint) throw Error('Source changed. Refresh and confirm the current scope again.');
        const run = { hierarchyVersion, roles: rolesForRequest(draft), id: id(), kind:reviewing?'review':'plan', key: body.idempotencyKey, moduleId: draft.moduleId, request: draft, fingerprint: record.fingerprint, at: now(), status: 'Queued', steps: [] };
        db.state.runs.push(run);if(reviewing)record.reviewStatus='Pending AI review';else{record.status = 'Pending AI review';delete record.approvedPlanId;} record.revision++;
        record.history.unshift({ at: now(), status: reviewing?record.reviewStatus:record.status, note: `Confirmed ${reviewing?'review-only':'plan-only'} run ${run.id}` }); db.save();
        const controller = new AbortController(); active.set(draft.moduleId, controller); send(202, { runId: run.id }); void execute(run, controller); return;
      }
      send(404, { error: 'Unknown action.' });
    } catch (error) { send(400, { error: error.message }); }
  });
  server.on('close', () => { for (const controller of active.values()) controller.abort(); });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const server = createPlanningServer({ root });
  server.listen(6190, '127.0.0.1', () => console.log('Product planning workspace: http://127.0.0.1:6190 (AI remains unavailable until local configuration is complete)'));
}
