import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const jsonHash = value => hash(JSON.stringify(value));
const slash = value => value.replaceAll('\\','/');
const nextVersion = value => { const [major, minor] = value.split('.').map(Number); return `${major}.${minor + 1}`; };
const advanceVersion = (value, history) => {
  if (!history.length) return value;
  const current=value.split('.').map(Number), previous=history[0].version.split('.').map(Number);
  return current[0]>previous[0] || current[0]===previous[0]&&current[1]>previous[1] ? value : nextVersion(value);
};

/** Hash local application inputs, including untracked sources, without reading secrets or browser data. */
export function sourceSnapshot(root) {
  const result = {};
  const walk = relative => {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) { for (const entry of fs.readdirSync(absolute).sort()) walk(slash(path.join(relative,entry))); }
    else result[slash(relative)] = hash(fs.readFileSync(absolute));
  };
  for (const item of ['src','public','package.json','package-lock.json','yarn.lock','pnpm-lock.yaml','vite.config.js','index.html']) walk(item);
  return result;
}
function importsFor(root, file, available) {
  if (!/\.(?:jsx?|css|mjs)$/.test(file)) return [];
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const matches = [...source.matchAll(/(?:from\s*|import\s*\(?\s*|@import\s*)(?:url\()?['"](\.[^'"]+)['"]/g)];
  return matches.flatMap(match => {
    const base = slash(path.normalize(path.join(path.dirname(file),match[1])));
    return [base, ...['.js','.jsx','.mjs','.css','.json','/index.js','/index.jsx'].map(ext=>base+ext)].filter(candidate=>available.has(candidate));
  });
}
/** Each module watches its roots plus transitive local imports. Unclassified source changes invalidate all modules conservatively. */
export function moduleDependencies(root, modules, snapshot) {
  const files = Object.keys(snapshot), available = new Set(files), imports = new Map();
  for (const file of files) imports.set(file, importsFor(root,file,available));
  const shared = files.filter(file=>!file.startsWith('src/') || /^src\/(?:App\.|main\.|index\.|config\/appPages)/.test(file));
  const mapping = {};
  for (const module of modules) {
    const pattern = new RegExp(module.pattern,'i');
    const visited = new Set(), queue = files.filter(file=>file.startsWith('src/') && pattern.test(file));
    while(queue.length) { const file=queue.pop(); if(visited.has(file))continue;visited.add(file);queue.push(...imports.get(file)||[]); }
    mapping[module.id] = [...new Set([...visited,...shared])].sort();
  }
  const covered = new Set(Object.values(mapping).flat());
  const unclassified = files.filter(file=>!covered.has(file));
  for (const module of modules) mapping[module.id] = [...new Set([...mapping[module.id],...unclassified])].sort();
  return mapping;
}
function sourceInfo(root, snapshot, at) {
  let commit=null, dirty=true;
  try {
    commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    dirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=all','--','src','public','package.json','package-lock.json','vite.config.js','index.html'],{cwd:root,encoding:'utf8'}).trim());
  } catch {
    // Restricted Windows sessions may deny child processes. Resolve HEAD read-only;
    // conservatively retain dirty=true when Git cannot inspect the working tree.
    try {
      let gitDir=path.join(root,'.git');
      if(fs.statSync(gitDir).isFile())gitDir=path.resolve(root,fs.readFileSync(gitDir,'utf8').trim().replace(/^gitdir:\s*/,''));
      const head=fs.readFileSync(path.join(gitDir,'HEAD'),'utf8').trim();
      if(!head.startsWith('ref:'))commit=head;
      else {
        const ref=head.slice(5),refFile=path.join(gitDir,ref);
        if(fs.existsSync(refFile))commit=fs.readFileSync(refFile,'utf8').trim();
        else commit=fs.readFileSync(path.join(gitDir,'packed-refs'),'utf8').split('\n').find(line=>line.endsWith(' '+ref))?.split(' ')[0]||null;
      }
    }catch{ /* Snapshot hashes still establish the local baseline outside Git. */ }
  }
  return {commit,dirty,fingerprint:jsonHash(snapshot),checkedAt:at};
}
export function readRegistry(root) {
  const source=fs.readFileSync(path.join(root,'src/config/appPages.js'),'utf8');
  const block=source.match(/export const APP_PAGES\s*=\s*\{([\s\S]*?)\n\}/)?.[1];
  if(!block)throw Error('APP_PAGES registry could not be read; update the report parser before generating.');
  const app=fs.readFileSync(path.join(root,'src/App.jsx'),'utf8');
  const routes=Object.fromEntries([...app.matchAll(/\[APP_PAGES\.(\w+)\]:\s*'([^']+)'/g)].map(m=>[m[1],m[2]]));
  return [...block.matchAll(/(\w+):\s*'([^']+)'/g)].map(m=>({key:m[1],name:m[2],route:routes[m[1]]||'No route mapping found'}));
}
function reconcileInventory(data, registry) {
  const active=new Set(registry.map(p=>p.key));
  for(const item of registry) {
    const existing=data.pages.find(p=>p.key===item.key);
    if(existing){Object.assign(existing,item,{removed:false});continue;}
    let module=data.modules.find(m=>m.keys.includes(item.key));
    if(!module){module=data.modules.find(m=>m.id==='unassigned');if(!module){module={id:'unassigned',name:'Unassigned module',keys:[],pattern:'(?!)',version:'1.0',updatedAt:null,reviewState:'Not reviewed',summary:'New registered pages need a module assignment and review.',journey:'Confirm the entry, roles, steps, outcomes and dependent modules.',related:[],history:[],review:null};data.modules.push(module);}module.keys.push(item.key);}
    data.pages.push({...item,id:'PAGE-AUTO-'+item.key,moduleId:module.id,scope:'New registered page. Confirm requirements, roles and full flow before assessing behaviour.',functionality:'Not reviewed',design:'Not reviewed',roles:'Role permissions need review',reviewedAt:null,removed:false});
  }
  for(const page of data.pages) if(!active.has(page.key))page.removed=true;
}
function validateData(data) {
  if(data.schemaVersion!==1 || !/^\d+\.\d+$/.test(data.version))throw Error('Invalid report schema or version.');
  const moduleIds=new Set(data.modules.map(m=>m.id)), pageIds=new Set(data.pages.map(p=>p.id));
  if(moduleIds.size!==data.modules.length||pageIds.size!==data.pages.length)throw Error('Duplicate module or page IDs.');
  for(const page of data.pages)if(!moduleIds.has(page.moduleId))throw Error('Unmapped page: '+page.key);
  for(const finding of data.findings)if(!moduleIds.has(finding.moduleId)||finding.pageIds.some(id=>!pageIds.has(id)))throw Error('Invalid finding references: '+finding.id);
}
function moduleContent(data,module) {
  const {_contentHash,_watchedFiles,observedSource,version,updatedAt,history,...content}=module;
  return jsonHash({module:content,pages:data.pages.filter(p=>p.moduleId===module.id),findings:data.findings.filter(f=>f.moduleId===module.id)});
}
function publicData(data) {
  const {_sourceSnapshot,_presentationHash,_globalHash,...copy}=structuredClone(data);
  copy.modules=copy.modules.map(({_contentHash,_watchedFiles,...module})=>module);
  return copy;
}
export function renderDocument(root,data) {
  const folder=path.join(root,'reports/product-review');
  const optional=name=>fs.existsSync(path.join(folder,name))?fs.readFileSync(path.join(folder,name),'utf8'):'';
  const css=fs.readFileSync(path.join(root,'src/styles/medsy/question-sort-tokens.css'),'utf8')+'\n'+fs.readFileSync(path.join(folder,'report.css'),'utf8')+'\n'+optional('planning.css')+'\n'+optional('review.css')+'\n'+optional('connection.css')+'\n'+optional('team-hierarchy.css');
  const hierarchyFile=path.join(root,'scripts/reports/team-hierarchy.mjs');
  const hierarchy=fs.existsSync(hierarchyFile)?fs.readFileSync(hierarchyFile,'utf8').replace(/^export /gm,''):'';
  const script=hierarchy+'\n'+optional('team-hierarchy.js')+'\n'+fs.readFileSync(path.join(folder,'report.js'),'utf8')+'\n'+optional('planning-icons.js')+'\n'+optional('planning-visuals.js')+'\n'+optional('codex-prompt-guidance.js')+'\n'+optional('codex-workflow.js')+'\n'+optional('review-evidence.js')+'\n'+optional('live-report.js')+'\n'+optional('planning.js')+'\n'+optional('review.js')+'\n'+optional('connection.js');
  const displayData=publicData(data);
  const evidenceRoot=path.resolve(folder,'evidence');
  for(const finding of displayData.findings) for(const shot of finding.screenshots||[]) {
    const imagePath=path.resolve(root,shot.path);
    if(!imagePath.startsWith(evidenceRoot+path.sep)||path.extname(imagePath)!=='.png')throw Error('Invalid screenshot path: '+shot.path);
    shot.src='data:image/png;base64,'+fs.readFileSync(imagePath).toString('base64');
  }
  const payload=JSON.stringify(displayData).replaceAll('<','\\u003c');
  return fs.readFileSync(path.join(folder,'template.html'),'utf8').replace('__CSS__',()=>css).replace('__DATA__',()=>payload).replace('__JS__',()=>script);
}

/** Refresh invalidates stale evidence. Explicit recordReview is a human/agent attestation AFTER actual checks, never automatic approval. */
export function updateReport({root=defaultRoot,check=false,recordReview=null,result=null,note=null,now=new Date().toISOString()}={}) {
  const dataPath=path.join(root,'reports/product-review/data.json'),output=path.join(root,'business-analyst-reference.html');
  const original=fs.readFileSync(dataPath,'utf8'),data=JSON.parse(original);
  reconcileInventory(data,readRegistry(root));validateData(data);
  const snapshot=sourceSnapshot(root),previous=data._sourceSnapshot||{},initial=!data._sourceSnapshot;
  const changedFiles=[...new Set([...Object.keys(snapshot),...Object.keys(previous)])].filter(file=>snapshot[file]!==previous[file]);
  const deps=moduleDependencies(root,data.modules,snapshot),info=sourceInfo(root,snapshot,now),changedModules=[];
  const affected=new Set(data.modules.filter(module=>changedFiles.some(file=>new Set([...deps[module.id],...module._watchedFiles||[]]).has(file))).map(m=>m.id));
  // Semantic consumers can be affected without importing the producer's source directly.
  if(!initial){let expanded=true;while(expanded){expanded=false;for(const module of data.modules)if(affected.has(module.id))for(const related of module.related||[])if(!affected.has(related)){affected.add(related);expanded=true;}}}
  if(recordReview&&!data.modules.some(m=>m.id===recordReview))throw Error('Unknown review module: '+recordReview);
  if(recordReview&&(!['Partial','Verified pass','Failed','Blocked','Not reviewed'].includes(result)||!note?.trim()||note.trim().length<20))throw Error('record-review requires --result and an evidence summary of at least 20 characters.');
  for(const module of data.modules) {
    const relevant=new Set([...deps[module.id],...module._watchedFiles||[]]);
    const changes=changedFiles.filter(file=>relevant.has(file));
    const historicalDrift=initial&&module.review?.fingerprints?.some(f=>snapshot[f.path]!==f.sha256);
    const changedSource=!initial&&affected.has(module.id);
    if(changedSource||historicalDrift){if(module.reviewState!=='Not reviewed')module.reviewState='Needs re-review';module.staleReason=historicalDrift?'Original review fingerprints differ from current source.':changes.length?'Source inputs changed: '+changes.slice(0,10).join(', '):'A related upstream module changed; review the downstream handoff.';}
    if(recordReview===module.id){
      if(result==='Verified pass'&&(data.findings.some(f=>f.moduleId===module.id&&f.state!=='Resolved')||data.pages.some(p=>p.moduleId===module.id&&!p.removed&&(p.functionality!=='Verified pass'||p.design!=='Verified pass'||!p.reviewedAt))))throw Error('Cannot record a full pass while findings or page checks remain unresolved.');
      module.reviewState=result;module.staleReason='';module.currentReview={at:now,result,summary:note,source:info};
    }
    const contentHash=moduleContent(data,module),contentChanged=module._contentHash!==contentHash;
    const metadataChanged=module.observedSource?.commit!==info.commit || module.observedSource?.dirty!==info.dirty;
    if(initial||changedSource||contentChanged||metadataChanged||recordReview===module.id){
      module.version=advanceVersion(module.version,module.history);
      module.updatedAt=now;
      const summary=initial?'Initial formal module baseline; prior unversioned evidence retained.':recordReview===module.id?'Review recorded: '+note:changedSource?'Source changed; affected behaviour must be reviewed.':metadataChanged&&!contentChanged?'Source commit metadata refreshed; no new behaviour review.':'Module findings, inventory or evidence updated.';
      module.history.unshift({version:module.version,at:now,summary,source:info.commit,changedFiles:changes});
      module.observedSource={...info,fingerprint:jsonHash(Object.fromEntries(deps[module.id].map(file=>[file,snapshot[file]])))};
      changedModules.push(module.id);
    }
    module._contentHash=contentHash;module._watchedFiles=deps[module.id];
  }
  const presentationFiles=['reports/product-review/template.html','reports/product-review/report.css','reports/product-review/report.js','reports/product-review/planning.css','reports/product-review/planning.js','scripts/reports/planning-core.mjs','scripts/reports/planning-provider.mjs','scripts/reports/planning-server.mjs','scripts/reports/planning-export.mjs','scripts/reports/update-reference.mjs','AGENTS.md','reports/product-review/MAINTENANCE.md'];
  presentationFiles.push('scripts/reports/planning-pdf.mjs');
  presentationFiles.push('reports/product-review/planning-icons.js','reports/product-review/planning-visuals.js');
  presentationFiles.push('reports/product-review/review.js','reports/product-review/review.css','scripts/reports/review-core.mjs');
  presentationFiles.push('reports/product-review/connection.js','reports/product-review/connection.css','scripts/reports/planning-connection.mjs');
  presentationFiles.push('scripts/reports/team-hierarchy.mjs','reports/product-review/team-hierarchy.js','reports/product-review/team-hierarchy.css');
  presentationFiles.push('scripts/reports/review-testing.mjs','scripts/reports/review-summary.mjs','reports/product-review/review-evidence.js');
  presentationFiles.push('reports/product-review/live-report.js','reports/product-review/codex-workflow.js','reports/product-review/codex-prompt-guidance.js');
  const presentationHash=jsonHash(presentationFiles.map(file=>[file,fs.existsSync(path.join(root,file))?hash(fs.readFileSync(path.join(root,file))):null]));
  const presentationChanged=data._presentationHash!==presentationHash;
  const globalHash=jsonHash({title:data.title,scope:data.scope,teams:data.teams,maintenance:data.maintenance,legacyTasks:data.legacyTasks});
  const globalChanged=data._globalHash!==globalHash;
  const sourceChanged=data.source?.commit!==info.commit||data.source?.dirty!==info.dirty;
  if(initial||changedModules.length||presentationChanged||sourceChanged||globalChanged){
    data.version=advanceVersion(data.version,data.history);
    data.updatedAt=now;data.source=info;
    data.history.unshift({version:data.version,at:now,summary:initial?'Initial versioned single-page report. Previous workspace archived; historical Student Management review retained.':changedModules.length?'Updated modules: '+changedModules.join(', ')+'.':presentationChanged?'Report presentation or maintenance tooling updated.':'Source commit metadata refreshed; no behaviour review implied.'});
  }
  data._presentationHash=presentationHash;data._globalHash=globalHash;data._sourceSnapshot=snapshot;
  const rendered=renderDocument(root,data),newData=JSON.stringify(data,null,2)+'\n';
  const stale=newData!==original||!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==rendered;
  if(check)return {ok:!stale,changedFiles,changedModules,message:stale?'Report is stale. Run --refresh, review affected modules, then record actual results.':'Report matches source snapshot and presentation. This is not a behaviour-test pass.'};
  if(stale){fs.writeFileSync(dataPath,newData,'utf8');fs.writeFileSync(output,rendered,'utf8');}
  return {ok:true,changed:stale,version:data.version,changedModules,changedFiles:initial?[]:changedFiles,message:stale?'Report refreshed. Review states remain evidence-bound.':'No changes; versions unchanged.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1];
  const allowed=new Set(['--refresh','--check','--watch','--record-review','--result','--note']);
  try{
    for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error('Unknown argument: '+args[i]);if(['--record-review','--result','--note'].includes(args[i]))i++;}
    if(args.includes('--check')&&(args.includes('--watch')||args.includes('--record-review')))throw Error('--check cannot record reviews or watch.');
    if(args.includes('--watch')&&args.includes('--record-review'))throw Error('Do not automatically repeat a review attestation in watch mode.');
    if((args.includes('--result')||args.includes('--note'))&&!args.includes('--record-review'))throw Error('--result and --note require --record-review.');
    const run=()=>{const output=updateReport({check:args.includes('--check'),recordReview:args.includes('--record-review')?value('--record-review'):null,result:args.includes('--result')?value('--result'):null,note:args.includes('--note')?value('--note'):null});console.log(JSON.stringify(output,null,2));if(!output.ok)process.exitCode=1;};
    run();
    if(args.includes('--watch')){console.log('Watching local source every 5 seconds. Stop with Ctrl+C. This marks stale modules; it does not run audits.');setInterval(()=>{try{const output=updateReport();if(output.changed)console.log(JSON.stringify(output));}catch(error){console.error(error.message)}},5000);}
  }catch(error){console.error(error.message);process.exitCode=1;}
}
