import {browser,pause} from './cdp.mjs';const b=await browser();const ev=async s=>{const r=await b.evaluate(s);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
await ev("[...document.querySelectorAll('.assessment-create-tab')].find(b=>b.textContent.endsWith('Evaluation')).click()");
await ev("window.__pdfCapture=[];window.__originalCreate=URL.createObjectURL;window.__originalClick=HTMLAnchorElement.prototype.click;URL.createObjectURL=function(blob){if(blob.type==='application/pdf')blob.text().then(text=>window.__pdfCapture.push(text));return window.__originalCreate.call(this,blob)};HTMLAnchorElement.prototype.click=function(){if(!this.download.endsWith('.pdf'))window.__originalClick.call(this)}");
try{
for(const type of ['MCQ','Descriptive','Hybrid']){
const found=await ev(`(()=>{const c=[...document.querySelectorAll('.assessment-tracker-card')].find(c=>c.querySelector('[data-exam-type]')?.dataset.examType==='${type}' && c.textContent.includes('Online'));if(!c)return false;c.querySelector('.assessment-create-published-download-btn').click();return true})()`);if(!found)throw Error(type+' card missing');
for(let i=0;i<80;i++){if(await ev("!document.querySelector('.assessment-pdf-spinner')"))break;await pause(150);}
console.log({type,...await ev("(()=>{const t=window.__pdfCapture.at(-1)||'';return{validPdf:t.startsWith('%PDF-'),pages:(t.match(/\\/Type \\/Page /g)||[]).length,bytes:t.length,answerLabels:/Answer key|Correct answer|Explanation:|Student response/i.test(t)}})()")});
}
}finally{await ev("URL.createObjectURL=window.__originalCreate;HTMLAnchorElement.prototype.click=window.__originalClick");b.close();}
