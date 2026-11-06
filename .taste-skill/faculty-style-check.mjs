import { Browser, sleep } from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const out='.taste-skill/faculty-restyle';mkdirSync(out,{recursive:true})
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1440,height:1000})
 await page.goto('http://127.0.0.1:5173/student-management');await sleep(400)
 await page.screenshot({path:out+'/student-reference.png',format:'png'})
 await page.goto('http://127.0.0.1:5173/faculty-management');await sleep(400)
 await page.screenshot({path:out+'/faculty-desktop.png',format:'png'})
 const click=async text=>{await page.eval(text=>[...document.querySelectorAll('.fm-workspace button')].find(b=>b.textContent.trim()===text).click(),text);await sleep(200)}
 await click('Filters');await page.screenshot({path:out+'/faculty-filters.png',format:'png'})
 await click('Add faculty');await page.screenshot({path:out+'/faculty-editor.png',format:'png'})
 assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('dialog select')).appearance),'none')
 await click('Cancel')
 const checks=[]
 for(const width of [390,768,1024,1440]) {
  await page.setViewport({width,height:900});await sleep(200)
  assert.ok(await page.eval(()=>document.documentElement.scrollWidth<=innerWidth+1))
  await click('Add faculty')
  assert.ok(await page.eval(()=>{const r=document.querySelector('dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}))
  await page.screenshot({path:out+'/dialog-'+width+'.png',format:'png'});await click('Cancel')
  await page.screenshot({path:out+'/page-'+width+'.png',format:'png'});checks.push(width)
 }
 await page.eval(()=>document.querySelector('button[aria-label="Theme"]').click());await sleep(250)
 await page.screenshot({path:out+'/faculty-dark.png',format:'png'})
 assert.deepEqual(page.consoleErrors,[])
 writeFileSync(out+'/results.json',JSON.stringify({widths:checks,consoleErrors:page.consoleErrors},null,2))
 console.log('Responsive page/dialog and styled dropdown checks passed at '+checks.join(', '))
} finally {await browser.close()}
