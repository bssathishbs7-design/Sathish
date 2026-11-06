import {Browser,sleep} from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1026,height:590})
 await page.goto('http://127.0.0.1:5173/skills/configuration')
 await page.eval(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add Activity').click());await sleep(200)
 await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(900)
 const verify=async()=>{
 const result=await page.eval(()=>{const p=document.querySelector('.instruction-popover'),t=document.querySelector('.instruction-badge'),r=p.getBoundingClientRect(),a=t.getBoundingClientRect(),css=getComputedStyle(p,'::before');return {side:p.dataset.side,visibility:css.visibility,delta:Math.abs(r.top+1+parseFloat(css.top)+8-(a.top+a.height/2)),left:parseFloat(css.left),oldSvg:!!p.querySelector('.instruction-popover-arrow')}})
 assert.equal(result.oldSvg,false);assert.equal(result.visibility,'visible');assert.equal(result.side,'right');assert.ok(result.delta<2,JSON.stringify(result));assert.equal(result.left,-9)
 }
 await verify();await page.screenshot({path:'.taste-skill/instruction-pointer-before-scroll.png',format:'png'})
 await page.eval(()=>window.scrollBy(0,190));await sleep(600);await verify()
 await page.screenshot({path:'.taste-skill/instruction-pointer-after-scroll.png',format:'png'})
 await page.eval(()=>document.querySelector('.instruction-popover-head button').click());await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(600);await verify()
 assert.deepEqual(page.consoleErrors,[]);console.log('Pointer centre matches trigger before scroll, after scroll and after reopening; old SVG removed.')
}finally{await browser.close()}
