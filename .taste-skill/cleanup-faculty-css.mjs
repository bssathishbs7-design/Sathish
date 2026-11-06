import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)])
const old=fs.readFileSync('.taste-skill/previous-faculty.txt','utf8')
const names=new Set(old.match(/faculty-[a-z0-9-]+/g)||[])
const source=walk('src').filter(p=>/\.(jsx|js)$/.test(p)).map(p=>fs.readFileSync(p,'utf8')).join('\n')
const unused=new Set([...names].filter(n=>!source.includes(n)))
const report=[]
for(const file of walk('src').filter(p=>p.endsWith('.css'))) {
 const original=fs.readFileSync(file,'utf8')
 if(![...unused].some(n=>original.includes('.'+n)))continue
 const root=postcss.parse(original),removed=[]
 root.walkRules(rule=>{
   const keep=rule.selectors.filter(selector=>{
     const dead=[...selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].some(m=>unused.has(m[1]))
     if(!dead)return true
     if(/:(?:is|where|not|has)\(/.test(selector))return true
     removed.push(selector);return false
   })
   if(!keep.length)rule.remove()
   else if(keep.length!==rule.selectors.length)rule.selectors=keep
 })
 root.walkAtRules(at=>{if(at.nodes&&!at.nodes.length)at.remove()})
 if(removed.length) {fs.writeFileSync(file,root.toString());report.push({file,selectors:removed.length})}
}
console.log(JSON.stringify({unused:[...unused],changes:report},null,2))

