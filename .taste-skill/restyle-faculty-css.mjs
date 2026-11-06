import {readFileSync,writeFileSync} from 'node:fs'
const p='src/pages/FacultyManagementPageV2.css';let s=readFileSync(p,'utf8')
s=s.replace(/\/\* One 1180px[^\n]+\n/,'/* Faculty workspace follows Student Management spacing and control density. */\n')
s=s.replace('max-width:var(--maxw); margin-inline:auto; padding:var(--s-5)','max-width:none; margin-inline:0; padding:var(--s-4)')
s=s.replace('gap:var(--s-4); min-width:0;','gap:var(--s-3); min-width:0;')
s=s.replace(/\.fm-heading[^\n]*\n/g,'').replace(/\.fm-metrics[^\n]*\n/g,'')
s=s.replace('padding:var(--s-2) var(--s-4); min-height:calc(var(--s-6) + var(--s-1))','padding:var(--s-1) var(--s-3); min-height:var(--s-6)')
s=s.replace('min-height:calc(var(--s-6) + var(--s-2))','min-height:calc(var(--s-6) + var(--s-1))')
s=s.replace('.fm-tabs { display:flex; gap:var(--s-5); border-bottom:1px solid var(--border); overflow-x:auto; }','.fm-tabs { display:flex; gap:var(--s-1); border-bottom:1px solid var(--border); padding-bottom:var(--s-2); overflow-x:auto; }')
s=s.replace('padding:var(--s-3) 0; border:0; border-bottom:2px solid transparent; background:none','padding:var(--s-2) var(--s-3); border:1px solid transparent; border-radius:var(--r-sm); background:none')
s=s.replace('border-bottom-color:var(--forest); color:var(--text-strong);','border-color:var(--border); background:var(--surface-soft); color:var(--text-brand); font-weight:600;')
s=s.replace('border-radius:var(--r); background:var(--surface-card); overflow:hidden','border-radius:var(--r-sm); background:var(--surface-card); overflow:hidden')
s=s.replace('align-items:flex-end; flex-wrap:wrap; gap:var(--s-3); padding:var(--s-4)','align-items:center; flex-wrap:wrap; gap:var(--s-2); padding:var(--s-3)')
s=s.replace('.fm-toolbar .fm-search { flex:1 1 230px; }','.fm-toolbar .fm-search { flex:1 1 230px; max-width:calc(var(--s-9) * 4); margin-right:auto; }')
s=s.replace('.fm-search { display:grid; gap:var(--s-1); font-size:var(--fs-small); }\n.fm-search > span { color:var(--text-muted); }',`.fm-search { display:flex; align-items:center; gap:var(--s-2); padding:0 var(--s-3); border:1px solid var(--border); border-radius:var(--r-sm); background:var(--surface-card); color:var(--text-muted); }
.fm-search svg { flex:none; }
.fm-workspace .fm-search input { height:var(--s-6); min-height:var(--s-6); border:0; padding:0; background:transparent; border-radius:0; }
.fm-search:focus-within { outline:2px solid var(--forest); outline-offset:2px; box-shadow:0 0 0 5px var(--focus-ring); }
.fm-workspace .fm-search input:focus-visible { outline:0; box-shadow:none; }`)
s=s.replace('padding:var(--s-3) var(--s-4); border-top','padding:var(--s-2) var(--s-3); border-top')
s=s.replace('font-size:var(--font-size-h4); margin:0','font-size:var(--fs-body); margin:0')
s=s.replace('font-weight:500; color:var(--text-muted); background:var(--surface-card); position:sticky','font-weight:500; color:var(--text-strong); background:color-mix(in srgb,var(--sky) 45%,var(--surface-card)); position:sticky')
s=s.replace('padding:var(--s-3) var(--s-4); border-bottom','padding:var(--s-2) var(--s-3); border-bottom')
s=s.replace('font-size:var(--fs-small); }\n.fm-workspace tbody','font-size:var(--fs-micro); }\n.fm-workspace tbody')
s=s.replace('gap:var(--s-2); min-width:150px','gap:var(--s-1); min-width:150px')
s=s.replace('text-decoration:underline; text-underline-offset:3px;','text-decoration:none;')
s=s.replace(/@media\(max-width:1023px\)[^\n]*\n/g,'')
// Replace obsolete heading/metrics mobile rules with one compact responsive rule.
s=s.split('\n').filter(l=>!l.includes('.fm-metrics')).join('\n')
s=s.replace('.fm-heading h1 { font-size:var(--font-size-h3); } ','').replace('.fm-tabs { gap:var(--s-4); } ','.fm-tabs { gap:var(--s-1); } ')
s+='\n.fm-icon-btn { width:var(--s-6); padding:var(--s-1); }\n.fm-workspace .sm-directory-overview h1 { font-size:var(--font-size-h3); }\n.fm-workspace .sm-directory-metrics strong { font-family:var(--f-code); font-variant-numeric:tabular-nums; }\n@media(max-width:767px) { .vx-content.fm-workspace { padding:var(--s-2); } .fm-toolbar .fm-search { max-width:none; } .fm-workspace .sm-header-actions button { height:auto; min-height:44px; } }\n'
writeFileSync(p,s)
const panel='src/components/faculty/FacultyPanel.css';s=readFileSync(panel,'utf8')
s=s.replace('width:min(960px','width:min(760px').replace('padding:var(--s-4) var(--s-5)','padding:var(--s-3) var(--s-4)').replace('font-size:var(--font-size-h3)','font-size:var(--fs-body)').replace('.fm-workspace .sm-popup-icon { display:none; }','')
s=s.replace('padding:var(--s-5); overflow:auto','padding:var(--s-3) var(--s-4); overflow:auto').replace('gap:var(--s-4)','gap:var(--s-3)').replace('padding:var(--s-3) var(--s-5)','padding:var(--s-2) var(--s-4)').replace('font-weight:600','font-weight:500')
s+='\n.fm-workspace .sm-workspace-heading .lb-icon-btn { width:var(--s-6); height:var(--s-6); padding:var(--s-1); }\n'
writeFileSync(panel,s)
const steps='src/components/faculty/FacultyAssignmentWizard.css';s=readFileSync(steps,'utf8').replace('padding:var(--s-3) var(--s-5)','padding:var(--s-2) var(--s-4)').replace('gap:var(--s-4)','gap:var(--s-3)');writeFileSync(steps,s)
const filters='src/components/faculty/FacultyFilters.css';s=readFileSync(filters,'utf8').replace('repeat(3,minmax(0,1fr))','repeat(5,minmax(0,1fr))').replace('padding:var(--s-4)','padding:var(--s-3)');s+='\n.fm-filter-panel > button { justify-self:start; }\n@media(min-width:768px) and (max-width:1023px) { .fm-filter-panel { grid-template-columns:repeat(3,minmax(0,1fr)); } }\n';writeFileSync(filters,s)
