import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPlanningServer } from './planning-server.mjs';
import { connectionInput, verifyConnection } from './planning-connection.mjs';
import { configuration } from './planning-provider.mjs';

test('connection rejects injection and verifies structured output without leaking upstream messages', async () => {
  assert.throws(()=>connectionInput({key:'bad\nOPENAI_MODEL=injected',model:'example'},{}));
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async()=>new Response('private upstream details',{status:401});
    await assert.rejects(verifyConnection({key:'fixture',model:'fixture'}),/^Error: The API key was not accepted\.$/);
    globalThis.fetch=async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:'{"ready":true}'}]}]});
    await verifyConnection({key:'fixture',model:'fixture'});
    globalThis.fetch=async()=>Response.json({status:'incomplete'});
    await assert.rejects(verifyConnection({key:'fixture',model:'fixture'}),/did not complete/);
  } finally {globalThis.fetch=original;}
});

test('link persists only verified credentials; failed replacement preserves config; responses never expose key', async () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'medsy-connection-'));
  fs.mkdirSync(path.join(root,'reports/product-review'),{recursive:true});
  fs.writeFileSync(path.join(root,'reports/product-review/data.json'),JSON.stringify({version:'1',modules:[],pages:[],findings:[]}));
  const config={ready:false};
  const server=createPlanningServer({root,refresh:false,config,verifier:async candidate=>{if(candidate.model==='reject')throw Error('Model unavailable.');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const key='fixture-key-not-a-real-secret-12345';
  const post=(body,origin=base)=>fetch(base+'/api/connection',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    assert.equal((await post({key,model:'example'},'https://foreign.example')).status,403);
    assert.equal((await post({key,model:'reject'})).status,400);
    assert.equal(fs.existsSync(path.join(root,'.env.planning.local')),false);
    assert.equal((await post({key,model:'example'})).status,200);
    assert.equal(configuration(root).key,key);
    assert.equal(config.model,'example');
    assert.equal((await post({useSavedKey:true,model:'reject'})).status,400);
    assert.equal(configuration(root).model,'example');
    assert.equal((await post({useSavedKey:true,model:'second'})).status,200);
    for(const endpoint of ['/api/connection','/api/bootstrap'])assert.equal((await (await fetch(base+endpoint)).text()).includes(key),false);
    assert.equal(fs.readFileSync(path.join(root,'.product-planning.local/workspace.json'),'utf8').includes(key),false);
  }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
});
