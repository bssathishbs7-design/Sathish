import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
const suites = {
  'student-management':['studentManagement','studentCalendar','studentImport','studentPromotionForm'],
  'faculty-management':['facultyManagement'], skills:['skillIdentity','skillLogbook'],
  logbook:['logbook','logbookFlow'], assessment:['assessmentIdentity','assessmentResultWorkflow','assessmentResultRelease'],
  'question-bank':['../utils/questionBankIdentity','../utils/questionBankSort'], practice:['practiceOverview','practiceShareSync'],
  approvals:['approvalQueue'], correlation:['competencyAnalytics'],
  'student-skills':['skillLogbook'], 'student-logbook':['logbook'], 'student-assessment':['assessmentResultRelease']
};
/** Fixed repository suites only; no model-supplied commands, credentials or production storage. */
export async function runModuleTests({root,moduleId,signal}) {
  const files=(suites[moduleId]||[]).map(name=>path.posix.normalize(`src/services/${name}.test.js`));
  const pending=['Browser journeys, visual design, accessibility and production API integration remain pending verification.'];
  if(!files.length)return {status:'Pending verification',files:[],limitations:pending,reason:'No approved automated suite is mapped to this module.'};
  if(files.some(file=>!fs.existsSync(path.join(root,file))))return {status:'Blocked',files,limitations:pending,reason:'A mapped test file is unavailable.'};
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'medsy-review-'));
  const startedAt=new Date().toISOString();
  try {
    fs.cpSync(path.join(root,'src'),path.join(directory,'src'),{recursive:true,filter:source=>!fs.lstatSync(source).isSymbolicLink()});
    fs.writeFileSync(path.join(directory,'package.json'),'{"type":"module"}');
    return await new Promise(resolve=>{
      let output='',settled=false,timedOut=false;
      const finish=(status,reason,exitCode=null)=>{if(settled)return;settled=true;clearTimeout(timer);resolve({status,reason,exitCode,files,startedAt,finishedAt:new Date().toISOString(),output,limitations:pending,scope:'Automated service tests on a temporary source copy with sample data; not a page-level pass.'});};
      const child=spawn(process.execPath,['--permission',`--allow-fs-read=${directory}`,`--allow-fs-write=${directory}`,'--test','--test-isolation=none','--test-reporter=tap',...files],{cwd:directory,windowsHide:true,signal,env:{SystemRoot:process.env.SystemRoot||'',TEMP:directory,TMP:directory,HOME:directory,USERPROFILE:directory}});
      const timer=setTimeout(()=>{timedOut=true;child.kill();},60000);
      for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output=(output+chunk.toString()).slice(-40000);});
      child.on('error',error=>finish('Blocked',error.name==='AbortError'?'Test execution cancelled.':'Local test process could not start.'));
      child.on('close',code=>finish(timedOut||signal?.aborted?'Blocked':code===0&&/# tests [1-9]/.test(output)?'Verified pass':/ERR_MODULE_NOT_FOUND|ERR_ACCESS_DENIED|Cannot find package/.test(output)||code===0?'Blocked':'Verified fail',timedOut?'Test execution exceeded 60 seconds.':signal?.aborted?'Test execution cancelled.':code===0?'Mapped service tests passed.':'Mapped service test command failed; inspect the captured output.',code));
    });
  } catch {return {status:'Blocked',files,startedAt,limitations:pending,reason:'Could not prepare or execute isolated tests.'};}
  finally {fs.rmSync(directory,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
}
