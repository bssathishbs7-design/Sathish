import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {updateReport} from './update-reference.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function fixture(){
  const parent=path.join(repo,'tmp','product-report-tests');fs.mkdirSync(parent,{recursive:true});
  const root=fs.mkdtempSync(path.join(parent,'case-'));
  const write=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text)};
  const data=JSON.parse(fs.readFileSync(path.join(repo,'reports/product-review/data.json'),'utf8'));
  delete data._sourceSnapshot;delete data._presentationHash;delete data._globalHash;delete data.source;data.history=[];data.version='1.0';data.updatedAt=null;
  for(const m of data.modules){delete m._contentHash;delete m._watchedFiles;delete m.observedSource;delete m.currentReview;delete m.staleReason;m.review=null;m.history=[];m.version='1.0';m.reviewState=m.id==='student-management'?'Partial':'Not reviewed';}
  write('reports/product-review/data.json',JSON.stringify(data,null,2)+'\n');
  for(const file of ['reports/product-review/template.html','reports/product-review/report.css','reports/product-review/report.js','scripts/reports/update-reference.mjs','AGENTS.md','reports/product-review/MAINTENANCE.md'])write(file,fs.readFileSync(path.join(repo,file),'utf8'));
  write('src/styles/medsy/question-sort-tokens.css',':root{}');
  write('src/config/appPages.js',"export const APP_PAGES = {\n"+data.pages.map(p=>` ${p.key}: '${p.name}',`).join('\n')+'\n}');
  write('src/App.jsx','const PAGE_PATHS = {\n'+data.pages.map(p=>` [APP_PAGES.${p.key}]: '${p.route}',`).join('\n')+'\n}');
  write('src/pages/StudentManagementPage.jsx',"import '../services/studentManagement.js'; export default function Student(){}\n");
  write('src/services/studentManagement.js','export const version=1;\n');
  write('src/pages/QueryRequestPage.jsx','export default function Query(){}\n');
  const read=()=>JSON.parse(fs.readFileSync(path.join(root,'reports/product-review/data.json'),'utf8'));
  return {root,write,read};
}

test('initial build reconciles all pages; unchanged refreshes do not increment versions',()=>{
  const f=fixture();assert.equal(updateReport({root:f.root}).version,'1.0');
  const before=fs.readFileSync(path.join(f.root,'reports/product-review/data.json'),'utf8');
  assert.equal(updateReport({root:f.root}).changed,false);
  assert.equal(updateReport({root:f.root,check:true}).ok,true);
  assert.equal(fs.readFileSync(path.join(f.root,'reports/product-review/data.json'),'utf8'),before);
  assert.equal(f.read().pages.filter(p=>!p.removed).length,43);
});
test('source changes invalidate a reviewed module and semantic consumers, keeping unrelated versions stable',()=>{
  const f=fixture();updateReport({root:f.root});
  f.write('src/services/studentManagement.js','export const version=2;\n');
  const before=fs.readFileSync(path.join(f.root,'reports/product-review/data.json'),'utf8');
  assert.equal(updateReport({root:f.root,check:true}).ok,false);
  assert.equal(fs.readFileSync(path.join(f.root,'reports/product-review/data.json'),'utf8'),before,'check is read-only');
  const result=updateReport({root:f.root});assert(result.changedModules.includes('student-management'));assert(result.changedModules.includes('faculty-management'));
  const data=f.read();assert.equal(data.modules.find(m=>m.id==='student-management').reviewState,'Needs re-review');
  assert.equal(data.modules.find(m=>m.id==='requests').version,'1.0');assert.equal(data.version,'1.1');assert.equal(updateReport({root:f.root}).changed,false);
});
test('new registry page is included without inventing a review; removed page history stays',()=>{
  const f=fixture();updateReport({root:f.root});
  const registry=fs.readFileSync(path.join(f.root,'src/config/appPages.js'),'utf8');f.write('src/config/appPages.js',registry.replace('\n}',"\n NEW_MODULE: 'New module',\n}").replace(/\s*LOGIN: 'Login',/,''));
  updateReport({root:f.root});const data=f.read();const added=data.pages.find(p=>p.key==='NEW_MODULE');assert.equal(added.moduleId,'unassigned');assert.equal(added.functionality,'Not reviewed');assert.equal(data.pages.find(p=>p.key==='LOGIN').removed,true);
});
test('presentation-only changes advance the document but not module versions',()=>{
  const f=fixture();updateReport({root:f.root});f.write('reports/product-review/report.css','body{font-size:15px}');updateReport({root:f.root});const data=f.read();assert.equal(data.version,'1.1');assert(data.modules.every(m=>m.version==='1.0'));
});
test('manual review requires evidence and refuses a full pass with unresolved findings',()=>{
  const f=fixture();updateReport({root:f.root});assert.throws(()=>updateReport({root:f.root,recordReview:'student-management',result:'Partial',note:''}));
  assert.throws(()=>updateReport({root:f.root,recordReview:'student-management',result:'Verified pass',note:'Service tests ran; browser checks remain incomplete.'}));
  updateReport({root:f.root,recordReview:'student-management',result:'Partial',note:'Reviewed source and targeted tests; transactional UI paths remain unverified.'});
  assert.equal(f.read().modules[0].currentReview.result,'Partial');assert.equal(updateReport({root:f.root,check:true}).ok,true);
});
test('deleted and unclassified sources invalidate conservatively; generated HTML tampering fails check',()=>{
  const f=fixture();updateReport({root:f.root});fs.unlinkSync(path.join(f.root,'src/services/studentManagement.js'));updateReport({root:f.root});assert.equal(f.read().modules[0].reviewState,'Needs re-review');
  f.write('src/newSharedContract.js','export const changed=true;');const changed=updateReport({root:f.root});assert.equal(changed.changedModules.length,f.read().modules.length);
  f.write('business-analyst-reference.html','unexpected output');assert.equal(updateReport({root:f.root,check:true}).ok,false);
});
test('an explicitly selected major version is respected',()=>{
  const f=fixture();updateReport({root:f.root});const data=f.read();data.version='2.0';data.modules[0].version='2.0';data.modules[0].summary+=' New scope explicitly approved.';f.write('reports/product-review/data.json',JSON.stringify(data,null,2)+'\n');updateReport({root:f.root});assert.equal(f.read().version,'2.0');assert.equal(f.read().modules[0].version,'2.0');
});
