import {Browser,sleep} from 'file:///C:/Users/Medsy/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs'
import assert from 'node:assert/strict'
const browser=await Browser.launch()
try{
 const page=await browser.newPage({width:390,height:844});await page.goto('http://127.0.0.1:5173/skills/configuration')
 await page.eval(async()=>{const React=await import('/node_modules/.vite/deps/react.js');const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');const {default:Badge}=await import('/src/components/InstructionBadge.jsx');const host=document.createElement('div');host.style.cssText='position:fixed;top:80px;left:16px;z-index:5000';document.body.append(host);createRoot(host).render(React.default.createElement(Badge))});await sleep(300)
 await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(300)
 assert.equal(await page.eval(()=>document.querySelector('.instruction-popover').dataset.side),'below')
 assert.ok(await page.eval(()=>{const r=document.querySelector('.instruction-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}))
 await page.screenshot({path:'.taste-skill/activity-instructions-mobile-isolated.png',format:'png'})
 await page.eval(()=>document.querySelector('.instruction-popover-head button').click());await sleep(100)
 assert.equal(await page.eval(()=>document.querySelector('.instruction-popover').matches(':popover-open')),false)
 await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 await page.eval(()=>document.querySelector('.instruction-badge').click());await sleep(100)
 assert.equal(await page.eval(()=>getComputedStyle(document.querySelector('.instruction-popover')).animationName),'none')
 await page.send('Input.dispatchMouseEvent',{type:'mousePressed',x:380,y:800,button:'left',clickCount:1});await page.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:380,y:800,button:'left',clickCount:1});await sleep(100)
 assert.equal(await page.eval(()=>document.querySelector('.instruction-popover').matches(':popover-open')),false)
 assert.deepEqual(page.consoleErrors,[]);console.log('Isolated mobile, Close, outside click and reduced motion passed')
}finally{await browser.close()}
