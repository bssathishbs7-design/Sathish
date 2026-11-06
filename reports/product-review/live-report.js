/** Fetch saved evidence without navigating away or discarding an active form. */
async function syncLiveReport(version) {
  if(version===REPORT.version)return false;
  const dialogs=[...document.querySelectorAll('dialog[open]')];
  // Approval and editable forms retain their exact snapshot until closed.
  if(dialogs.some(node=>!node.matches('.codex-bugs-dialog')))return false;
  const response=await fetch('/business-analyst-reference.html',{cache:'no-store'});
  if(!response.ok)throw Error('Could not retrieve the updated report. Will retry automatically.');
  const documentCopy=new DOMParser().parseFromString(await response.text(),'text/html');
  const incoming=JSON.parse(documentCopy.querySelector('#report-data').textContent);
  if(!Array.isArray(incoming.modules)||!Array.isArray(incoming.findings)||!Array.isArray(incoming.pages))throw Error('Invalid report update. Keeping the current view.');
  if(incoming.version===REPORT.version)return false;
  const popup=dialogs[0];
  const popupState=popup?{
    moduleId:popup.dataset.moduleId,
    selected:[...popup.querySelectorAll('[name=codex-issue]:checked')].map(n=>n.value),
    expanded:[...popup.querySelectorAll('[data-bug-evidence][aria-expanded=true]')].map(n=>n.dataset.bugEvidence),
    sort:[...popup.querySelectorAll('thead th')].map(n=>n.getAttribute('aria-sort')),
    scroll:popup.querySelector('.table-wrap')?.scrollTop||0
  }:null;
  const draftNotes=[...document.querySelectorAll('#modules textarea[id]')].map(n=>[n.id,n.value]);
  const scroll=document.querySelector('.workspace-table')?.scrollTop||0;
  Object.assign(REPORT,incoming);
  renderModules();renderHistory();
  $('#version').innerHTML='<strong>Report v'+escapeHtml(REPORT.version)+'</strong><small>'+escapeHtml(formatDate(REPORT.updatedAt))+'</small>';
  for(const [id,value] of draftNotes){const field=document.getElementById(id);if(field)field.value=value;}
  const table=document.querySelector('.workspace-table');if(table)table.scrollTop=scroll;
  if(popupState){
    popup.close();
    if(REPORT.modules.some(m=>m.id===popupState.moduleId)){
      openCodexBugs(popupState.moduleId);
      const next=document.querySelector('.codex-bugs-dialog[open]');
      for(const input of next.querySelectorAll('[name=codex-issue]'))input.checked=!input.disabled&&popupState.selected.includes(input.value);
      next.onchange();
      for(const button of next.querySelectorAll('[data-bug-evidence]'))if(popupState.expanded.includes(button.dataset.bugEvidence))button.click();
      const column=popupState.sort.findIndex(s=>s==='ascending'||s==='descending');
      if(column>=0){const button=next.querySelectorAll('.bug-sort')[column];button.click();if(popupState.sort[column]==='descending')button.click();}
      next.querySelector('.table-wrap').scrollTop=popupState.scroll;
    }
  }
  notify('Report updated automatically. Current evidence and plan status are now shown.');
  return true;
}
