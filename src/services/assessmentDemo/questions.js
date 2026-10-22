/** Representative question-bank records used only by the local assessment demo adapter. */
export function demoQuestions(kind = 'Hybrid', long = false) {
  const mcqs = [
    ['Which chamber pumps oxygenated blood into the systemic circulation?', ['Right atrium','Left ventricle','Right ventricle','Left atrium'], 'b'],
    ['Which cell carries oxygen in the blood?', ['Platelet','Neutrophil','Red blood cell','Lymphocyte'], 'c'],
    ['Which organ produces bile?', ['Liver','Spleen','Kidney','Lung'], 'a'],
    ['Which structure connects muscle to bone?', ['Ligament','Cartilage','Tendon','Nerve'], 'c'],
  ].map(([questionText, labels, correct], index) => ({
    id:`demo-mcq-${index+1}`,code:`DEMO-MCQ-${index+1}`,type:'MCQ',previewSectionKey:'MCQ',questionText,marks:1,
    options:labels.map((label,i)=>({id:String.fromCharCode(97+i),label})),correctOptionIds:[correct],
    explanation:`The correct option is ${correct.toUpperCase()}.`,subject:'Physiology',topic:'Foundations',
    questionCategory:index%2?'Application':'Direct Comprehension',cognitiveLevel:index%2?'Apply':'Remember',
    thinkingLevel:index%2?'HoT - Higher Order Thinking':'LoT - Lower Order Thinking',skillFocus:'Knowledge',competencies:['PY1.1'],
  }))
  const topics = [
    ['Describe the function of red blood cells.','Red blood cells transport oxygen using haemoglobin and carry carbon dioxide back to the lungs.'],
    ['Explain the role of the heart in circulation.','The heart pumps blood through pulmonary and systemic circulation, supplying oxygen and nutrients to tissues.'],
    ['Describe the main functions of the kidneys.','The kidneys filter blood, remove waste, regulate fluid and electrolyte balance and maintain acid base balance.'],
    ['Explain the role of informed consent.','Informed consent requires a clear explanation, understanding, voluntary agreement and an opportunity to ask questions.'],
    ['Describe effective communication with a patient.','Listen actively, use clear language, show empathy, check understanding and respect confidentiality.'],
  ]
  const descriptive = Array.from({length:long?30:4},(_,i)=>{
    const [questionText,modelAnswer]=topics[i%topics.length]
    return {id:`demo-desc-${i+1}`,code:`DEMO-DESC-${i+1}`,type:'Descriptive Question',previewSectionKey:i<(long?10:2)?'SAQs':'LAQs',
      questionText:long?`Case ${i+1}: ${questionText}`:questionText,marks:5,modelAnswer,answerKey:modelAnswer,
      subject:'Physiology',topic:'Foundations',questionCategory:'Application',cognitiveLevel:'Understand',
      thinkingLevel:'LoT - Lower Order Thinking',skillFocus:'Communication',competencies:['PY1.1'],
    }
  })
  if (!long) descriptive[3] = {...descriptive[3],marks:10,descriptiveSections:[
    {id:'part-i',questionText:'List the components of informed consent.',marks:5,modelAnswer:topics[3][1]},
    {id:'part-ii',questionText:'Describe how to check patient understanding.',marks:5,modelAnswer:topics[4][1]},
  ]}
  return kind==='MCQ'?mcqs:kind==='Descriptive'?descriptive:[...mcqs,...descriptive]
}
export const DEMO_STUDENTS = [
  {id:'MC2568',name:'Karthik Subramanian',attendance:'P'},
  {id:'MV1253',name:'Aarav Menon',attendance:'P'},
  {id:'MV1254',name:'Meera Krishnan',attendance:'P'},
  {id:'MV1255',name:'Rohit Sharma',attendance:'P'},
  {id:'MV1256',name:'Sara Joseph',attendance:'A'},
]
