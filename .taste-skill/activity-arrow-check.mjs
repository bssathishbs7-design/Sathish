import {Browser,sleep} from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1026,height:590})
 await page.goto('http://127.0.0.1:5173/skills/configuration');await sleep(800)
 console.log(await page.eval(()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/Activity|activit|Instruction/.test(t))))
 if(!await page.eval(()=>!!document.querySelector('.instruction-badge'))) {await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Activity')?.click());await sleep(300)}
 assert.ok(await page.eval(()=>!!document.querySelector('.instruction-badge')))
 await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(500)
 console.log(await page.eval(()=>({open:document.querySelector('.instruction-popover').matches(':popover-open'),side:document.querySelector('.instruction-popover').dataset.side})))
 await page.screenshot({path:'.taste-skill/activity-instructions-desktop.png',format:'png'})
 assert.equal(await page.eval(()=>document.querySelectorAll('.instruction-guide-table tbody tr').length),4);assert.ok(await page.eval(()=>{const b=document.querySelector('.instruction-popover-body');return b.scrollHeight<=b.clientHeight+1}))

 console.log(await page.eval(()=>{const p=document.querySelector('.instruction-popover'),a=document.querySelector('.instruction-popover-arrow'),t=document.querySelector('.instruction-badge');return {side:p.dataset.side,p:p.getBoundingClientRect().toJSON(),a:a.getBoundingClientRect().toJSON(),t:t.getBoundingClientRect().toJSON(),y:getComputedStyle(p).getPropertyValue('--instruction-arrow-y'),top:getComputedStyle(a).top}}));
}finally{await browser.close()}
