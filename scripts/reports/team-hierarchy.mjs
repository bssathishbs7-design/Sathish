/** Shared browser/server role catalogue. Order below is display order, not execution order. */
export const hierarchyVersion = '1.1';
export const teamRoles = [
  {id:'executive',name:'Executive / Leadership reviewer',parent:null,group:'Leadership',level:1,ownership:'Consolidate business and technical recommendations, investment options, risks and decisions requiring your approval.',output:'Executive summary, trade-offs and unresolved decisions.'},
  {id:'product-head',name:'Head of Product & Strategy',parent:'executive',group:'Product & Strategy',level:2,ownership:'Align business development, user needs, product-market fit, roadmap and measurable outcomes.',output:'Product synthesis with priorities, scope and value rationale.'},
  {id:'product',name:'Product Manager',parent:'product-head',group:'Product & Strategy',level:3,ownership:'Define module outcomes, backlog, prioritisation, dependencies and acceptance criteria. Own stakeholder communication.',output:'Prioritised requirements and stakeholder summary.'},
  {id:'strategy',name:'Lead Business Strategist / Senior BA',parent:'product-head',group:'Product & Strategy',level:3,ownership:'Resolve ambiguity, map end-to-end flows, protect baseline scope and assess budget impact. Challenge unsupported assumptions and maintain decision records.',output:'Flow gaps, baseline boundaries, options and clarification questions.'},
  {id:'design',name:'Principal UI/UX Designer',parent:'product-head',group:'Product & Strategy',level:3,ownership:'Review journeys, page states, responsive layouts, accessibility and Medsy design consistency.',output:'Page-wise UX findings and design acceptance checks.'},
  {id:'cto',name:'VP of Engineering / CTO',parent:'executive',group:'Engineering & Delivery',level:2,ownership:'Review technical strategy, architecture, security, feasibility and delivery risk.',output:'Technical synthesis, architecture decisions and risk assessment.'},
  {id:'engineering',name:'Engineering Manager / Tech Lead',parent:'cto',group:'Engineering & Delivery',level:3,ownership:'Sequence specialist recommendations, dependencies and verification gates. Own operational readiness, support and technical handoffs.',output:'Delivery sequence, dependencies, recovery ownership and estimate assumptions.'},
  {id:'ai',name:'AI / ML Team Lead',parent:'engineering',group:'Engineering & Delivery',level:4,optional:true,ownership:'Review AI workflows, context quality, model suitability, evaluations, fallback behaviour and usage cost.',output:'AI evaluation criteria, fallback and cost considerations.'},
  {id:'backend',name:'Full-stack / Backend Lead',parent:'engineering',group:'Engineering & Delivery',level:4,ownership:'Review APIs, data contracts, permissions, persistence, integrations, monitoring and recovery.',output:'API/data boundaries, permissions and operational checks.'},
  {id:'frontend',name:'Frontend Lead',parent:'engineering',group:'Engineering & Delivery',level:4,ownership:'Review components, UI state, interactions, performance, accessibility implementation and API integration.',output:'Frontend changes, state coverage and integration checks.'},
  {id:'qa',name:'QA / Test Lead',parent:'engineering',group:'Engineering & Delivery',level:4,ownership:'Define end-to-end, regression, permission, API and browser checks. Separate verified evidence from pending checks; include recovery and support scenarios.',output:'Acceptance matrix, verification gaps and regression coverage.'}
];
/** Specialists precede their leads; executive synthesis receives both branches. */
export function rolesForRequest(request={}) {
  const ids=['product','strategy','design',...((request.includeAI||request.kind==='review')?['ai']:[]),'backend','frontend','qa','engineering','product-head','cto','executive'];
  return ids.map(id=>teamRoles.find(role=>role.id===id));
}
