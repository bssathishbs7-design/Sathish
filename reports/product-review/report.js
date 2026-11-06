'use strict';
/** Standalone report renderer. Audit evidence is immutable here; local notes are separate annotations. */
const REPORT = JSON.parse(document.getElementById('report-data').textContent);
const NOTES_KEY = 'medsy-product-review-notes-v1';
const LEGACY_KEY = 'medsy-product-workspace-v1';
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const formatDate = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Calcutta' }).format(new Date(value)) + ' IST' : 'Not recorded';
const openModules = new Set(['student-management']);
const openPages = new Set();
const filters = { audience:'', module:'', page:'', team:'', status:'' };
let toastTimer, storageWritable = true;
let notes = { format:'medsy-review-notes', version:1, annotations:{}, legacyWorkspace:{ version:1, tasks:REPORT.legacyTasks, activity:[] }, updatedAt:null };

function validateNotes(value) {
  if (!value || value.format !== 'medsy-review-notes' || value.version !== 1 || !value.annotations || Array.isArray(value.annotations) || typeof value.annotations !== 'object') throw Error('This is not a supported review-notes backup.');
  if (Object.keys(value.annotations).length > 10000) throw Error('Too many annotations.');
  for (const [key, note] of Object.entries(value.annotations)) {
    if (!/^[A-Z0-9_-]+$/.test(key) || !note || typeof note.text !== 'string' || note.text.length > 20000 || typeof note.updatedAt !== 'string' || !Number.isFinite(Date.parse(note.updatedAt))) throw Error('Invalid annotation.');
  }
  validateLegacy(value.legacyWorkspace);
  return value;
}
function validateLegacy(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.tasks) || value.tasks.length > 10000 || !Array.isArray(value.activity)) throw Error('Invalid workspace archive.');
  const ids = new Set();
  for (const task of value.tasks) {
    if (!task || typeof task.id !== 'string' || !/^[A-Z0-9_-]+$/.test(task.id) || ids.has(task.id) || typeof task.title !== 'string') throw Error('Invalid archived task.');
    ids.add(task.id);
    for (const key of ['owner','evidence','status','priority','due','description']) if (task[key] !== undefined && (typeof task[key] !== 'string' || task[key].length > 20000)) throw Error('Invalid archived notes.');
  }
  return value;
}
try {
  const current = localStorage.getItem(NOTES_KEY);
  if (current) notes = validateNotes(JSON.parse(current));
  else {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) { notes.legacyWorkspace = validateLegacy(JSON.parse(legacy)); notes.updatedAt = new Date().toISOString(); localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
  }
} catch (error) {
  storageWritable = false;
  $('#storage-alert').hidden = false;
  $('#storage-alert').textContent = 'Saved notes could not be loaded or stored. Existing browser data has not been overwritten. Copy session notes before closing. ' + error.message;
}
function saveNotes() {
  notes.updatedAt = new Date().toISOString();
  if (!storageWritable) return false;
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); return true; }
  catch { storageWritable = false; $('#storage-alert').hidden = false; $('#storage-alert').textContent = 'Browser storage is unavailable. Notes remain in this session; copy them before closing.'; return false; }
}
function notify(message) { clearTimeout(toastTimer); $('#message').textContent = message; $('#message').hidden = false; toastTimer = setTimeout(() => $('#message').hidden = true, 6000); }
function badge(value) {
  const style = ['Verified pass','Passed','Resolved'].includes(value) ? 'pass' : ['Confirmed issue','Issue found','Failed'].includes(value) ? 'issue' : value === 'Decision needed' ? 'decision' : ['Partial','Pending verification','Integration gap','Needs re-review','In review'].includes(value) ? 'pending' : 'neutral';
  return '<span class="badge '+style+'">'+escapeHtml(value)+'</span>';
}
const sourceLabel = source => source ? (source.commit ? source.commit.slice(0,12) : 'Commit unavailable') + (source.dirty ? ' + local changes' : ' / clean tracked tree') : 'Not recorded';
const pageFindings = page => REPORT.findings.filter(f => f.pageIds.includes(page.id));
const modulePages = module => REPORT.pages.filter(p => p.moduleId === module.id && !p.removed);
const moduleFindings = module => REPORT.findings.filter(f => f.moduleId === module.id);
const currentStatus = (module, value) => module.reviewState === 'Needs re-review' ? 'Needs re-review' : value;
const teamMatch = finding => !filters.team || finding.accountableTeam === filters.team || finding.supportingTeams.includes(filters.team);
function matchesPage(page, module) {
  if (filters.audience && (module.audience || 'faculty') !== filters.audience) return false;
  if (filters.module && module.id !== filters.module || filters.page && page.id !== filters.page) return false;
  const findings = pageFindings(page);
  if (filters.team && !findings.some(teamMatch)) return false;
  if (!filters.status) return true;
  if ([currentStatus(module,page.functionality), currentStatus(module,page.design)].includes(filters.status)) return true;
  return findings.some(f => f.type === filters.status && teamMatch(f));
}
function matchesFinding(f) { return teamMatch(f) && (!filters.status || f.type === filters.status || ['Partial','Needs re-review','Issue found'].includes(filters.status)); }
function statusOptions() { return ['', 'Confirmed issue','Integration gap','Pending verification','Decision needed','Partial','Needs re-review','Not reviewed','Verified pass']; }
function optionList(values, selected, label) { return '<option value="">'+label+'</option>'+values.filter(Boolean).map(v => '<option value="'+escapeHtml(v.id ?? v)+'"'+((v.id ?? v) === selected?' selected':'')+'>'+escapeHtml(v.name ?? v)+'</option>').join(''); }
function buildFilters() {
  $('#audience-filter').innerHTML = optionList([{id:'student',name:'Student'},{id:'faculty',name:'Faculty / administration'},{id:'shared',name:'Shared account'}],filters.audience,'All audiences');
  const availableModules=REPORT.modules.filter(m=>!filters.audience||(m.audience||'faculty')===filters.audience);
  $('#module-filter').innerHTML = optionList(availableModules, filters.module, 'All modules');
  $('#page-filter').innerHTML = optionList(REPORT.pages.filter(p => !p.removed && availableModules.some(m=>m.id===p.moduleId) && (!filters.module || p.moduleId === filters.module)), filters.page, 'All pages');
  $('#team-filter').innerHTML = optionList(REPORT.teams.map(t => t.name), filters.team, 'All teams');
  $('#status-filter').innerHTML = optionList(statusOptions(), filters.status, 'All statuses');
  $('#filters').hidden = false;
}
function makePrompt(f, module) {
  const mode = f.type === 'Confirmed issue' ? 'Implement the smallest scoped fix after reproducing the confirmed issue.' : f.type === 'Decision needed' ? 'Analyse the options and prepare a decision brief. Do not change business rules without explicit approval.' : 'Investigate and collect evidence first. Do not assume this is a confirmed defect or start unrelated implementation.';
  return ['Module: '+module.name+' / report v'+module.version, 'Finding: '+f.id+' - '+f.title, 'Accountable team: '+f.accountableTeam, 'Review date: '+f.reviewedAt, 'Source baseline: '+sourceLabel(module.observedSource), 'Freshness: '+module.reviewState+'. Verify the current source against the recorded evidence before acting.', '', mode, '', 'Problem / scope: '+f.detail, 'Evidence: '+f.evidence, 'Reproduction / starting point: '+f.reproduction, 'Impact: '+f.impact, 'Recommended solution: '+f.solution, '', 'Acceptance checks:', ...f.acceptance.map(a => '- '+a), '', 'Relevant files:', ...f.sourceFiles.map(p => '- '+p), '', 'Constraints: use React/JavaScript and existing Medsy tokens for application fixes; preserve unrelated behaviour, sample data, identity rules and atomic writes. Do not modify other modules or publish anything without scope authorisation.', 'Verification: run checks appropriate to the change; for a UI fix, inspect mobile/tablet/desktop, keyboard/focus and relevant themes and run npm run build. Report failures and untested paths honestly.', 'After an authorised change: update affected module/page findings and evidence in reports/product-review/data.json; run node scripts/reports/update-reference.mjs --refresh, perform the re-review, record the result with --record-review <module-id> --result <status> --note <evidence summary>, then run --check.', 'Return: actual cause (or unresolved question), files changed if any, acceptance evidence, remaining risks and updated report/module versions.'].join('\n');
}
const promptLabel = type => type === 'Confirmed issue' ? 'Copy fix prompt' : type === 'Decision needed' ? 'Copy analysis prompt' : 'Copy investigation prompt';
function findingMarkup(f, module, exported=false) {
  const promptId = 'prompt-'+f.id;
  return '<details class="finding"'+(exported?' open':'')+'><summary>'+badge(f.type)+'<span><strong>'+escapeHtml(f.title)+'</strong><small>'+escapeHtml(f.id+' / '+f.accountableTeam+' / '+f.priority+' proposed priority')+'</small></span></summary><div class="finding-body"><p><strong>Observed / scope:</strong> '+escapeHtml(f.detail)+'</p><p><strong>Evidence:</strong> '+escapeHtml(f.evidence)+'</p><p><strong>Impact:</strong> '+escapeHtml(f.impact)+'</p><p><strong>Recommended solution:</strong> '+escapeHtml(f.solution)+'</p><h4>Acceptance checks</h4><ul>'+f.acceptance.map(a=>'<li>'+escapeHtml(a)+'</li>').join('')+'</ul><p class="small">Accountable: '+escapeHtml(f.accountableTeam)+' / Owner: '+escapeHtml(f.owner)+(f.supportingTeams.length?' / Support: '+escapeHtml(f.supportingTeams.join(', ')):'')+(f.relatedModules.length?' / Related module: '+escapeHtml(f.relatedModules.join(', ')):'')+'</p><div class="prompt-head"><h4>AI '+(f.type==='Confirmed issue'?'fix':f.type==='Decision needed'?'analysis':'investigation')+' prompt</h4><button class="copy" data-copy="'+promptId+'">'+promptLabel(f.type)+'</button></div><textarea readonly class="prompt" id="'+promptId+'" aria-label="AI prompt for '+escapeHtml(f.id)+'">'+escapeHtml(makePrompt(f,module))+'</textarea><p class="small">Copy only. Review scope before asking an AI to act.</p></div></details>';
}
function archivedTask(id) { return notes.legacyWorkspace.tasks.find(t => t.id === id); }
function notesMarkup(page, exported=false) {
  const note = notes.annotations[page.id], old = archivedTask(page.id);
  const preserved = old ? '<details class="evidence"><summary>Previous workspace record</summary><p>Owner: '+escapeHtml(old.owner||'Unassigned')+' / Work status: '+escapeHtml(old.status||'Not recorded')+' / Priority: '+escapeHtml(old.priority||'Not set')+'</p><p style="white-space:pre-wrap">'+escapeHtml(old.evidence||'No previous notes.')+'</p></details>' : '';
  return '<div class="page-notes"><h4>Personal notes</h4><p class="small">Separate from reviewed evidence and formal report versions.'+(note?' Updated '+escapeHtml(formatDate(note.updatedAt))+'.':'')+'</p>'+(exported?'<p style="white-space:pre-wrap">'+escapeHtml(note?.text||'No personal notes.')+'</p>':'<label>Notes for '+escapeHtml(page.name)+'<textarea id="notes-'+page.id+'" maxlength="20000">'+escapeHtml(note?.text||'')+'</textarea></label><div class="note-actions"><small>Saved in this browser; copy important notes to your own document for backup.</small><button data-save-note="'+page.id+'">Save notes</button></div>')+preserved+'</div>';
}
function pageRows(page,module,exported=false) {
  const findings=pageFindings(page), teams=[...new Set(findings.map(f=>f.accountableTeam))];
  const issue=findings.find(f=>f.type==='Confirmed issue'), next=issue?.title || findings[0]?.title || 'Review requirements, roles and the complete flow first.';
  const show=exported||openPages.has(page.id);
  return '<tr><th scope="row">'+escapeHtml(page.name)+'<span class="page-key">'+escapeHtml(page.id+' / '+page.route)+'</span></th><td>'+badge(currentStatus(module,page.functionality))+'</td><td>'+badge(currentStatus(module,page.design))+'</td><td>'+escapeHtml(teams.length>1?teams.length+' teams':teams[0]||'Unassigned')+'</td><td>'+escapeHtml(next)+'<br>'+(exported?'':'<button class="text-btn" data-page="'+page.id+'" aria-expanded="'+show+'" aria-controls="details-'+page.id+'">'+(show?'Hide details':'Scope, evidence & notes')+'</button>')+'</td></tr><tr id="details-'+page.id+'" class="page-details"'+(!show?' hidden':'')+'><td colspan="5"><div class="page-detail-grid"><div><h4>Flow and review scope</h4><p>'+escapeHtml(page.scope)+'</p></div><div><h4>Roles and evidence</h4><p>'+escapeHtml(page.roles)+'</p><p>'+escapeHtml(page.reviewedAt?'Review recorded '+page.reviewedAt+'. See the module evidence below.':'No functional or design review recorded.')+'</p><p>Page key: <code>'+escapeHtml(page.key)+'</code></p></div></div>'+notesMarkup(page,exported)+'</td></tr>';
}
function evidenceMarkup(module, exported=false) {
  const r=module.review;
  let content='<p>Current observed source: <code>'+escapeHtml(sourceLabel(module.observedSource))+'</code></p><p>Source checked by the report builder: '+escapeHtml(formatDate(module.observedSource?.checkedAt))+'. This is a file-change check, not a new behaviour review.</p>';
  if(module.currentReview)content+='<div class="notice"><strong>Latest recorded review: '+escapeHtml(module.currentReview.result)+'</strong><p>'+escapeHtml(module.currentReview.summary)+'</p><p class="small">'+escapeHtml(formatDate(module.currentReview.at))+' / reviewed source '+escapeHtml(sourceLabel(module.currentReview.source))+'</p></div>';
  if(module.audience==='student')content+='<p><strong>Student navigation inventory:</strong> src/config/appPages.js lists student menu and internal workflow pages. Navigation mode does not grant permissions. Profile Settings and Login remain in the shared Account and navigation module.</p>';
  if(module.checklist?.length)content+='<h4>Proposed end-to-end review checklist</h4><ul>'+module.checklist.map(item=>'<li>'+escapeHtml(item)+'</li>').join('')+'</ul>';
  if(r){content+='<p><strong>Historical review:</strong> '+escapeHtml(r.date)+' / '+escapeHtml(r.scope)+'</p><p>'+r.serviceTests+'/'+r.serviceTests+' service tests and '+r.browserChecks+'/'+r.browserChecks+' browser checks passed in that review. These numbers are retained evidence, not a new test run.</p><p>Reviewed commit: '+escapeHtml(r.sourceCommit||'Not recorded in the original review; original file hashes are retained below.')+'</p><p><code>'+escapeHtml(r.command)+'</code></p><div class="table-wrap"><table><thead><tr><th>Flow stage</th><th>Verification</th><th>Finding / remaining coverage</th></tr></thead><tbody>'+r.flows.map(row=>'<tr>'+row.map(c=>'<td>'+escapeHtml(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><details><summary>Original source fingerprints</summary><ul>'+r.fingerprints.map(s=>'<li>'+escapeHtml(s.path)+'<br><code>'+escapeHtml(s.sha256)+'</code></li>').join('')+'</ul></details>';
    if(r.mobileImage)content+='<figure><img loading="lazy" src="'+r.mobileImage+'" alt="Student Management at 390px: search text appears below its field"><figcaption class="small">Original review capture: mobile batch search field. No application fix performed.</figcaption></figure>';
  }else content+='<p>No review evidence has been collected for this module.</p><p>Trace the main journey: '+escapeHtml(module.journey)+'. Include validation, permissions, empty/error states, alternate paths and downstream handoffs.</p>';
  return '<details class="evidence"'+(exported?' open':'')+'><summary>Flow coverage, evidence and review limits</summary><div class="evidence-content">'+content+'</div></details>';
}
function historyMarkup(module) {return '<details class="evidence"><summary>Module version history</summary><ul class="history-list">'+module.history.map(h=>'<li><strong>v'+escapeHtml(h.version)+'</strong> / '+escapeHtml(formatDate(h.at))+'<br>'+escapeHtml(h.summary)+'</li>').join('')+'</ul></details>';}
function moduleMarkup(module, exported=false) {
  const pages=modulePages(module).filter(p=>exported||matchesPage(p,module));
  const findings=moduleFindings(module).filter(f=>exported||pages.some(p=>f.pageIds.includes(p.id))&&matchesFinding(f));
  const isOpen=exported||openModules.has(module.id)||Object.values(filters).some(Boolean);
  return '<article class="module" id="module-'+module.id+'"><div class="module-head">'+(exported?'<div>':'<button class="module-toggle" data-toggle="'+module.id+'" aria-controls="body-'+module.id+'" aria-expanded="'+isOpen+'"><svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg><span>')+'<span class="module-title"><strong>'+escapeHtml(module.name)+'</strong>'+badge(module.reviewState)+'</span><span class="module-meta">v'+escapeHtml(module.version)+' / '+pages.length+(pages.length!==modulePages(module).length?' of '+modulePages(module).length:'')+' pages / '+moduleFindings(module).length+' findings</span>'+(exported?'</div>':'</span></button><button class="download" data-download="'+module.id+'" aria-label="Download '+escapeHtml(module.name)+' module report">Download report</button>')+'</div><div id="body-'+module.id+'" class="module-body"'+(!isOpen?' hidden':'')+'><div class="module-summary"><p>'+escapeHtml(module.summary)+'</p><p class="small">Updated '+escapeHtml(formatDate(module.updatedAt))+' / '+escapeHtml(sourceLabel(module.observedSource))+'</p>'+(module.reviewState==='Needs re-review'?'<p class="notice warning">Source changed after the recorded baseline. Earlier findings remain historical until the affected paths are reviewed again.</p>':'')+'</div><div class="table-wrap" tabindex="0" role="region" aria-label="'+escapeHtml(module.name)+' pages"><table><thead><tr><th scope="col">Page / flow</th><th scope="col">Functionality</th><th scope="col">Design</th><th scope="col">Accountable team</th><th scope="col">Recommended action</th></tr></thead><tbody>'+pages.map(p=>pageRows(p,module,exported)).join('')+'</tbody></table></div>'+(findings.length?'<h4 class="subsection">Findings and solutions</h4>'+findings.map(f=>findingMarkup(f,module,exported)).join(''):'<p class="small">'+(moduleFindings(module).length?'No findings match the current filters.':'No issues have been established. Review first; absence of findings is not a pass.')+'</p>')+evidenceMarkup(module,exported)+historyMarkup(module)+'<p class="small">'+(module.related.length?'Related modules: '+escapeHtml(module.related.join(', '))+'. ':'')+(exported?'Downloaded snapshot.':'Download includes the complete module, even when filters are active.')+'</p></div></article>';
}
function renderModules() {
  const modules=REPORT.modules.filter(m=>modulePages(m).some(p=>matchesPage(p,m)));
  const student=modules.filter(m=>m.audience==='student'),other=modules.filter(m=>m.audience!=='student');
  $('#modules').innerHTML=modules.length?(student.length?'<div class="audience-heading"><h3>Student modules</h3><p>My Skills, My Logbook, My Assessment and Practice. These are student-facing journeys; Student Management is an administration module. Account and login are shared.</p></div>'+student.map(m=>moduleMarkup(m)).join(''):'')+(other.length?'<div class="audience-heading"><h3>Faculty, administration and shared modules</h3></div>'+other.map(m=>moduleMarkup(m)).join(''):''):'<div class="empty"><h3>No matching pages</h3><p>Change a filter or reset to see all modules.</p></div>';
  const count=modules.reduce((sum,m)=>sum+modulePages(m).filter(p=>matchesPage(p,m)).length,0);
  $('#result-count').textContent=count+' pages / '+modules.length+' modules shown';
}
function renderSummary() {
  const pages=REPORT.pages.filter(p=>!p.removed), reviewed=pages.filter(p=>p.reviewedAt).length;
  const open=REPORT.findings.filter(f=>f.state!=='Resolved'), count=type=>open.filter(f=>f.type===type).length;
  $('#version').innerHTML='<strong>Report v'+escapeHtml(REPORT.version)+'</strong><small>'+escapeHtml(formatDate(REPORT.updatedAt))+'</small><small>'+escapeHtml(sourceLabel(REPORT.source))+'</small>';
  $('#summary').innerHTML='<div class="metrics">'+[[reviewed+'/'+pages.length,'Pages with a recorded review'],[count('Confirmed issue'),'Confirmed issues'],[count('Pending verification'),'Pending checks'],[count('Decision needed'),'Product decisions']].map(([n,label])=>'<div class="metric"><strong>'+n+'</strong><span>'+label+'</span></div>').join('')+'</div><div class="notice"><strong>Start with Student Management.</strong> '+count('Integration gap')+' integration gap remains separate from confirmed UI defects. Review the mobile search finding, complete write-path tests, and confirm business rules before expanding scope.</div><p class="small">'+REPORT.modules.filter(m=>m.reviewState==='Needs re-review').length+' modules need re-review. Historical pass counts do not imply current production readiness. Source check: '+escapeHtml(formatDate(REPORT.source?.checkedAt))+'.</p>';
}
function renderTeams() {
  $('#teams').innerHTML='<div class="table-wrap" tabindex="0" role="region" aria-label="Team responsibilities"><table><thead><tr><th>Accountable team</th><th>Responsibility</th><th>Open findings</th><th>Next handoff</th></tr></thead><tbody>'+REPORT.teams.map(t=>{const f=REPORT.findings.filter(f=>f.accountableTeam===t.name&&f.state!=='Resolved');return '<tr><th><button class="team-select" data-team="'+escapeHtml(t.name)+'">'+escapeHtml(t.name)+'</button></th><td>'+escapeHtml(t.focus)+'</td><td class="mono">'+f.length+'</td><td>'+escapeHtml(f[0]?.solution||'No assigned findings yet. Review the module before assigning work.')+'</td></tr>'}).join('')+'</tbody></table></div><p class="small">Each finding has one accountable team. Supporting teams appear inside its details. Team totals are global and do not change with page filters.</p>';
}
function renderHistory() {
  $('#history').innerHTML='<div class="history-grid"><div><h3>Report history</h3><ul class="history-list">'+REPORT.history.map(h=>'<li><strong>v'+escapeHtml(h.version)+'</strong> / '+escapeHtml(formatDate(h.at))+'<br>'+escapeHtml(h.summary)+'</li>').join('')+'</ul></div><div><h3>Keep the report current</h3><p class="small">'+escapeHtml(REPORT.maintenance.description)+'</p><details><summary>Maintenance commands and limits</summary><code>node scripts/reports/update-reference.mjs --refresh</code><code>node scripts/reports/update-reference.mjs --check</code><code>node scripts/reports/update-reference.mjs --watch</code><p class="small">Run refresh after code changes. Watch checks while that process is running. Neither executes the application audit. Future coding sessions follow AGENTS.md; changes outside those sessions need a refresh/watch trigger.</p><p class="small">Minor versions track report updates. Major versions indicate substantial scope or structure changes. Opening, filtering, downloading and personal notes do not change formal versions.</p></details></div></div>';
}
function renderLegacy() { $('#legacy-notes').innerHTML=notes.legacyWorkspace.tasks.map(t=>'<details><summary>'+escapeHtml(t.id+' / '+t.title)+'</summary><p>Owner: '+escapeHtml(t.owner||'Unassigned')+' / Status: '+escapeHtml(t.status||'Not recorded')+'</p><p style="white-space:pre-wrap">'+escapeHtml(t.evidence||'No saved evidence notes.')+'</p></details>').join(''); }
function downloadFile(filename,content,type) {const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copyPrompt(button) {
  const area=document.getElementById(button.dataset.copy);
  try { if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(area.value);notify('Prompt copied. Review its scope before execution.'); }
  catch { area.focus();area.select();notify('Clipboard access is unavailable. The prompt is selected; copy it with your keyboard.'); }
}
function exportModule() { notify("Open the local planning service to download Word or PDF."); }
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.toggle){const id=button.dataset.toggle;openModules.has(id)?openModules.delete(id):openModules.add(id);const body=$('#body-'+id);body.hidden=!body.hidden;button.setAttribute('aria-expanded',String(!body.hidden));}
  if(button.dataset.page){const id=button.dataset.page;openPages.has(id)?openPages.delete(id):openPages.add(id);$('#details-'+id).hidden=!openPages.has(id);button.setAttribute('aria-expanded',String(openPages.has(id)));button.textContent=openPages.has(id)?'Hide details':'Scope, evidence & notes';}
  if(button.dataset.copy)void copyPrompt(button);
  if(button.dataset.download)exportModule(button.dataset.download);
  if(button.dataset.team){Object.assign(filters,{audience:'',module:'',page:'',team:button.dataset.team,status:''});buildFilters();renderModules();$('#team-filter').focus();$('#module-reports').scrollIntoView();}
  if(button.dataset.saveNote){const id=button.dataset.saveNote;notes.annotations[id]={text:$('#notes-'+id).value,updatedAt:new Date().toISOString()};notify(saveNotes()?'Notes saved in this browser. Report version unchanged.':'Notes kept for this session. Copy your notes before closing.');}
});
for(const key of Object.keys(filters))$('#'+key+'-filter').addEventListener('change',event=>{filters[key]=event.target.value;if(key==='module'||key==='audience')filters.page='';if(key==='audience')filters.module='';buildFilters();renderModules();});
$('#reset').onclick=()=>{Object.keys(filters).forEach(k=>filters[k]='');buildFilters();renderModules();};
$('#import-notes').onclick=()=>$('#notes-file').click();
$('#notes-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Backup exceeds 10 MB.');const parsed=JSON.parse(await file.text());const incoming=parsed.format==='medsy-review-notes'?validateNotes(parsed):{format:'medsy-review-notes',version:1,annotations:{},legacyWorkspace:validateLegacy(parsed),updatedAt:new Date().toISOString()};if(!confirm('Merge imported notes and archived assignments? Matching imported records replace the local note or assignment. Copy important existing notes before replacing them.'))return;notes.annotations={...notes.annotations,...incoming.annotations};const merged=new Map(notes.legacyWorkspace.tasks.map(t=>[t.id,t]));incoming.legacyWorkspace.tasks.forEach(t=>merged.set(t.id,t));notes.legacyWorkspace={...incoming.legacyWorkspace,tasks:[...merged.values()]};const saved=saveNotes();renderModules();renderLegacy();notify(saved?'Notes imported. Audit evidence and report versions were not changed.':'Notes imported for this session. Copy them to keep them.');}catch(error){notify('Import failed: '+error.message)}finally{event.target.value=''}};
renderSummary();buildFilters();renderModules();renderTeams();renderHistory();renderLegacy();
$('#recommendations').innerHTML='<ol class="steps"><li><strong>Address the confirmed mobile search finding.</strong>Reproduce it against the current source, review the scoped fix prompt, then authorise implementation and verify acceptance checks.</li><li><strong>Complete Student Management verification.</strong>Exercise save/import, progression, correction and downstream faculty effects in isolated data. Keep unsupported results marked pending.</li><li><strong>Resolve product and integration decisions.</strong>Confirm business rules, production API boundaries and recovery ownership before expanding scope or budget.</li><li><strong>Review the next module.</strong>Start from its pages and full journey, then add evidence-backed findings and versioned handoffs for the responsible teams.</li></ol>';
