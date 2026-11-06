import {Browser,sleep} from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try{
 const page=await browser.newPage({width:1440,height:1000});await page.goto('http://127.0.0.1:5173/skills/configuration')
 await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Activity').click());await sleep(250)
 const point=await page.eval(()=>{const r=document.querySelector('.instruction-badge').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})
 const move=async p=>page.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p})
 const click=async()=>{await page.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await sleep(150)}
 const open=()=>page.eval(()=>document.querySelector('.instruction-popover').matches(':popover-open'))
 await move(point);await sleep(500);assert.equal(await open(),true)
 assert.equal(await page.eval(()=>document.querySelector('.instruction-popover').contains(document.activeElement)),false)
 const inside=await page.eval(()=>{const r=document.querySelector('.instruction-popover').getBoundingClientRect();return {x:r.left+50,y:r.top+60}})
 await move(inside);await sleep(500);assert.equal(await open(),true)
 await move({x:20,y:80});await sleep(1000);assert.equal(await open(),false)
 await move(point);await sleep(200);await click();await move({x:20,y:80});await sleep(1000);assert.equal(await open(),true)
 await move(point);await click();assert.equal(await open(),false)
 await move({x:20,y:80});await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('.instruction-badge'),'::before').animationName),'none')
 assert.deepEqual(page.consoleErrors,[]);console.log('Hover preview, pointer crossing, leave dismissal, click pin/unpin and reduced motion passed')
}finally{await browser.close()}
