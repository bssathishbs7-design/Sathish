import fs from 'node:fs';
const file='src/pages/AssessmentCreatePage.jsx';
let source=fs.readFileSync(file,'utf8');
source=source.replace("import AssessmentTrackerCard from '../components/AssessmentTrackerCard'", "import AssessmentTrackerCard from '../components/AssessmentTrackerCard'\nimport AssessmentViewMenu, { readAssessmentView } from '../components/AssessmentViewMenu'\nimport AssessmentCardCollection from '../components/AssessmentCardCollection'");
source=source.replace('  const [isCreatingAssessment, setIsCreatingAssessment]', '  const [cardView, setCardView] = useState(readAssessmentView)\n  const compactCards = [\'medium\', \'small\', \'details\'].includes(cardView)\n  const [isCreatingAssessment, setIsCreatingAssessment]');
source=source.replaceAll('<AssessmentTrackerCard ', '<AssessmentTrackerCard view={cardView} ');
source=source.replaceAll('<AssessmentCardSettings assessment=', '<AssessmentCardSettings compact={compactCards} assessment=');
source=source.replace('      {(hasPublishedSearch || hasPublishedFilter) ? (', '      <AssessmentViewMenu value={cardView} onChange={setCardView} />\n      {(hasPublishedSearch || hasPublishedFilter) ? (');
let count=0;
const opening='<div className="assessment-create-draft-grid">';
while(source.includes(opening)){
 const start=source.indexOf(opening);let depth=1,end;
 const tags=/<\/?div\b[^>]*>/g;tags.lastIndex=start+opening.length;
 for(let tag;(tag=tags.exec(source));){depth+=tag[0].startsWith('</')?-1:1;if(depth===0){end=tag.index;break;}}
 if(end===undefined)throw Error('Unbalanced collection');
 source=source.slice(0,start)+'<AssessmentCardCollection view={cardView}>'+source.slice(start+opening.length,end)+'</AssessmentCardCollection>'+source.slice(end+6);count++;
}
if(count!==5)throw Error(`Expected five collections, found ${count}`);
fs.writeFileSync(file,source);
console.log(`Updated ${count} tab collections`);
