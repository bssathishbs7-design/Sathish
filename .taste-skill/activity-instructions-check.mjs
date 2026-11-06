import {Browser,sleep} from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1440,height:1000})
 await page.goto('http://127.0.0.1:5173/skills/configuration');await sleep(800)
 console.log(await page.eval(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Activity|activit|Instruction/.test(t))))
 if(!await page.eval(()=>!!document.querySelector('.instruction-badge'))) {await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Activity')?.click());await sleep(300)}
 assert.ok(await page.eval(()=>!!document.querySelector('.instruction-badge')))
 await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(500)
 console.log(await page.eval(()=>({open:document.querySelector('.instruction-popover').matches(':popover-open'),side:document.querySelector('.instruction-popover').dataset.side})))
 await page.screenshot({path:'.taste-skill/activity-instructions-desktop.png',format:'png'})
 assert.equal(await page.eval(()=>document.querySelectorAll('.instruction-guide-table tbody tr').length),4);assert.ok(await page.eval(()=>{const b=document.querySelector('.instruction-popover-body');return b.scrollHeight<=b.clientHeight+1}))
 for(const width of [822,768]){await page.setViewport({width,height:573});await page.goto('http://127.0.0.1:5173/skills/configuration');await sleep(500);if(!await page.eval(()=>!!document.querySelector('.instruction-badge'))){await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Activity')?.click());await sleep(200)} console.log('width',width,await page.eval(()=>({buttons:[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(-20),text:document.body.innerText.slice(-1200)})));if(!await page.eval(()=>document.querySelector('.instruction-popover')?.matches(':popover-open'))){await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(300)}assert.ok(await page.eval(()=>{const r=document.querySelector('.instruction-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));await page.screenshot({path:'.taste-skill/activity-instructions-'+width+'.png',format:'png'})}
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(100)
 assert.equal(await page.eval(()=>document.querySelector('.instruction-popover').matches(':popover-open')),false)
 assert.deepEqual(page.consoleErrors,[]);console.log('Popover content, placement bounds and Escape passed')
}finally{await browser.close()}
