/* Local planning controls extend the existing evidence report without mutating app data. */
let workspace = { modules: {}, drafts: {}, runs: [], plans: [], ready: false };
let connected = false, searchText = '', lifecycleFilter = '', selectedModule = null, pendingRequest = null, attentionOnly = false;
const lifecycle = ['Not reviewed', 'Pending AI review', 'AI reviewing', 'Needs clarification', 'Plan ready', 'Awaiting approval', 'Approved for implementation', 'In progress', 'Pending verification', 'Changes required', 'Complete', 'Needs re-review', 'Blocked'];
const nextStates = { 'Not reviewed': ['Blocked'], 'Needs clarification': ['Blocked'], 'Plan ready': ['Awaiting approval', 'Blocked'], 'Awaiting approval': ['Approved for implementation', 'Changes required', 'Blocked'], 'Approved for implementation': ['In progress', 'Changes required', 'Blocked'], 'In progress': ['Pending verification', 'Blocked'], 'Pending verification': ['Complete', 'Changes required', 'Blocked'], 'Changes required': ['In progress', 'Blocked'], 'Complete': ['Needs re-review'], 'Needs re-review': ['Blocked'], 'Blocked': [] };
const statusFor = m => workspace.modules[m.id]?.status || (m.reviewState === 'Needs re-review' ? 'Needs re-review' : 'Not reviewed');
const latestPlan = id => workspace.plans.filter(p => p.moduleId === id).at(-1);
const colour = status => status === 'Complete' ? 'pass' : ['Blocked', 'Changes required'].includes(status) ? 'issue' : ['AI reviewing', 'Plan ready', 'Approved for implementation'].includes(status) ? 'decision' : status === 'Not reviewed' ? 'neutral' : 'pending';

async function api(url, body) {
  const response = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await response.json(); if (!response.ok) throw Error(data.error || 'Request failed.'); return data;
}
let workspaceRefreshing=false;
async function refreshWorkspace(silent = false) {
  if(workspaceRefreshing)return;
  workspaceRefreshing=true;
  const before=JSON.stringify([connected,workspace.modules,workspace.runs,workspace.plans]);
  try {
    if (location.protocol === 'file:') throw Error('Open the local service to use planning controls.');
    workspace = await api('/api/bootstrap'); connected = true;
    $('#connection').textContent = workspace.ready ? 'AI connected · ' + workspace.model : 'Local storage connected · AI not configured';
    $('#connection').className = 'notice ' + (workspace.ready ? '' : 'warning');
    await syncLiveReport(workspace.reportVersion);
  } catch (error) {
    connected = false; $('#connection').textContent = 'Local service unavailable. Run node scripts/reports/planning-server.mjs and open http://127.0.0.1:6190. Your existing notes remain in this browser.';
    if (!silent) notify(error.message);
  }
  const connectionLabel=document.querySelector('.connection-trigger span');
  if(connectionLabel)connectionLabel.textContent=connected?(workspace.ready?'AI connected':'AI not configured'):'Service offline';
  if(before!==JSON.stringify([connected,workspace.modules,workspace.runs,workspace.plans])||!$('#modules .workspace-table'))renderModules();
  renderPlanningSummary();
  if(!document.querySelector('#teams button[aria-expanded="true"]'))renderTeamHierarchy();
  workspaceRefreshing=false;
}
function renderPlanningSummary() {
  $('#summary').innerHTML='<div class="metrics">'+[[REPORT.modules.length,'Modules in scope'],[REPORT.pages.filter(p=>!p.removed).length,'Pages inventoried'],[workspace.runs.filter(r=>r.status==='Running').length,'AI reviews running'],[REPORT.modules.filter(m=>statusFor(m)==='Complete').length,'Modules complete']].map(([count,label])=>'<div class="metric"><strong class="mono">'+count+'</strong><span>'+label+'</span></div>').join('')+'</div>';
}
function runMarkup(module) {
  const run = workspace.runs.filter(r => r.moduleId === module.id).at(-1);
  if (!run) return '<p class="small">No AI run recorded. Start a plan to request the specialist reviews and leadership synthesis.</p>';
  return '<div class="run"><strong>Latest run: '+escapeHtml(run.status)+'</strong><p class="small">'+escapeHtml(formatDate(run.at))+' · '+run.steps.filter(s=>s.status==='Complete').length+' of '+(run.roles?.length||7)+' stages finished</p><ol>'+run.steps.map(s=>'<li><strong>'+escapeHtml(s.worker)+'</strong> '+badge(s.status)+'<small>'+escapeHtml(formatDate(s.startedAt))+'</small></li>').join('')+'</ol>'+(run.error?'<p role="alert" class="notice warning">'+escapeHtml(run.error)+'</p>':'')+(['Running','Queued'].includes(run.status)?'<button data-cancel-run="'+module.id+'">Cancel AI run</button>':'')+'</div>';
}
function planMarkup(module) {
  const plans = workspace.plans.filter(p=>p.moduleId===module.id);
  return '<h3>Plan versions</h3>'+(plans.length?plans.slice().reverse().map((p,index)=>'<details class="plan-version" '+(index===0?'open':'')+'><summary>Plan v'+escapeHtml(p.version)+' · '+escapeHtml(formatDate(p.at))+' · '+(p.outdated?'Outdated':workspace.modules[module.id]?.approvedPlanId===p.id?'Approved baseline':'Draft proposal')+'</summary><div class="plan-actions"><button data-plan-download="'+p.id+'" data-module="'+module.id+'">Download Word / PDF</button><button data-copy="prompt-'+p.id+'">Copy implementation prompt</button></div>'+Object.entries(p.result).filter(([key])=>key!=='implementationPrompt').map(([key,value])=>'<h4>'+escapeHtml(key.replace(/([A-Z])/g,' $1'))+'</h4><p class="plan-text">'+escapeHtml(value||'None recorded.')+'</p>').join('')+'<label>AI implementation prompt<textarea readonly id="prompt-'+p.id+'">'+escapeHtml(p.result.implementationPrompt)+'</textarea></label>'+(plans.length>1&&index===0?'<details><summary>Compare with previous version</summary>'+Object.keys(p.result).filter(key=>p.result[key]!==plans.at(-2).result[key]).map(key=>'<h4>'+escapeHtml(key)+'</h4><p class="small">Previous</p><p class="plan-text">'+escapeHtml(plans.at(-2).result[key])+'</p><p class="small">Current</p><p class="plan-text">'+escapeHtml(p.result[key])+'</p>').join('')+'</details>':'')+'</details>').join(''):'<p class="small">No generated plans yet. Historical audit evidence is available below.</p>');
}
renderModules = function () {
  const modules = REPORT.modules.filter(m=>(!attentionOnly||moduleFindings(m).some(f=>f.state!=='Resolved')||['Needs re-review','Blocked','Changes required','Needs clarification'].includes(statusFor(m)))&&(!filters.audience||(m.audience||'faculty')===filters.audience)&&(!filters.module||m.id===filters.module)&&(!lifecycleFilter||statusFor(m)===lifecycleFilter)&&(!searchText||[m.name,...modulePages(m).map(p=>p.name)].join(' ').toLowerCase().includes(searchText))&&modulePages(m).some(p=>matchesPage(p,m)));
  $('#result-count').textContent = modules.length+' modules / '+modules.reduce((sum,m)=>sum+modulePages(m).length,0)+' pages';
  $('#modules').innerHTML = '<div class="table-wrap workspace-table"><table><thead><tr><th>Module</th><th>Role review</th><th>Functionality</th><th>Design</th><th class="number-cell">Findings</th><th>Dependencies</th><th>Version</th><th>Actions</th><th>Fix bugs</th><th aria-label="Download"></th></tr></thead><tbody>'+modules.map(m=>{
    const expanded=openModules.has(m.id), record=workspace.modules[m.id], reviewSummary=moduleReviewSummary(m);
    const detail=expanded?modulePagesAndFlows(m):'';
    return '<tr class="module-row '+(expanded?'is-expanded':'')+'"><th><button data-expand="'+m.id+'" aria-expanded="'+expanded+'" aria-controls="module-detail-'+m.id+'">'+uiIcon('chevron')+uiIcon(m.audience==='student'?'student':m.audience==='shared'?'users':'layers')+'<span class="module-name"><strong>'+escapeHtml(m.name)+'</strong><small>'+modulePages(m).length+' '+(modulePages(m).length===1?'page':'pages')+' · '+escapeHtml(m.audience==='student'?'Student':m.audience==='shared'?'Shared':'Faculty / admin')+'</small></span></button></th><td>'+reviewProgressCell(m,reviewSummary)+'</td><td>'+friendlyReviewBadge(reviewSummary.functionality)+'</td><td>'+friendlyReviewBadge(reviewSummary.design)+'</td><td>'+findingsSummaryCell(m)+'</td><td><button class="dependency-link" data-codex-dependencies="'+m.id+'" aria-label="View dependencies for '+escapeHtml(m.name)+'">'+codexDependencies(m).length+' '+(codexDependencies(m).length===1?'module':'modules')+uiIcon('chevron')+'</button></td><td>'+moduleVersionCell(m)+'</td><td><div class="row-actions"><button data-codex-review="'+m.id+'" aria-label="Copy review prompt for '+escapeHtml(m.name)+'">'+uiIcon('clipboard')+'<span>Copy prompt</span></button></div></td><td><button data-codex-bugs="'+m.id+'">View issues</button></td><td class="download-cell"><button class="icon-button" data-download="'+m.id+'" aria-label="Download '+escapeHtml(m.name)+' report" title="Download Word or PDF" '+(!connected?'disabled':'')+'>'+uiIcon('download')+'</button></td></tr>'+(expanded?'<tr class="expanded-row" id="module-detail-'+m.id+'"><td colspan="10"><div class="expanded-content">'+moduleAuditNotice(m)+codexRoleGrid(m)+'<div class="section-heading"><h3>'+uiIcon('workflow')+' Module detail</h3><button data-lifecycle="'+m.id+'" '+(!connected||!(nextStates[statusFor(m)]||[]).length?'disabled':'')+'>'+uiIcon('workflow')+'Update lifecycle</button></div><details class="audit-details" open><summary>'+uiIcon('clipboard')+' Pages &amp; flows</summary>'+detail+'</details><details class="planning-detail" '+(latestPlan(m.id)?'open':'')+'><summary>'+uiIcon('sparkles')+' AI plans and run history</summary>'+runMarkup(m)+planMarkup(m)+'</details><details class="lifecycle-history"><summary>'+uiIcon('history')+' Lifecycle history</summary><ol>'+(record?.history||[]).map(h=>'<li>'+escapeHtml(h.status)+' · '+escapeHtml(formatDate(h.at))+'<p>'+escapeHtml(h.note)+'</p></li>').join('')+'</ol>'+((record?.history||[]).length?'':'<p class="small">No lifecycle changes recorded.</p>')+'</details></div></td></tr>':'');
  }).join('')+'</tbody></table></div>'+(modules.length?'':'<p class="empty">No modules match these filters.</p>');
  const columnLabels=['Module','Role review','Functionality','Design','Findings','Dependencies','Version','Actions','Fix bugs',''];
  document.querySelectorAll('.module-row').forEach(row=>[...row.children].forEach((cell,index)=>{cell.dataset.column=columnLabels[index];}));
};
function dialog(title, body, buttons='') {
  const node=document.createElement('dialog');node.className='planner-dialog';
  const titleId='dialog-title-'+crypto.randomUUID();node.setAttribute('aria-labelledby',titleId);
  node.innerHTML='<div class="dialog-heading"><div>'+uiIcon(title.startsWith('Plan')?'sparkles':title.startsWith('Download')?'download':'shield')+'<h2 id="'+titleId+'">'+escapeHtml(title)+'</h2></div><button class="icon-button" data-close aria-label="Close dialog">'+uiIcon('close')+'</button></div><div class="dialog-body">'+body+'<p class="dialog-error" role="alert"></p></div><div class="dialog-actions">'+buttons+'</div>';
  decorateDialog(node);
  const previous=document.activeElement;
  node.querySelector('[data-close]').onclick=()=>node.close();node.addEventListener('close',()=>{node.remove();if(previous?.isConnected)previous.focus();});document.body.append(node);node.showModal();node.querySelector('#request-type, #confirm-no, #word-download')?.focus();return node;
}
async function fileData(file) {
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  const ext=file.name.split('.').pop().toLowerCase();const mime={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};
  return {name:file.name,type:mime[ext]||file.type,data:btoa(binary)};
}
function openPlanner(moduleId, draftOverride=null) {
  selectedModule=REPORT.modules.find(m=>m.id===moduleId);const draft=draftOverride||workspace.drafts[moduleId];
  const initial=draft?.context||('Review '+selectedModule.name+' end to end. '+moduleFindings(selectedModule).map(f=>f.title+': '+f.solution).join('\n'));
  let attachments=draft?.attachments||[];
  const node=dialog('Plan · '+selectedModule.name,'<p>Specialists prepare a plan, followed by product, technical and executive review. Application code is never changed.</p><label>Request type<select id="request-type">'+['Review existing flow','Fix issue','Suggest enhancements','Plan new feature'].map(t=>'<option '+(draft?.requestType===t?'selected':'')+'>'+t+'</option>').join('')+'</select></label><fieldset><legend>Pages · leave unselected for the entire module</legend>'+modulePages(selectedModule).map(p=>'<label class="check"><input type="checkbox" name="scope" value="'+p.id+'" '+(draft?.pageIds.includes(p.id)?'checked':'')+'>'+escapeHtml(p.name)+'</label>').join('')+'</fieldset><label>Context <textarea id="plan-context" minlength="20" maxlength="16000" required>'+escapeHtml(initial)+'</textarea></label><label>Constraints / clarification answers<textarea id="plan-constraints" maxlength="8000">'+escapeHtml(draft?.constraints||'')+'</textarea></label><label>Optional documents<input id="plan-files" type="file" multiple accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"></label><p class="small">Up to 3 files, 5 MB each, 10 MB total. Files and source excerpts are sent to OpenAI only after Yes. PDF/image support depends on your configured model. Documents are not yet analysed.</p><div id="attachment-list"></div>','<button id="save-draft">Save draft</button><button id="cancel-plan">Cancel</button><button class="copy" id="just-plan">Just plan</button>');
  node.querySelector('.dialog-body').insertAdjacentHTML('afterbegin',specialistSelection(draft));
  const list=()=>{node.querySelector('#attachment-list').innerHTML=attachments.map((f,i)=>'<p>'+escapeHtml(f.name)+' <button data-remove-file="'+i+'">Remove</button></p>').join('');};list();
  node.addEventListener('click',e=>{if(e.target.dataset.removeFile!==undefined){attachments.splice(Number(e.target.dataset.removeFile),1);list();}});
  let uploading=false;
  node.querySelector('#plan-files').onchange=async e=>{
    uploading=true;node.querySelector('#just-plan').disabled=true;
    try{const files=[...e.target.files];if(files.length+attachments.length>3||files.some(f=>f.size>5*1024*1024)||files.reduce((n,f)=>n+f.size,attachments.reduce((n,f)=>n+f.data.length*.75,0))>10*1024*1024)throw Error('Use up to 3 files, 5 MB each and 10 MB total.');attachments.push(...await Promise.all(files.map(fileData)));list();}catch(error){node.querySelector('.dialog-error').textContent=error.message;}finally{uploading=false;node.querySelector('#just-plan').disabled=false;e.target.value='';}
  };
  const request=()=>({includeAI:node.querySelector('[name=include-ai]').checked,moduleId,requestType:node.querySelector('#request-type').value,context:node.querySelector('#plan-context').value,constraints:node.querySelector('#plan-constraints').value,pageIds:[...node.querySelectorAll('[name=scope]:checked')].map(n=>n.value),attachments});
  node.querySelector('#cancel-plan').onclick=()=>node.close();
  node.querySelector('#save-draft').onclick=async()=>{try{if(uploading)throw Error('Wait for document loading.');await api('/api/drafts',request());await refreshWorkspace(true);notify('Draft saved locally, including optional documents.');}catch(error){node.querySelector('.dialog-error').textContent=error.message;}};
  node.querySelector('#just-plan').onclick=()=>{
    const data=request();if(data.context.trim().length<20){node.querySelector('.dialog-error').textContent='Add at least 20 characters of context.';return;}
    pendingRequest={...data,confirmed:true,idempotencyKey:crypto.randomUUID(),fingerprint:workspace.modules[moduleId].fingerprint};
    const confirmNode=dialog('Create this implementation plan?','<p><strong>'+escapeHtml(selectedModule.name)+'</strong> · '+escapeHtml(data.requestType)+'</p><p>Scope: '+(data.pageIds.length?data.pageIds.length+' selected pages':'Entire module')+'</p><p>Attachments: '+escapeHtml(attachments.map(f=>f.name).join(', ')||'None')+'</p><p>This sends context, bounded source excerpts and attachments to the configured AI service. The selected AI stages may incur API charges. Plan only — no application changes.</p>'+(!workspace.ready?'<p class="notice warning">AI is not configured. Save your draft and configure the local service before starting.</p>':''),'<button id="confirm-no">No, return</button><button class="copy" id="confirm-yes" '+(!workspace.ready?'disabled':'')+'>Yes, create plan</button>');
    confirmNode.querySelector('.dialog-body').insertAdjacentHTML('afterbegin',specialistConfirmation(data));
    confirmNode.querySelector('#confirm-no').onclick=()=>confirmNode.close();
    confirmNode.querySelector('#confirm-yes').onclick=async e=>{const button=e.currentTarget;button.disabled=true;try{await api('/api/runs',pendingRequest);confirmNode.close();node.close();openModules.add(moduleId);await refreshWorkspace();notify('AI planning started. No code will be changed.');}catch(error){confirmNode.querySelector('.dialog-error').textContent=error.message;button.disabled=false;}};
  };
}
function openDownload(moduleId, planId='', reviewId='') {
  const node=dialog('Download module document','<p>Includes every page, finding, source reference and version in this module, regardless of active filters.</p>','<button id="word-download">Download Word (.docx)</button><button id="pdf-download">Save PDF</button>');
  const link=format=>'/api/export?module='+encodeURIComponent(moduleId)+'&format='+format+(planId?'&plan='+encodeURIComponent(planId):'')+(reviewId?'&review='+encodeURIComponent(reviewId):'');
  for(const [selector,format] of [['#word-download','docx'],['#pdf-download','pdf']])node.querySelector(selector).onclick=async e=>{const button=e.currentTarget;button.disabled=true;button.textContent='Preparing '+format.toUpperCase()+'…';try{const response=await fetch(link(format));if(!response.ok){const error=await response.json();throw Error(error.error);}downloadFile(moduleId+(planId?'-plan':'-report')+'.'+format,await response.blob(),response.headers.get('content-type'));node.close();}catch(error){node.querySelector('.dialog-error').textContent=error.message;button.disabled=false;button.textContent='Retry '+format.toUpperCase();}};
}
exportModule=openDownload;
document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.expand){openModules.has(b.dataset.expand)?openModules.delete(b.dataset.expand):openModules.add(b.dataset.expand);renderModules();}
  if(b.dataset.plan)openPlanner(b.dataset.plan);
  if(b.dataset.planDownload)openDownload(b.dataset.module,b.dataset.planDownload);
  if(b.dataset.cancelRun){try{await api('/api/cancel',{moduleId:b.dataset.cancelRun});await refreshWorkspace();}catch(error){notify(error.message);}}
  if(b.dataset.lifecycle){
    const moduleId=b.dataset.lifecycle,record=workspace.modules[moduleId],plan=latestPlan(moduleId);
    const node=dialog('Update module lifecycle','<p>Current: '+escapeHtml(record.status)+'. This records tracking only; it never implements code.</p><label>Next status<select id="next-status">'+(nextStates[record.status]||[]).map(s=>'<option>'+s+'</option>').join('')+'</select></label><p>Plan version: '+escapeHtml(plan?.version||'None')+'</p><label>Reason / verification evidence<textarea id="transition-note" placeholder="Record actual checks, results, source version and remaining limitations."></textarea></label>','<button id="save-transition">Save status</button>');
    node.querySelector('#save-transition').onclick=async()=>{try{await api('/api/transition',{moduleId,status:node.querySelector('#next-status').value,note:node.querySelector('#transition-note').value,revision:record.revision,planId:plan?.id});node.close();await refreshWorkspace();}catch(error){node.querySelector('.dialog-error').textContent=error.message;}};
  }
});

openModules.clear();
const tabs=document.createElement('nav');tabs.className='module-tabs';tabs.setAttribute('aria-label','Module view');tabs.innerHTML=[['','All modules']].map(([value,label],i)=>'<button data-audience="'+value+'" aria-pressed="'+(i===0)+'">'+label+'</button>').join('');
$('#filters').before(tabs);tabs.onclick=e=>{const b=e.target.closest('button');if(!b)return;attentionOnly=b.dataset.audience==='attention';Object.assign(filters,{audience:attentionOnly?'':b.dataset.audience,module:'',page:'',team:'',status:''});tabs.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));buildFilters();renderModules();};
$('#reset').onclick=()=>{Object.keys(filters).forEach(k=>filters[k]='');attentionOnly=false;searchText='';lifecycleFilter='';$('#module-search').value='';$('#lifecycle-filter').value='';tabs.querySelectorAll('button').forEach((n,i)=>n.setAttribute('aria-pressed',String(i===0)));buildFilters();renderModules();};
renderTeamHierarchy();
$('#module-reports h2').textContent='Modules';
$('#module-reports .section-heading p').textContent='Expand a row to review pages and findings.';
const toolbar=document.createElement('div');toolbar.className='workspace-toolbar';toolbar.innerHTML='<label><input id="module-search" type="search" aria-label="Search modules or pages" placeholder="Search modules or pages"></label><label><select id="lifecycle-filter" aria-label="Module lifecycle"><option value="">All statuses</option>'+lifecycle.map(s=>'<option>'+s+'</option>').join('')+'</select></label><button id="refresh-workspace">Refresh source / runs</button>';
$('#modules').before(toolbar);
const advanced=document.createElement('details');advanced.className='advanced-filters';advanced.innerHTML='<summary>More filters and audit colour key</summary>';toolbar.before(advanced);advanced.append($('#filters'),$('#module-reports .legend'));
$('#module-search').oninput=e=>{searchText=e.target.value.trim().toLowerCase();renderModules();};$('#lifecycle-filter').onchange=e=>{lifecycleFilter=e.target.value;renderModules();};$('#refresh-workspace').onclick=()=>refreshWorkspace();
const connection=document.createElement('div');connection.id='connection';connection.className='notice';$('#summary').before(connection);
document.querySelector('h1').textContent='Project Management';document.querySelector('.lead').textContent='Review modules, plan changes and track verification.';
initialiseCompactWorkspace();
void refreshWorkspace(true);
setInterval(()=>{if(!document.hidden&&!document.activeElement?.matches('textarea, input:not([type=checkbox]),select'))void refreshWorkspace(true);},5000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshWorkspace(true);});
