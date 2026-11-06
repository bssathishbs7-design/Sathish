import { Browser, sleep } from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import {mkdirSync} from 'node:fs'
import assert from 'node:assert/strict'
const out='.taste-skill/faculty-popups';mkdirSync(out,{recursive:true})
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1440,height:900})
 await page.goto('http://127.0.0.1:5173/faculty-management')
 const click=async text=>{await page.eval(text=>[...document.querySelectorAll('.fm-workspace button')].find(b=>b.textContent.trim()===text).click(),text);await sleep(500)}
 for(const width of [1440,768,390]) {
  await page.setViewport({width,height:900});await click('Import faculty')
  assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('dialog')).animationName),'fm-dialog-enter')
  assert.ok(await page.eval(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}))
  if(width>479) assert.ok(await page.eval(()=>{const a=document.querySelector('.fm-import-template button').getBoundingClientRect(),b=document.querySelector('input[type=file]').getBoundingClientRect();return Math.abs(a.bottom-b.bottom)<2&&Math.abs(a.height-b.height)<2}))
  await page.screenshot({path:out+'/import-'+width+'.png',format:'png'});await click('Cancel')
 }
 await page.setViewport({width:1440,height:900})
 for(const text of ['Add faculty','Assign students','Deactivate']) {
  await click(text);assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('dialog')).animationName),'fm-dialog-enter')
  await page.screenshot({path:out+'/'+text.replaceAll(' ','-')+'.png',format:'png'});await click('Cancel')
 }
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await click('Import faculty');assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('dialog')).animationName),'none')
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(100)
 assert.equal(await page.eval(()=>!!document.querySelector('dialog[open]')),false)
 assert.deepEqual(page.consoleErrors,[]);console.log('Popup alignment, responsive bounds, shared motion, reduced motion and Escape checks passed.')
} finally {await browser.close()}
