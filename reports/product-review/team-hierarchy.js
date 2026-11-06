function specialistSelection(draft={}) {
  return '<fieldset class="specialist-selection"><legend>AI specialist scope</legend><p class="small">10 roles cover product, design, engineering, QA and leadership.</p><label class="check"><input type="checkbox" name="include-ai" '+(draft.includeAI?'checked':'')+'>Include AI / ML Team Lead for AI functionality</label></fieldset>';
}
function specialistConfirmation(request) {
  return '<details class="specialist-selection"><summary>'+rolesForRequest(request).length+' AI stages · View participating roles</summary><ol>'+rolesForRequest(request).map(role=>'<li>'+escapeHtml(role.name)+'</li>').join('')+'</ol></details>';
}
function renderTeamHierarchy() {
  const host=$('#teams');if(!host)return;
  const moduleId=host.querySelector('#role-module')?.value||REPORT.modules[0]?.id;
  const module=REPORT.modules.find(m=>m.id===moduleId);
  const run=workspace.runs.filter(r=>r.moduleId===moduleId).at(-1);
  const participants=run?.roles||[];
  const roleState=role=>{
    const saved=module.codexReview?.roles?.find(r=>r.roleId===role.id);if(saved)return codexCurrent(module,module.codexReview)?saved.status:'Needs re-review';
    if(!run||!run.hierarchyVersion||!participants.some(r=>r.id===role.id))return 'Not assigned';
    if(run.fingerprint!==workspace.modules[moduleId]?.fingerprint)return 'Outdated';
    const step=run.steps.find(s=>s.roleId===role.id);
    if(step?.result?.applicability?.status==='Not applicable')return 'Not applicable';
    if(step?.status==='Complete')return run.status==='Complete'?(step.result?.questions?.trim()?'Needs clarification':'Reviewed'):'Ready for synthesis';
    if(step?.status==='Running')return 'Reviewing';
    if(['Failed','Cancelled','Interrupted'].includes(run.status))return step?.status||'Not run';
    return 'Pending';
  };
  $('#team-report h2').textContent='Team roles & functional ownership';
  $('#team-report .section-heading p').textContent='AI recommendations follow the leadership hierarchy. You approve scope, budget and implementation.';
  host.innerHTML='<div class="hierarchy-overview"><strong>'+uiIcon('shield')+' Leadership</strong><span>'+uiIcon('users')+' Product & Strategy</span><span>'+uiIcon('layers')+' Engineering & Delivery</span><small>Hierarchy v'+hierarchyVersion+'</small></div><div class="role-toolbar"><label for="role-module">Module</label><select id="role-module">'+REPORT.modules.map(m=>'<option value="'+m.id+'" '+(m.id===moduleId?'selected':'')+'>'+escapeHtml(m.name)+'</option>').join('')+'</select><span class="small">'+(run?'Latest '+(run.kind==='review'?'review':'plan')+' · '+escapeHtml(run.status)+(run.hierarchyVersion?' · Hierarchy v'+escapeHtml(run.hierarchyVersion):' · Legacy workflow'):'No AI run recorded')+'</span></div><div class="role-table-wrap" tabindex="0" role="region" aria-label="AI roles and ownership"><table class="role-table"><thead><tr><th>AI role</th><th>Reports to</th><th>Ownership</th><th>Module assignment</th><th>Review status</th><th>Actions</th></tr></thead><tbody>'+['Leadership','Product & Strategy','Engineering & Delivery'].map(group=>'<tr class="role-group"><th colspan="6">'+escapeHtml(group)+'</th></tr>'+teamRoles.filter(r=>r.group===group).map(role=>'<tr><th><span class="small">Level '+role.level+'</span><br>'+escapeHtml(role.name)+'</th><td>'+escapeHtml(teamRoles.find(r=>r.id===role.parent)?.name||'You')+'</td><td>'+escapeHtml(role.ownership)+'</td><td>'+escapeHtml(participants.some(r=>r.id===role.id)?module.name:role.optional?'Optional · AI modules':'Baseline role')+'</td><td>'+badge(roleState(role))+'</td><td><button data-role-details="'+role.id+'" aria-expanded="false" aria-controls="role-detail-'+role.id+'">Details</button></td></tr><tr id="role-detail-'+role.id+'" hidden><td colspan="6"><div class="role-detail"><p><strong>Inputs:</strong> Module pages, context, optional documents, recorded evidence and earlier specialist outputs.</p><p><strong>Expected output:</strong> '+escapeHtml(role.output)+'</p><p><strong>Handoff:</strong> '+escapeHtml(teamRoles.find(r=>r.id===role.parent)?.name||'Your decision')+'. Unresolved questions remain explicit.</p></div></td></tr>').join('')).join('')+'</tbody></table></div>';
  host.querySelector('#role-module').onchange=renderTeamHierarchy;
  host.querySelectorAll('[data-role-details]').forEach(button=>button.onclick=()=>{const detail=document.getElementById(button.getAttribute('aria-controls'));detail.hidden=!detail.hidden;button.setAttribute('aria-expanded',String(!detail.hidden));button.textContent=detail.hidden?'Details':'Close';});
}
