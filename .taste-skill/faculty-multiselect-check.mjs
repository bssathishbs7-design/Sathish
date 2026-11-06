import { Browser, sleep } from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try {
 const page=await browser.newPage({width:1440,height:900})
 await page.goto('http://127.0.0.1:5173/faculty-management')
 await page.eval(()=>[...document.querySelectorAll('.fm-workspace button')].find(b=>b.textContent.trim()==='Add faculty').click());await sleep(500)
 assert.equal(await page.eval(()=>document.querySelectorAll('.management-multi-options').length),0)
 await page.eval(()=>document.querySelector('.management-multi-trigger').click());await sleep(100)
 await page.eval(()=>{const boxes=document.querySelectorAll('.management-multi-options input');boxes[0].click();boxes[1].click()});await sleep(100)
 assert.equal(await page.eval(()=>document.querySelectorAll('.management-multi-options input:checked').length),2)
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(100)
 assert.equal(await page.eval(()=>!!document.querySelector('dialog[open]')),true)
 assert.equal(await page.eval(()=>document.querySelector('.management-multi-trigger').getAttribute('aria-expanded')),'false')
 assert.ok(await page.eval(()=>document.querySelector('.management-multi-trigger').textContent.includes('2 selected')))
 await page.screenshot({path:'.taste-skill/faculty-subject-dropdown.png',format:'png'})
 await page.setViewport({width:390,height:900});await page.eval(()=>document.querySelector('.management-multi-trigger').click());await sleep(200)
 assert.ok(await page.eval(()=>document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth))
 await page.screenshot({path:'.taste-skill/faculty-subject-dropdown-mobile.png',format:'png'})
 assert.deepEqual(page.consoleErrors,[]);console.log('Subject multiselect: selection, summary, Escape, retained dialog and mobile bounds passed.')
}finally{await browser.close()}
