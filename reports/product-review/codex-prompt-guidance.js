/** Role-specific review questions and planning deliverables, keyed to the shared catalogue. */
const codexRoleGuidance = {
  executive: ['Assess business impact, release risks, unresolved decisions and investment trade-offs. Separate recommendations from actual leadership approvals; never invent budgets, owners or commitments.', 'Summarise the selected scope, benefits, risks, decision owners and approval gates. Flag budget implications with assumptions instead of unsupported estimates.'],
  'product-head': ['Compare module journeys with documented product outcomes and roadmap priorities. Identify missing user evidence, conflicting priorities and unjustified scope expansion.', 'Explain value and priority for each selected finding, dependencies on roadmap decisions and the boundary between required fixes and optional enhancements.'],
  product: ['Inventory users, entry points, happy paths, alternate paths and exit states. Trace requirements to pages and acceptance checks; assess backlog gaps and stakeholder communication.', 'Write issue-specific acceptance criteria, delivery order and stakeholder handoffs. Separate necessary work from follow-up backlog suggestions; do not enlarge the selected scope.'],
  strategy: ['Trace business rules, data meanings and cross-module handoffs. Identify ambiguous calendars, eligibility, lifecycle transitions and exceptions. Compare actual behaviour with the approved baseline and record disagreements.', 'For each ambiguity, document current behaviour, options, impacts and the decision needed. Protect the production baseline from scope creep. Do not silently choose new business rules.'],
  design: ['Inspect each page and dialog for readability, alignment, interaction feedback, empty/loading/error states, keyboard navigation, focus, labels and Medsy token consistency. Check light/dark themes and 390, 768, 1280 and 1440px layouts where applicable.', 'Specify the smallest UX correction, affected states, responsive behaviour, accessibility acceptance and before/after screenshot requirements. Preserve established patterns and avoid unrelated redesign.'],
  cto: ['Assess architecture boundaries, authentication versus client checks, institution/data isolation, production integrations, performance risks and technical feasibility. Distinguish local mock behaviour from production guarantees.', 'Identify architecture decisions and security constraints that gate the selected changes. Specify contract compatibility, deployment risks and rollback conditions without assuming unavailable infrastructure.'],
  engineering: ['Review component/service boundaries, dependency order, maintainability, operational ownership, monitoring and recovery. Identify coordination gaps and evidence needed for release.', 'Sequence the work by prerequisite and accountable role. Describe file-level changes, integration gates, recovery/rollback, support handoffs and estimate assumptions. Avoid speculative schedules.'],
  ai: ['Determine whether AI is actually used in this module. If so, assess context quality, sensitive data handling, evaluation evidence, output validation, latency/cost, failure modes and fallbacks. Otherwise record Not applicable with source-based reasoning.', 'Only propose AI changes when selected findings require them. Define evaluations, validation, fallback and usage constraints. Do not introduce AI merely because this review uses AI.'],
  backend: ['Trace data schemas, API contracts, validation, authentication/authorisation, persistence, atomic writes, stale revisions, concurrency and downstream consumers. Check failures, retries and recovery using isolated fixtures.', 'Specify request/response contracts, validation, permissions, error handling, migrations if needed, compatibility and integration tests. Identify mock-only gaps; do not claim server enforcement from frontend tests.'],
  frontend: ['Inspect routing, state ownership, forms, selection, filters, sorting, pagination, dialogs and API boundaries. Check loading, cancellation, duplicate submission, stale data, direct reload, responsive behaviour and accessibility implementation.', 'List affected components/styles/services and explain the minimal state or rendering changes. Define keyboard, focus, responsive, performance and integration regression checks; reuse existing components and tokens.'],
  qa: ['Build a page-to-journey acceptance matrix. Execute relevant tests and browser scenarios with isolated sample data; cover permissions, validation, persistence, failures, recovery and downstream regressions. Separate executed checks from source inspection and proposed tests.', 'For each finding provide setup, steps, expected result, test level, fixtures, negative cases and downstream regression scope. Define evidence needed to resolve it, including screenshots for visual defects and exact untested limitations.']
};

/** Detailed instructions only; these strings never execute reviews or change lifecycle state. */
function codexDetailedGuidance(mode) {
  const planning=mode==='plan';
  const roles=teamRoles.map(role=>{
    const guidance=codexRoleGuidance[role.id];
    return `${role.name} [${role.id}]\nReports to: ${role.parent||'User / project owner'}. Ownership: ${role.ownership}\n${guidance?.[planning?1:0]||role.output}\nRequired output: ${role.output}`;
  }).join('\n\n');
  return `ROLE-BASED ${planning?'IMPLEMENTATION PLAN':'MODULE REVIEW'}\n
Work through all 11 responsibility perspectives. These are analytical roles, not claims that 11 independent people or agents executed tests. State the actual review method. Share test evidence rather than counting the same check once per role. Specialists provide findings; Engineering Manager, Head of Product and CTO synthesise their branches; Executive summarises decisions. Preserve disagreements and uncertainty.
${roles}

${planning?`SELECTED-FINDING INVESTIGATION AND PLAN
1. Confirm the exact selected IDs, current source fingerprint and latest evidence. Resolved findings are historical context, not new fix scope. If scope or source changed, identify the difference before planning against a new baseline.
2. Reproduce each selected concern in isolated data. Record actual versus expected results, affected users/pages and supporting file/line references. A missing test or integration is not automatically a confirmed defect.
3. Identify the root cause or explicitly mark it unverified. Map upstream prerequisites and downstream consumers, contracts and failure impacts. Keep unrelated discoveries as separate recommendations.
4. Assign exactly one accountable catalogue role per finding plus relevant supporting roles. Give all 11 roles a disposition: action required, consulted or not applicable, with a reason. Do not assign unnecessary implementation tasks to every role.
5. For each finding provide: proposed files and changes; ordered steps and role handoffs; prerequisites and decisions; risks; scope exclusions; rollback/recovery; measurable acceptance; negative cases; downstream regressions; evidence to collect. Distinguish proposed tests from executed investigations.
6. Produce a consolidated dependency-ordered plan and unresolved-decision list. No application changes, production writes, releases or external communications are authorised by this planning prompt.

REQUIRED PLAN OUTPUT
A. Selected scope and current baseline.
B. Finding table: ID | classification | reproduction result | root cause/evidence | priority rationale | accountable role | supporting roles | dependencies.
C. All-role disposition table and specialist recommendations.
D. Per-finding file changes, implementation steps, acceptance matrix and rollback.
E. Cross-module impacts, remaining questions and explicit exclusions.
F. Recorded plan ID/version/fingerprint, investigation evidence and report update summary.
Keep steps and acceptance as arrays of strings for the existing renderer. Preserve prior plans in codexPlanHistory. Store additional per-finding details in findingPlans and role dispositions in roles on codexPlan. Set status Planned only for a recorded proposal, not as evidence of implementation or approval. Await explicit Yes/No approval of that exact plan; if source, IDs or scope change, obtain renewed approval.`:`END-TO-END REVIEW SEQUENCE
1. Read current repository instructions, module metadata, previous review and all open/resolved findings. Verify the snapshot against source. Inventory every module page, route, tab, dialog, user role and entry/exit point; flag missing inventory.
2. Trace the whole journey: prerequisites, create/import, read/search/filter, edit, lifecycle transitions, cancellation, validation failures, persistence/reload, history, recovery and downstream handoffs as applicable. Document unsupported paths instead of inventing them.
3. Inspect source contracts and run available relevant automated/browser checks with isolated fixtures. Record commands, environment, viewport, expected/actual results and evidence paths. Do not modify real user data or implement application fixes.
4. Recheck previously resolved findings where relevant. Preserve their evidence/history; reopen only with a reproduced regression and a reason. Distinguish confirmed bugs, potential concerns, integration gaps, decisions and pending verification.
5. Assess each role using the responsibilities above, then consolidate duplicate findings by stable ID. Document contradictions, dependencies and release blockers without asserting production readiness from local checks.

REQUIRED REVIEW OUTPUT
A. Executive conclusion, tested scope and important limitations.
B. Page/flow matrix: page/route | user role | scenario | functionality verdict | design verdict | evidence | untested cases.
C. All 11 roles: role ID | review status | evidence | finding IDs | blockers | next action. Use Not applicable only with a specific reason.
D. Dependency matrix: upstream/downstream module | contract or data | impact | verified scope | pending checks.
E. Findings: stable ID | classification | state | severity rationale | reproduction | expected/actual | accountable/supporting roles | file references | acceptance criteria.
F. Test ledger: command/scenario | date/environment | result | evidence | limitations. Separate source inspection, executed tests and proposed checks.
G. Prioritised recommendations, required product/technical decisions, report version and changed report files. Do not implement the recommendations.`}

EVIDENCE, STATUS AND HISTORY RULES
Copying a prompt never starts work or changes status. Review completion, functionality, design and implementation status are different verdicts. Do not mark unexecuted checks Passed or a whole module Complete because one finding was fixed.
Capture before/after screenshots for visual fixes only when the corresponding states were actually observed. Save PNG files beneath reports/product-review/evidence/ and attach finding.screenshots = [{label,path,alt}]; preserve prior images, dates and test records. Missing screenshots must be stated, not fabricated. The reference page embeds these images for offline viewing.
Keep resolved findings in the report with Resolved state, resolvedAt, verification evidence and historical records. For an approved implementation, progress through In progress and Pending verification; set Resolved only when acceptance checks pass. Mark affected role/page verdicts honestly and retain pending checks.
Do not infer approval, fabricate named owners, budgets, production guarantees or independent-agent execution. Report updates are allowed in review/planning; application fixes require the separately approved implementation scope.`;
}
