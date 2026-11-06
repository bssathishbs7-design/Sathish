/** Preserve every specialist concern and disagreement instead of letting synthesis silently discard it. */
export function consolidateReview(steps) {
  const completed=steps.filter(step=>step.result);
  const final=structuredClone(completed.at(-1).result);
  final.questions=[...new Set(completed.map(s=>s.result.questions.trim()).filter(Boolean))].join('\n\n');
  final.disagreements=[];
  for(const page of final.pages){
    const matching=completed.flatMap(step=>step.result.pages.filter(p=>p.pageId===page.pageId).map(p=>({step,page:p})));
    const findings=new Map();
    for(const {step,page:source} of matching)for(const finding of source.findings){
      const key=[finding.area,finding.existingFindingId||finding.title.trim().toLowerCase(),finding.classification].join('|');
      if(!findings.has(key))findings.set(key,{...finding,contributors:[],evidenceNotes:[],recommendations:[]});
      const entry=findings.get(key);entry.contributors.push(step.worker);
      if(!entry.evidenceNotes.includes(finding.evidence))entry.evidenceNotes.push(finding.evidence);
      if(!entry.recommendations.includes(finding.recommendation))entry.recommendations.push(finding.recommendation);
      if(['Low','Medium','High'].indexOf(finding.severity)>['Low','Medium','High'].indexOf(entry.severity))entry.severity=finding.severity;
    }
    page.findings=[...findings.values()].map((f,index)=>({...f,id:`${page.pageId}-F${index+1}`,evidence:f.evidenceNotes.join('\n'),recommendation:f.recommendations.join('\n')}));
    for(const area of ['functionality','design']){
      const values=[...new Set(matching.map(m=>m.page[area]))];
      if(values.length>1)final.disagreements.push({pageId:page.pageId,area,assessments:matching.map(m=>({role:m.step.worker,verdict:m.page[area]}))});
      if(values.includes('Potential issue'))page[area]='Potential issue';
      else if(values.includes('Needs verification'))page[area]='Needs verification';
    }
  }
  return final;
}
