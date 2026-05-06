# Graph Report - C:\Users\BLUE SILICON\Documents\GitHub\Sathish  (2026-05-05)

## Corpus Check
- 41 files · ~59,551 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 379 nodes · 469 edges · 44 communities (37 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Dashboard Metrics|Dashboard Metrics]]
- [[_COMMUNITY_Evaluation Data Builders|Evaluation Data Builders]]
- [[_COMMUNITY_Approval Export Review|Approval Export Review]]
- [[_COMMUNITY_Skill Form Builder|Skill Form Builder]]
- [[_COMMUNITY_App Routing State|App Routing State]]
- [[_COMMUNITY_Completion Export Flow|Completion Export Flow]]
- [[_COMMUNITY_Approval Summary Views|Approval Summary Views]]
- [[_COMMUNITY_Student Exam Flow|Student Exam Flow]]
- [[_COMMUNITY_Page Experience Layer|Page Experience Layer]]
- [[_COMMUNITY_Image Authoring Flow|Image Authoring Flow]]
- [[_COMMUNITY_Activity PDF Reporting|Activity PDF Reporting]]
- [[_COMMUNITY_Result Reporting Flow|Result Reporting Flow]]
- [[_COMMUNITY_App Shell Navigation|App Shell Navigation]]
- [[_COMMUNITY_Approval Decision Review|Approval Decision Review]]
- [[_COMMUNITY_Exam Audit Log|Exam Audit Log]]
- [[_COMMUNITY_Skill Activity Analytics|Skill Activity Analytics]]
- [[_COMMUNITY_Social Icon Sprite|Social Icon Sprite]]
- [[_COMMUNITY_Domain Badge Control|Domain Badge Control]]
- [[_COMMUNITY_Tooling Scaffold|Tooling Scaffold]]
- [[_COMMUNITY_Robot Favicon|Robot Favicon]]
- [[_COMMUNITY_Brand Logo System|Brand Logo System]]
- [[_COMMUNITY_Embedded Photo Crops|Embedded Photo Crops]]
- [[_COMMUNITY_Hero Layer Illustration|Hero Layer Illustration]]
- [[_COMMUNITY_Assessment Seed Data|Assessment Seed Data]]
- [[_COMMUNITY_Learning Domain Taxonomy|Learning Domain Taxonomy]]
- [[_COMMUNITY_Brand Mark System|Brand Mark System]]
- [[_COMMUNITY_Vite Logo Badge|Vite Logo Badge]]
- [[_COMMUNITY_People Admin Screens|People Admin Screens]]
- [[_COMMUNITY_HTML Mount Point|HTML Mount Point]]
- [[_COMMUNITY_React Branding|React Branding]]
- [[_COMMUNITY_Dark Brand Logo|Dark Brand Logo]]

## God Nodes (most connected - your core abstractions)
1. `ApprovalViewPage()` - 14 edges
2. `ReviewApproveCard()` - 9 edges
3. `StartEvaluationPage()` - 7 edges
4. `normalizeLower()` - 6 edges
5. `EvaluationCard()` - 6 edges
6. `Top Level App Shell Orchestrator` - 6 edges
7. `Icons SVG Sprite Sheet` - 6 edges
8. `buildEvaluationRecordFromAssignment()` - 5 edges
9. `App()` - 5 edges
10. `ProgressTrackingPage()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `React Vite Starter Template` --conceptually_related_to--> `Vite React Plugin Setup`  [INFERRED]
  README.md → vite.config.js
- `React Vite Starter Template` --conceptually_related_to--> `React Vite ESLint Rules`  [INFERRED]
  README.md → eslint.config.js
- `React Root Mount` --references--> `HTML Root Shell`  [EXTRACTED]
  src/main.jsx → index.html
- `Activity Result Page` --shares_data_with--> `Completed Evaluation Page`  [INFERRED]
  src/pages/ActivityResultPage.jsx → src/pages/CompletedEvaluationPage.jsx
- `Faculty Management Page` --semantically_similar_to--> `Student Management Page`  [INFERRED] [semantically similar]
  src/pages/FacultyManagementPageV2.jsx → src/pages/StudentManagementPage.jsx

## Hyperedges (group relationships)
- **Evaluation Lifecycle** — skillassessmentpage_skill_assessment_page, startevaluationpage_start_evaluation_page, completedevaluationpage_completed_evaluation_page, approvalviewpage_approval_view_page, activityresultpage_activity_result_page [INFERRED 0.84]
- **Authoring And Delivery Flow** — skillmanagementpage_skill_management_page, imageactivitypage_image_activity_page, ospeactivitypage_ospe_activity_page, studentexampage_student_exam_page [INFERRED 0.80]
- **Approval Queue Flow** — completedevaluationpage_completed_evaluation_page, reviewapprovepage_review_approve_page, approvalviewpage_approval_view_page [INFERRED 0.82]
- **Application Shell Layout** — app_shell_orchestrator, navbar_shell_header, sidebar_navigation_rail [EXTRACTED 1.00]
- **Navigation Metadata Bundle** — apppages_page_registry, apppages_navigation_groups, apppages_sidebar_menu_config [EXTRACTED 1.00]
- **Learning Domain Badge System** — domainbadgerow_domain_selector, domainheaderbadges_domain_summary, domainbadgerow_learning_domain_taxonomy [INFERRED 0.94]
- **Favicon Icon Composition** — favicon_favicon, favicon_robot_face, favicon_circular_badge, favicon_antenna_dot [EXTRACTED 0.75]
- **Brand Logo Composition** — brand-logo_logo_asset, brand-logo_circular_emblem, brand-logo_wordmark, brand-logo_circular_mark [INFERRED 0.75]
- **Brand Mark Components** — brand-mark_brand_mark, brand-mark_circular_emblem, brand-mark_horizontal_wordmark [EXTRACTED 0.75]
- **Photo Reused Across Two Crops** — group_1_embedded_photo, group_1_circular_portrait_crop, group_1_wide_photo_crop [INFERRED 0.75]
- **Layered Composition** — hero_stacked_layers_illustration, hero_top_rounded_square_layer, hero_bottom_rounded_square_layer, hero_center_rectangular_panel [EXTRACTED 0.75]
- **Vite Logo in Parentheses** — vite_left_parenthesis, vite_vite_logo, vite_right_parenthesis [INFERRED 0.75]

## Communities (44 total, 7 thin omitted)

### Community 0 - "Dashboard Metrics"
Cohesion: 0.08
Nodes (19): clampPercent(), collectActivityItems(), DashboardSummaryPage(), downloadCsv(), formatResultLabel(), formatThresholdLabel(), getActivitySource(), getItemDomains() (+11 more)

### Community 1 - "Evaluation Data Builders"
Cohesion: 0.09
Nodes (16): buildCompletedEvaluationRow(), buildCompletedSectionStats(), buildEvaluationItems(), buildStudentRoster(), calculatePercentage(), formatDate(), formatMarksValue(), getActivityTypeTone() (+8 more)

### Community 2 - "Approval Export Review"
Cohesion: 0.12
Nodes (18): ApprovalViewPage(), downloadCsv(), formatDateTime(), formatMarks(), formatPercent(), getActivityToneClass(), getDisplayApprovalStatus(), getSectionLabel() (+10 more)

### Community 3 - "Skill Form Builder"
Cohesion: 0.09
Nodes (4): FormCard(), getFormPromptText(), getFormTypeMeta(), getVisibleFormResponses()

### Community 4 - "App Routing State"
Cohesion: 0.12
Nodes (12): App(), buildEvaluationRecordFromAssignment(), estimateStudentCount(), getAssignmentQuestionCount(), getLatestActivityResultRows(), getReattemptRows(), isAssignmentCertifiable(), parseAssignmentTarget() (+4 more)

### Community 5 - "Completion Export Flow"
Cohesion: 0.12
Nodes (9): buildSimplePdf(), CompletedEvaluationPage(), downloadCsv(), downloadPdf(), escapePdfText(), isActivityCertifiable(), normalizePdfText(), sanitizeFileName() (+1 more)

### Community 6 - "Approval Summary Views"
Cohesion: 0.14
Nodes (15): buildFallbackRecords(), EvaluationCard(), formatDisplayDate(), getActivityTypeTone(), getApprovalAttemptLabel(), getApprovalStatus(), getCompletedRowStatus(), getEvaluationStatusMeta() (+7 more)

### Community 7 - "Student Exam Flow"
Cohesion: 0.15
Nodes (7): formatQuestionCountLabel(), formatRemainingTime(), getAlphabetTag(), getItemTypeBadgeConfig(), isActivityCertifiable(), normalizeReferenceImage(), StudentExamPage()

### Community 8 - "Page Experience Layer"
Cohesion: 0.18
Nodes (16): Activity Result Page, Approval View Page, Completed Evaluation Page, Dashboard Summary Page, Exam Log Page, Image Activity Page, Interpretation Activity Page, My Skill Activity Page (+8 more)

### Community 10 - "Activity PDF Reporting"
Cohesion: 0.24
Nodes (11): buildSimplePdf(), downloadPdf(), escapePdfText(), formatDisplayDate(), formatMarks(), formatPercent(), getTypeToneClass(), normalizePdfText() (+3 more)

### Community 11 - "Result Reporting Flow"
Cohesion: 0.19
Nodes (5): ActivityResultPage(), downloadCsv(), formatPercent(), normalizeCsvText(), sanitizeFileName()

### Community 12 - "App Shell Navigation"
Cohesion: 0.22
Nodes (13): Approval Queue Workflow, Session Storage Persistence Layer, Top Level App Shell Orchestrator, Skills and My Skills Page Groups, Application Page Registry, Sidebar Menu Metadata, Profile Menu Actions, Application Shell Header (+5 more)

### Community 13 - "Approval Decision Review"
Cohesion: 0.33
Nodes (9): formatReceivedDateTime(), getActivityMeta(), getActivityToneClass(), getAttemptValue(), getDecisionTone(), getDisplayDecision(), getSenderDetails(), ReviewApproveCard() (+1 more)

### Community 14 - "Exam Audit Log"
Cohesion: 0.38
Nodes (3): buildExamRows(), ExamLogPage(), formatValue()

### Community 15 - "Skill Activity Analytics"
Cohesion: 0.38
Nodes (3): isLiveReadyActivity(), normalizeLower(), normalizeText()

### Community 16 - "Social Icon Sprite"
Cohesion: 0.29
Nodes (7): Bluesky, Discord, Documentation, GitHub, Social, Icons SVG Sprite Sheet, X

### Community 20 - "Tooling Scaffold"
Cohesion: 0.5
Nodes (4): React Vite ESLint Rules, React Compiler Installation Guidance, React Vite Starter Template, Vite React Plugin Setup

### Community 21 - "Robot Favicon"
Cohesion: 0.5
Nodes (4): Antenna Dot, Circular Badge, Favicon, Robot Face Icon

### Community 22 - "Brand Logo System"
Cohesion: 0.67
Nodes (4): Circular Emblem, Small Circular Mark, Brand Logo Asset, Wordmark

### Community 23 - "Embedded Photo Crops"
Cohesion: 1.0
Nodes (4): Circular Portrait Crop, Embedded Photo, group-1 SVG Asset, Wide Photo Crop

### Community 24 - "Hero Layer Illustration"
Cohesion: 0.83
Nodes (4): Bottom Rounded Square Layer, Center Rectangular Panel, Stacked Layers Illustration, Top Rounded Square Layer

### Community 27 - "Learning Domain Taxonomy"
Cohesion: 1.0
Nodes (3): Learning Domain Selector Row, Cognitive Affective Psychomotor Taxonomy, Learning Domain Header Badges

### Community 28 - "Brand Mark System"
Cohesion: 1.0
Nodes (3): Brand Mark, Circular Emblem, Horizontal Wordmark

### Community 29 - "Vite Logo Badge"
Cohesion: 0.67
Nodes (3): Left Parenthesis, Right Parenthesis, Vite Logo

## Ambiguous Edges - Review These
- `My Skill Activity Page` → `Progress Tracking Page`  [AMBIGUOUS]
  src/pages/MySkillActivityPage.jsx · relation: conceptually_related_to
- `Approval Dispatch Modal` → `Approval Queue Workflow`  [AMBIGUOUS]
  src/components/SendApprovalModal.jsx · relation: conceptually_related_to

## Knowledge Gaps
- **26 isolated node(s):** `Exam Log Page`, `Faculty Management Page`, `Review Approve Page`, `Student Management Page`, `Profile Menu Actions` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `My Skill Activity Page` and `Progress Tracking Page`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Approval Dispatch Modal` and `Approval Queue Workflow`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What connects `Exam Log Page`, `Faculty Management Page`, `Review Approve Page` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Metrics` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Evaluation Data Builders` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Approval Export Review` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Skill Form Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._