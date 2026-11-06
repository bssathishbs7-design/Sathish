import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { createPlanningServer } from './planning-server.mjs';
import { reviewAreas, validateReviewRequest, validateReviewResult } from './review-core.mjs';
import { syncModules, storage } from './planning-core.mjs';
const report={version:'1.0',modules:[{id:'student',version:'1.0',name:'Student',reviewState:'Not reviewed',observedSource:{fingerprint:'a'}}],pages:[{id:'P1',moduleId:'student',name:'Roster'},{id:'P2',moduleId:'student',name:'Groups'}],findings:[{id:'known',moduleId:'student',pageIds:['P1'],title:'Recorded defect',type:'Confirmed issue',state:'Open',evidence:'Historical browser evidence'}]};
const request={moduleId:'student',context:'',pageIds:[],reviewAreas,attachments:[]};
const result={summary:'Fixture source analysis',limitations:'No tests executed',questions:'',pages:[{pageId:'P1',functionality:'Needs verification',design:'Potential issue',findings:[{title:'New concern',area:'Design',classification:'Confirmed issue',severity:'Medium',evidence:'Source excerpt suggests a concern',recommendation:'Reproduce before fixing',existingFindingId:''}]}]};
test('review validation accepts optional context, rejects empty areas and prevents false confirmations',()=>{
 const draft=validateReviewRequest(request,report);assert.ok(draft.context.length>=20);assert.throws(()=>validateReviewRequest({...request,reviewAreas:[]},report),/area/);
 const output=validateReviewResult(result,draft,report);assert.equal(output.pages[0].findings[0].classification,'Potential issue');assert.equal(output.pages[1].functionality,'Not assessed');
 assert.throws(()=>validateReviewResult({...result,pages:[{...result.pages[0],pageId:'foreign'}]},draft,report),/scope/);
 assert.throws(()=>validateReviewResult({...result,pages:[{...result.pages[0],design:'Verified pass'}]},draft,report),/verdict/);
});
test('confirmed review findings must reproduce recorded identity and evidence',()=>{
 const copy=structuredClone(result);copy.pages[0].findings[0].existingFindingId='known';
 const output=validateReviewResult(copy,validateReviewRequest(request,report),report);
 assert.equal(output.pages[0].findings[0].title,'Recorded defect');assert.equal(output.pages[0].findings[0].evidence,'Historical browser evidence');
});
test('source changes mark reviews outdated without removing their history; old storage migrates',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'review-storage-'));try{
 fs.writeFileSync(path.join(folder,'workspace.json'),JSON.stringify({modules:{},drafts:{student:{context:'Saved existing plan'}},runs:[],plans:[]}));const db=storage(folder);syncModules(db.state,report);
 db.state.reviews.push({id:'r',moduleId:'student',outdated:false});syncModules(db.state,{...report,modules:[{...report.modules[0],observedSource:{fingerprint:'b'}}]});
 assert.equal(db.state.reviews[0].outdated,true);assert.equal(db.state.drafts.student.context,'Saved existing plan');
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('review API confirms, versions, exports and hands selected findings to planning without completing module',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-api-'));fs.mkdirSync(path.join(root,'reports/product-review'),{recursive:true});const reportFile=path.join(root,'reports/product-review/data.json');fs.writeFileSync(reportFile,JSON.stringify(report));let calls=0;
 const server=createPlanningServer({root,refresh:false,config:{ready:true,model:'fixture'},provider:async(_config,_context,_worker,_signal,_attachments,review)=>{assert.equal(review,true);calls++;return structuredClone(result);}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(route,body)=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
 assert.equal((await post('/api/review-drafts',request)).status,200);assert.equal((await post('/api/reviews',request)).status,400);
 const body={...request,confirmed:true,idempotencyKey:'review-once',fingerprint:'a'};
 const first=await(await post('/api/reviews',body)).json();assert.equal((await(await post('/api/reviews',body)).json()).runId,first.runId);
 let data;for(let n=0;n<50;n++){data=await(await fetch(base+'/api/bootstrap')).json();if(data.reviews.length)break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(calls,11);assert.equal(data.plans.length,0);assert.equal(data.modules.student.status,'Not reviewed');assert.equal(data.modules.student.reviewStatus,'Complete');assert.equal(data.reviews[0].version,'1.0');
 const review=data.reviews[0],finding=review.result.pages[0].findings[0];
 const handoff=await(await post('/api/review-to-plan',{moduleId:'student',reviewId:review.id,findingIds:[finding.id]})).json();assert.match(handoff.draft.context,/Potential issue/);assert.deepEqual(handoff.draft.pageIds,['P1']);
 const response=await fetch(base+'/api/export?module=student&format=docx&review='+review.id);assert.equal(response.status,200);const zip=unzipSync(new Uint8Array(await response.arrayBuffer()));assert.match(strFromU8(zip['word/document.xml']),/AI review v1.0/);
 fs.writeFileSync(reportFile,JSON.stringify({...report,modules:[{...report.modules[0],observedSource:{fingerprint:'b'}}]}));
 assert.equal((await post('/api/review-to-plan',{moduleId:'student',reviewId:review.id,findingIds:[finding.id]})).status,400);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});

test('failed specialist retains partial report and blocks planning handoff',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'review-partial-'));fs.mkdirSync(path.join(root,'reports/product-review'),{recursive:true});fs.writeFileSync(path.join(root,'reports/product-review/data.json'),JSON.stringify(report));let calls=0;
 const server=createPlanningServer({root,refresh:false,config:{ready:true,model:'fixture'},testRunner:async()=>({status:'Verified pass',files:['fixture.test.js']}),provider:async()=>{if(++calls===3)throw Error('Fixture failure');return structuredClone(result);}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const post=(route,body)=>fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
 await post('/api/reviews',{...request,confirmed:true,idempotencyKey:'partial',fingerprint:'a'});
 let data;for(let n=0;n<50;n++){data=await(await fetch(base+'/api/bootstrap')).json();if(data.reviews.length)break;await new Promise(r=>setTimeout(r,10));}
 assert.equal(data.reviews[0].reviewStatus,'Partial');assert.equal(data.reviews[0].workers.length,2);assert.equal(data.modules.student.status,'Not reviewed');assert.equal(data.modules.student.reviewStatus,'Partial');
 assert.equal((await post('/api/review-to-plan',{moduleId:'student',reviewId:data.reviews[0].id,findingIds:['P1-F1']})).status,400);
 assert.equal((await fetch(base+'/api/export?module=student&format=docx')).status,200);
 }finally{await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});}
});
