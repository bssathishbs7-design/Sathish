/** Presentation helpers for the standalone reference workspace. No workflow mutations. */
/** Preserve native select semantics, touch pickers and keyboard/typeahead support. */
function initialiseSelectControls() {
  const enhance=()=>document.querySelectorAll('select').forEach(select=>{
    if(!select.parentElement.classList.contains('select-control')){
      const shell=document.createElement('span');shell.className='select-control';
      select.before(shell);shell.append(select);
      shell.insertAdjacentHTML('beforeend',uiIcon('chevron'));
      select.addEventListener('change',()=>{select.title=select.selectedOptions[0]?.textContent||'';});
    }
    select.title=select.selectedOptions[0]?.textContent||'';
  });
  enhance();
  // Filter options are rebuilt and dialogs are mounted dynamically.
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
}
function reviewVerdict(module, field) {
  if(module.reviewState==='Needs re-review')return 'Needs re-review';
  const values=modulePages(module).map(page=>page[field]);
  if(values.includes('Issue found')||values.includes('Failed'))return 'Issue found';
  if(values.every(value=>value==='Verified pass')&&values.length)return 'Verified pass';
  if(values.every(value=>value==='Not reviewed'))return 'Not reviewed';
  return 'Partial';
}
/** Module-scoped evidence status; AI lifecycle progress never implies an audit pass. */
function moduleAuditNotice(module) {
  const findings=moduleFindings(module).filter(finding=>finding.state!=='Resolved');
  const state=module.reviewState||'Not reviewed';
  const messages={
    'Not reviewed':'No functional or design audit is recorded for this module. This does not mean the module is broken.',
    'Partial':'Some flows have recorded review evidence; end-to-end verification remains incomplete.',
    'Needs re-review':'Source changes have made the earlier evidence outdated. Recheck this module before relying on previous results.',
    'Verified pass':'A verified review is recorded for this module. Its scope and evidence are listed below.',
    'Failed':'The recorded review found failures. Review the evidence and acceptance checks below.',
    'Blocked':'The review is blocked. Resolve the recorded dependencies before completing verification.',
  };
  const types=[...new Set(findings.map(finding=>finding.type))];
  const labels={'Confirmed issue':['confirmed issue','confirmed issues'],'Integration gap':['integration gap','integration gaps'],'Pending verification':['pending check','pending checks'],'Decision needed':['decision needed','decisions needed']};
  const counts=types.map(type=>{const count=findings.filter(f=>f.type===type).length;const label=labels[type]?.[count===1?0:1]||type.toLowerCase();return '<span class="audit-count">'+escapeHtml(count+' '+label)+'</span>';}).join('');
  const tone=state==='Not reviewed'?'unreviewed':state==='Verified pass'&&!findings.length?'verified':['Failed','Needs re-review'].includes(state)?'attention':'partial';
  return '<aside class="module-audit-notice '+tone+'" role="note" aria-label="'+escapeHtml(module.name)+' audit status">'+uiIcon(tone==='verified'?'check':tone==='unreviewed'?'shield':'alert')+'<div><strong>'+escapeHtml(module.name)+' · '+escapeHtml(state)+'</strong><p>'+escapeHtml(messages[state]||'Review the recorded scope and limitations below before treating this module as verified.')+'</p>'+(counts?'<div class="audit-counts">'+counts+'</div><p class="audit-help">Open findings include checks and decisions, not just confirmed defects.</p>':'<p class="audit-help">'+(state==='Not reviewed'?'No findings recorded yet. A review is required before confirming readiness.':'No open findings recorded. Review coverage and limitations still apply.')+'</p>')+'</div></aside>';
}
function decorateDialog(node) {
  const icons={'save-draft':'save','just-plan':'sparkles','confirm-yes':'check','confirm-no':'arrow','word-download':'file','pdf-download':'download','save-transition':'check'};
  Object.entries(icons).forEach(([id,icon])=>{const button=node.querySelector('#'+id);if(button)button.insertAdjacentHTML('afterbegin',uiIcon(icon));});
  if(!node.querySelector('#request-type'))return;
  node.classList.add('planning-form');
  const body=node.querySelector('.dialog-body');
  const intro=body.querySelector(':scope > p');intro.className='dialog-intro';intro.textContent='Choose the scope and describe the outcome. AI prepares a plan for your review.';
  const layout=document.createElement('div');layout.className='planner-grid';
  const aside=document.createElement('aside');aside.className='planner-scope';
  const main=document.createElement('div');main.className='planner-context';
  const request=node.querySelector('#request-type').closest('label');
  const scope=body.querySelector('fieldset');scope.querySelector('legend').textContent='Pages in scope';
  const hint=document.createElement('p');hint.className='small';hint.textContent='No selection includes all pages.';scope.prepend(hint);
  const upload=node.querySelector('#plan-files').closest('label');upload.className='upload-control';
  const fileInput=upload.querySelector('input');upload.replaceChildren(fileInput);upload.insertAdjacentHTML('beforeend',uiIcon('upload')+'<strong>Add documents</strong><span>Optional · Word, PDF, text or images</span>');
  const help=body.querySelector(':scope > p.small');
  aside.append(scope,upload);if(help)aside.append(help);aside.append(node.querySelector('#attachment-list'));
  main.append(request,node.querySelector('#plan-context').closest('label'),node.querySelector('#plan-constraints').closest('label'));
  layout.append(main,aside);intro.after(layout);
}

function initialiseCompactWorkspace() {
  initialiseWorkspaceTheme();
  const header=document.querySelector('.viewer');header.insertBefore(document.querySelector('.jump-links'),header.querySelector('.utilities'));
  initialiseSectionTabs(header.querySelector('.jump-links'));
  $('#import-notes').insertAdjacentHTML('afterbegin',uiIcon('upload'));
  const toolbar=document.querySelector('.workspace-toolbar');
  toolbar.querySelector('label:first-child').className='search-control';toolbar.querySelector('label:first-child').insertAdjacentHTML('beforeend',uiIcon('search'));
  $('#module-search').placeholder='Search modules or pages…';
  $('#refresh-workspace').innerHTML=uiIcon('refresh');$('#refresh-workspace').className='icon-button';$('#refresh-workspace').setAttribute('aria-label','Refresh source and AI runs');$('#refresh-workspace').title='Refresh source and AI runs';
  const advanced=document.querySelector('.advanced-filters');advanced.hidden=true;
  const filterButton=document.createElement('button');filterButton.id='open-filters';filterButton.innerHTML=uiIcon('filters')+'Filters';toolbar.insertBefore(filterButton,$('#refresh-workspace'));
  filterButton.onclick=()=>{
    const popup=dialog('Filter modules','<p>Combine page, team and audit filters to narrow this grid.</p>','<button id="apply-filters" class="copy">Done</button>');
    popup.classList.add('filter-dialog');popup.querySelector('.dialog-body').append($('#filters'),advanced.querySelector('.legend'));
    popup.querySelector('#apply-filters').onclick=()=>popup.close();
    popup.addEventListener('close',()=>advanced.append(popup.querySelector('#filters'),popup.querySelector('.legend')),{once:true});
  };
  const icons=['grid','student','users','shield','alert'];document.querySelectorAll('.module-tabs button').forEach((button,index)=>button.insertAdjacentHTML('afterbegin',uiIcon(icons[index])));
  const connectionPanel=document.createElement('button');connectionPanel.type='button';connectionPanel.className='connection-trigger';connectionPanel.id='ai-connection-button';connectionPanel.innerHTML=uiIcon('shield')+'<span>AI connection</span>';connectionPanel.onclick=()=>openConnection();
  document.querySelector('.heading').append(connectionPanel);$('#connection').hidden=true;
  initialiseSelectControls();
}

function initialiseWorkspaceTheme() {
  const root=document.documentElement;
  let theme='light';try{const stored=localStorage.getItem('medsy-theme');if(stored==='dark'||stored==='oled')theme='dark';}catch{/* Session-only theme when storage is unavailable. */}
  const button=document.createElement('button');button.id='workspace-theme';button.className='icon-button';button.type='button';
  const apply=value=>{theme=value;root.dataset.theme=value;root.style.colorScheme=value;const next=value==='dark'?'light':'dark';button.innerHTML=uiIcon(next==='light'?'sun':'moon');button.setAttribute('aria-label','Switch to '+next+' mode');button.title='Switch to '+next+' mode';button.setAttribute('aria-pressed',String(value==='dark'));};
  button.onclick=()=>{apply(theme==='dark'?'light':'dark');try{localStorage.setItem('medsy-theme',theme);}catch{notify('Theme changed for this session. Browser storage is unavailable.');}};
  document.querySelector('.utilities').prepend(button);apply(theme);
}

/** Separate sections without discarding filters, notes or expanded module state. */
function initialiseSectionTabs(nav) {
  const sections=[['module-reports','Module reports','grid'],['team-report','AI specialists','users'],['next-actions','Next steps','clipboard'],['version-history','Version history','history']];
  nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Workspace sections');
  nav.innerHTML=sections.map(([id,label,icon])=>'<button type="button" role="tab" id="tab-'+id+'" aria-controls="'+id+'" aria-selected="false" tabindex="-1" data-section="'+id+'">'+uiIcon(icon)+label+'</button>').join('');
  sections.forEach(([id])=>{const panel=document.getElementById(id);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+id);panel.tabIndex=0;});
  const activate=(id,{focus=false,remember=false}={})=>{
    if(!sections.some(([key])=>key===id))id='module-reports';
    sections.forEach(([key])=>{const active=key===id;document.getElementById(key).hidden=!active;const tab=document.getElementById('tab-'+key);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    const tab=document.getElementById('tab-'+id);
    if(focus){tab.focus();tab.scrollIntoView({block:'nearest',inline:'nearest'});}
    if(remember)history.replaceState(null,'','#'+id);
  };
  nav.addEventListener('click',event=>{const tab=event.target.closest('[data-section]');if(tab)activate(tab.dataset.section,{remember:true});});
  nav.addEventListener('keydown',event=>{
    const current=event.target.closest('[data-section]');if(!current)return;
    const index=sections.findIndex(([id])=>id===current.dataset.section);let next;
    if(event.key==='ArrowRight')next=(index+1)%sections.length;
    if(event.key==='ArrowLeft')next=(index-1+sections.length)%sections.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=sections.length-1;
    if(next===undefined)return;event.preventDefault();activate(sections[next][0],{focus:true,remember:true});
  });
  document.addEventListener('click',event=>{if(event.target.closest('[data-team]'))activate('module-reports',{remember:true});},true);
  window.addEventListener('hashchange',()=>activate(location.hash.slice(1)));
  const archive=document.querySelector('footer>details');if(archive){archive.classList.add('workspace-archive');document.getElementById('version-history').append(archive);}
  activate(location.hash.slice(1));
}
