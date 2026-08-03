param(
  [string]$OutputPath = (Join-Path (Split-Path $PSScriptRoot -Parent) 'My_Assessment_Protected_Exam_Flow_and_Restrictions.docx')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Escape-Xml([string]$Value) {
  if ($null -eq $Value) { return '' }
  return [System.Security.SecurityElement]::Escape($Value)
}

function Add-Paragraph {
  param(
    [System.Collections.Generic.List[string]]$Parts,
    [string]$Text,
    [ValidateSet('Title','Subtitle','H1','H2','Body','Bullet','Number','Note','Caption')]
    [string]$Kind = 'Body',
    [switch]$PageBreakBefore
  )

  $size = 21
  $bold = ''
  $color = '263B4A'
  $before = 0
  $after = 100
  $indent = 0
  $align = 'left'
  $shade = ''
  $border = ''
  $prefix = ''

  switch ($Kind) {
    'Title'    { $size = 38; $bold = '<w:b/>'; $color = '006D66'; $after = 180; $align = 'center' }
    'Subtitle' { $size = 24; $bold = '<w:b/>'; $color = '4C6372'; $after = 120; $align = 'center' }
    'H1'       { $size = 28; $bold = '<w:b/>'; $color = '006D66'; $before = 140; $after = 70 }
    'H2'       { $size = 23; $bold = '<w:b/>'; $color = '234B63'; $before = 80; $after = 55 }
    'Bullet'   { $indent = 360; $after = 65; $prefix = '- ' }
    'Number'   { $indent = 360; $after = 65 }
    'Note'     { $size = 20; $bold = '<w:b/>'; $color = '7A4A00'; $after = 90; $indent = 180; $shade = '<w:shd w:fill="FFF6DD"/>'; $border = '<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="E5A100"/></w:pBdr>' }
    'Caption'  { $size = 18; $color = '647681'; $after = 70; $align = 'center' }
  }

  $break = if ($PageBreakBefore) { '<w:pageBreakBefore/>' } else { '' }
  $xmlText = Escape-Xml("$prefix$Text")
  $Parts.Add("<w:p><w:pPr>$break<w:spacing w:before='$before' w:after='$after'/>$border$shade<w:ind w:left='$indent'/><w:jc w:val='$align'/></w:pPr><w:r><w:rPr>$bold<w:color w:val='$color'/><w:sz w:val='$size'/><w:szCs w:val='$size'/></w:rPr><w:t xml:space='preserve'>$xmlText</w:t></w:r></w:p>")
}

function Add-Table {
  param(
    [System.Collections.Generic.List[string]]$Parts,
    [string[]]$Headers,
    [object[]]$Rows,
    [int[]]$Widths = @()
  )

  $table = [System.Text.StringBuilder]::new()
  [void]$table.Append('<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLayout w:type="autofit"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="B8D8D4"/><w:left w:val="single" w:sz="6" w:color="B8D8D4"/><w:bottom w:val="single" w:sz="6" w:color="B8D8D4"/><w:right w:val="single" w:sz="6" w:color="B8D8D4"/><w:insideH w:val="single" w:sz="4" w:color="D7E7E5"/><w:insideV w:val="single" w:sz="4" w:color="D7E7E5"/></w:tblBorders><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>')
  [void]$table.Append('<w:tr>')
  for ($i = 0; $i -lt $Headers.Count; $i++) {
    $width = if ($Widths.Count -gt $i) { "<w:tcW w:w='$($Widths[$i])' w:type='dxa'/>" } else { '' }
    $text = Escape-Xml($Headers[$i])
    [void]$table.Append("<w:tc><w:tcPr>$width<w:shd w:fill='EAF6F4'/><w:vAlign w:val='center'/></w:tcPr><w:p><w:pPr><w:spacing w:after='0'/></w:pPr><w:r><w:rPr><w:b/><w:color w:val='075E58'/><w:sz w:val='18'/></w:rPr><w:t>$text</w:t></w:r></w:p></w:tc>")
  }
  [void]$table.Append('</w:tr>')

  foreach ($row in $Rows) {
    [void]$table.Append('<w:tr>')
    for ($i = 0; $i -lt $Headers.Count; $i++) {
      $value = if ($i -lt $row.Count) { [string]$row[$i] } else { '' }
      $width = if ($Widths.Count -gt $i) { "<w:tcW w:w='$($Widths[$i])' w:type='dxa'/>" } else { '' }
      $text = Escape-Xml($value)
      [void]$table.Append("<w:tc><w:tcPr>$width<w:vAlign w:val='top'/></w:tcPr><w:p><w:pPr><w:spacing w:after='0'/></w:pPr><w:r><w:rPr><w:color w:val='263B4A'/><w:sz w:val='18'/></w:rPr><w:t xml:space='preserve'>$text</w:t></w:r></w:p></w:tc>")
    }
    [void]$table.Append('</w:tr>')
  }
  [void]$table.Append('</w:tbl><w:p><w:pPr><w:spacing w:after="70"/></w:pPr></w:p>')
  $Parts.Add($table.ToString())
}

$parts = [System.Collections.Generic.List[string]]::new()

Add-Paragraph $parts 'My Assessment - Protected Exam Flow and Restrictions' Title
Add-Paragraph $parts 'Implementation-aligned functional, proctoring, recovery, submission, and security specification' Subtitle
Add-Paragraph $parts 'Project: Medsy Assessment Platform' Caption
Add-Paragraph $parts 'Prepared from the current application code and project instructions | 03 August 2026' Caption
Add-Paragraph $parts 'Document purpose' H1
Add-Paragraph $parts 'This document explains the complete student journey from My Assessment into an Online Proctored Exam, the restrictions applied during the attempt, the invigilator recovery process, submission and result behavior, data persistence, and the known technical limitations of browser-based enforcement.' Body
Add-Paragraph $parts 'Important interpretation' H2
Add-Paragraph $parts '"Current behavior" means logic present in the repository today. "Required hardening" means a rule stated in the project instructions that is not yet fully wired into the live attempt flow. This distinction prevents the document from claiming controls that the browser or current code cannot guarantee.' Note

Add-Paragraph $parts '1. Scope and actors' H1 -PageBreakBefore
Add-Table $parts @('Actor / Component','Responsibility') @(
  @('Student','Finds the assessment in My Assessment, completes preflight acknowledgement, takes the exam, responds to violations, submits, and later views published results.'),
  @('Invigilator / Faculty','Monitors the attempt, reviews violation/access requests, resumes locked attempts, adds or resets time, and may reset an attempt with or without saved answers.'),
  @('My Assessment','Displays online Practice and Proctored assessments, derives live/upcoming/completed/violation state, launches the correct exam flow, and exposes Request Access or View Results actions.'),
  @('Online Proctored Exam','Runs preflight checks, fullscreen/keyboard controls, question navigation, timers, monitoring, local attempt persistence, section/final submission, and automatic submission.'),
  @('Exam Controls','Maintains per-student control state, violation status, access requests, heartbeat-derived status, extensions, resume actions, and reset operations.'),
  @('Assessment Student Result','Displays the selected student result after the assessment/result is available from My Assessment.')
) @(1800,7000)

Add-Paragraph $parts '2. End-to-end protected exam flow' H1
$flow = @(
  'Faculty creates, configures, approves, and publishes an Online + Proctored assessment.',
  'The published record appears in My Assessment when it matches the supported online supervision types.',
  'My Assessment derives the card state from schedule, completion/result state, and any active invigilator lock.',
  'Upcoming: Start Assessment is disabled. Live: Start Assessment is available. Completed/published: View Results is shown. Violation: Request Access is shown.',
  'Starting stores the selected assessment in session storage and opens /my-assessment/online-proctored-exam.',
  'The exam page loads the assessment and any saved attempt, then shows assessment details, guidelines, environment rules, and the acknowledgement checkbox.',
  'Preflight blocks unsupported environments. The student must acknowledge the rules and start with pointer/touch input.',
  'Desktop starts only after fullscreen succeeds. Keyboard lock is requested. Mobile/tablet does not require fullscreen but page/app activity is monitored as browser APIs permit.',
  'During the attempt, questions, section navigation, timers, local saving, heartbeat, monitoring, and submission rules remain active.',
  'A desktop fullscreen exit immediately locks the attempt, records a violation, returns the student to My Assessment, and requires invigilator recovery.',
  'The student requests access. Faculty uses Exam Controls to Resume & Extend. The student re-enters the exam and fullscreen/keyboard control is restored.',
  'Manual final submission or timer expiry completes the attempt, releases keyboard/fullscreen controls, updates completion status, and returns to My Assessment.',
  'The completed assessment opens Assessment Student Result through View Results; result publication remains a separate evaluation lifecycle concern.'
)
for ($i = 0; $i -lt $flow.Count; $i++) { Add-Paragraph $parts ("$($i + 1). $($flow[$i])") Number }

Add-Paragraph $parts '3. My Assessment behavior' H1
Add-Table $parts @('Card state','Condition','Primary action','Restriction') @(
  @('Upcoming','Current time is before the configured start date/time.','Start Assessment (disabled)','Student cannot start early from the normal My Assessment action.'),
  @('Live','Current time is between the calculated start and end.','Start Assessment','Allowed when no active invigilator lock exists.'),
  @('Violation','Exam Controls contains an active invigilatorLock for the student.','Request Access','Start is blocked. After the request is sent, the action becomes Request Sent and remains disabled.'),
  @('Completed','Assessment status is completed or a published result is detected.','View Results','Opens the student result context rather than restarting the attempt.'),
  @('Unsupported record','Not Online + Practice/Proctored.','Not listed','My Assessment filters the record out of this workflow.')
) @(1200,2600,1700,3300)
Add-Paragraph $parts 'Available dashboard filters: exam status (All, Live, Upcoming, Completed), supervision (Practice, Proctored), exam type (MCQ, Descriptive, Hybrid), plus free-text search. Cards are sorted Live, Upcoming, then Completed.' Body

Add-Paragraph $parts '4. Preflight and entry requirements' H1
Add-Table $parts @('Check','Current behavior','Student-facing outcome') @(
  @('In-app webview','User-agent/webview detection.','Blocked; student is asked to use a standard browser session.'),
  @('Firefox','Firefox user-agent detection.','Blocked; student is asked to use Chrome or Microsoft Edge.'),
  @('Desktop Fullscreen API','Desktop requires requestFullscreen support and enabled fullscreen.','Blocked if fullscreen/PWA mode is unavailable or fullscreen cannot be entered.'),
  @('Multiple display heuristic','Checks screen.availLeft / screen.availTop.','Blocked when another display is inferred.'),
  @('Mobile / tablet','Fullscreen is not required.','Entry is allowed, with monitoring limited to page/app activity exposed by the platform.'),
  @('Acknowledgement','Student must select the compliance checkbox.','Start button stays disabled until acknowledged.'),
  @('Start gesture','Start requires pointer/touch intent; keyboard-generated click is rejected.','Prevents starting through keyboard activation.'),
  @('Orientation','Requests landscape lock when the API is available.','Best-effort only; failure is ignored.'),
  @('History guard','Pushes a locked history entry.','Back navigation is intercepted while the attempt is active.')
) @(1900,4000,3200)

Add-Paragraph $parts '5. Instructions shown before start' H1
@(
  'Keep the device sufficiently charged.',
  'Calculators, smartwatches, and unauthorized electronic devices are prohibited.',
  'Maintain stable internet. The application states that answers are saved locally during disconnection, but reconnection is required to submit.',
  'Raise a hand to contact the physical invigilator for technical support.',
  'Disable notifications and close background applications.',
  'Do not close the browser until the final Submitted Successfully state appears.',
  'Remain on the exam page for the entire attempt.',
  'Desktop requires fullscreen; mobile/tablet activity is monitored through available page/app signals.',
  'Keyboard input is disabled during the live protected exam; mouse or touch controls must be used.'
) | ForEach-Object { Add-Paragraph $parts $_ Bullet }

Add-Paragraph $parts '6. Active-exam restrictions and monitoring' H1 -PageBreakBefore
Add-Table $parts @('Control','Implementation','Result when triggered','Audit / limitation') @(
  @('Fullscreen','Desktop requires fullscreen after start.','Unintentional exit locks the exam for invigilator recovery.','Fullscreen is a browser control; it cannot prevent OS-level task switching.'),
  @('Keyboard','Keyboard Lock API is requested. Capture listeners block keydown, keypress, keyup, beforeinput, input, composition events, and blur text fields.','Keyboard interaction and typed input are prevented.','Critical for Descriptive exams: ordinary typed answers are not currently viable while this global lock is active.'),
  @('Right-click','contextmenu is prevented.','Context menu does not open.','Browser-level only.'),
  @('Copy / cut / paste','Clipboard events are prevented.','Clipboard actions are blocked inside the page.','Cannot stop external-device or OS-level capture.'),
  @('Selection / drag / drop','selectstart, dragstart, and drop are prevented.','Text selection and drag/drop are blocked.','Browser-level only.'),
  @('Tab/page visibility','visibilitychange is monitored.','Exam pauses; event is logged. On desktop, missing fullscreen leads to invigilator lock.','Detection depends on browser visibility reporting.'),
  @('Window focus','blur/focus is monitored.','Loss of focus pauses and logs; desktop fullscreen loss locks.','Cannot identify which external app was opened.'),
  @('Browser controls','Pointer movement within the top 18 pixels is guarded.','Exam pauses and logs browser-control-area access.','May create false positives on some devices.'),
  @('Back navigation','popstate pushes the protected history state again.','Student is kept in the attempt route.','Browser history cannot be made tamper-proof.'),
  @('Close / refresh','beforeunload prompts; pagehide is recorded.','Attempt pauses and browser close confirmation is requested.','Browser decides whether/how the prompt is shown.'),
  @('Resize','Window resize is monitored.','If desktop fullscreen is no longer active, attempt locks.','Resize alone is not treated as cheating when fullscreen remains active.'),
  @('Screenshot / dev tools','Keyboard lock includes PrintScreen, function keys, modifiers, Escape, Tab, navigation keys, and other keys.','Common shortcuts are suppressed when the browser honors the lock/listeners.','A web page cannot guarantee blocking OS screenshots, external capture, or all developer-tool entry points.'),
  @('Heartbeat','Every five seconds writes submitted, paused, fullscreen, visibility, focus, active section, and question index.','Invigilator-side state can reflect session activity.','Current persistence is browser storage/event based, not a server-authoritative telemetry channel.')
) @(1550,3300,2450,2600)

Add-Paragraph $parts '7. Violation lifecycle' H1
Add-Paragraph $parts 'Current implemented fullscreen violation path' H2
@(
  'Detect an unintentional desktop fullscreen exit or fullscreen restoration error.',
  'Stop duplicate lock processing for the same incident.',
  'Release keyboard lock and pause the exam.',
  'Increment fullscreenViolationTotal / fullscreenExitCount.',
  'Write invigilatorLock.active = true, the reason, time, exit count, overallStatus = Violation, and a monitoring log.',
  'Show a full-screen Exam Locked message: "Contact invigilator to continue."',
  'Return to My Assessment after approximately 1.2 seconds.',
  'Show the Violation card state; allow Request Access once.',
  'After faculty unlocks through Exam Controls, permit re-entry and restore fullscreen/keyboard controls.'
) | ForEach-Object { Add-Paragraph $parts $_ Bullet }
Add-Paragraph $parts 'Required hardening policy (project instruction)' H2
Add-Paragraph $parts 'The project instruction requires repeated violations to escalate through warning, penalty, lock, and auto-submit. The page contains violation phases and timer constants, but the current event handlers do not wire a complete escalating sequence. Today, a desktop fullscreen exit primarily follows the immediate invigilator-lock path.' Note

Add-Paragraph $parts '8. Invigilator recovery and controls' H1
Add-Table $parts @('Control','Use','Rules / effect') @(
  @('Request Access','Student action from a Violation card.','Adds an active access request and audit log for the invigilator.'),
  @('Resume & Extend','Per-student recovery action.','Only for present students in a proctored violation state; clears the active lock and can add or reset time.'),
  @('Overall Resume & Extend','Class-level recovery.','Processes eligible violation attempts; split-hybrid extension applies to the active section.'),
  @('Complete time reset','Restores the selected exam/section timer to its configured full duration.','Extension fields are hidden when complete reset is selected.'),
  @('Extra time','Adds configured minutes, with validation up to 90 minutes.','Stored per whole exam or per split section and synchronized to the student page.'),
  @('Reset attempt - keep answers','Restarts access/timing while retaining saved responses.','Attempt returns to pre-start with saved answer state.'),
  @('Reset attempt - clear answers','Creates a fresh attempt.','Clears MCQ answers/statuses and descriptive answers.'),
  @('Unavailable cases','Absent student, non-proctored attempt, finished/unavailable timer, or no active violation.','Resume & Extend remains unavailable.')
) @(2100,3100,3100)

Add-Paragraph $parts '9. Question and section behavior' H1 -PageBreakBefore
Add-Table $parts @('Exam form','Behavior') @(
  @('MCQ','Supports option selection, Answered, Try Later, Viewed, and Not Viewed states; active question navigation; section submission locks the MCQ section.'),
  @('Descriptive','Supports descriptive answer state and grouped sections in code; section submission locks the descriptive section. Global keyboard blocking currently conflicts with typed descriptive input.'),
  @('Hybrid - normal','MCQ and Descriptive sections are available according to configured content and submission state.'),
  @('Hybrid - split duration','Uses the configured mcq-first or descriptive-first order. The second section is inaccessible until the first completes. Expiry submits the first section, shows a five-second transition, and opens the second. Expiry of the second auto-submits the assessment.'),
  @('Read-only configurations','Input availability can be disabled by configuration; locked/submitted/paused states also prevent answer changes.'),
  @('Image preview','Question images can be opened and navigated while exam actions are not locked.')
) @(2300,6800)

Add-Paragraph $parts '10. Timing rules' H1
@(
  'Overall duration is parsed from the published assessment and increased by invigilator extension minutes.',
  'When a valid scheduled start exists, the effective end is scheduled start + duration + extensions.',
  'If an attempt has started without a usable schedule endpoint, a fallback end is based on the attempt start.',
  'The remaining-time display becomes critical at five minutes or less.',
  'At zero overall time, the attempt is automatically submitted, a Time Limit Reached modal appears, and My Assessment opens after approximately two seconds.',
  'Split-hybrid timers use separate configured MCQ and Descriptive durations, per-section extensions, and the configured section sequence.'
) | ForEach-Object { Add-Paragraph $parts $_ Bullet }

Add-Paragraph $parts '11. Submission, exit, and results' H1
Add-Table $parts @('Event','Behavior') @(
  @('Submit section','Opens a confirmation modal. After confirmation, the section is marked submitted and locked. A non-final success moves to the remaining section.'),
  @('Final manual submit','Marks all available sections and the whole assessment submitted; clears pause/violation UI; exits fullscreen intentionally; releases keyboard lock; records Manual Submit; persists completed status; returns to My Assessment.'),
  @('Automatic submit','Triggered by overall time expiry or final split-section expiry; records Auto Submit and completes the assessment.'),
  @('Exit while in progress','Shows "Hold on, you are not quite done!" with Finish the Test and Exit Anyway. Finish submits. Exit Anyway leaves without marking completion; saved attempt data remains available.'),
  @('Successful completion','Only this path intentionally exits fullscreen and restores normal interaction before returning.'),
  @('View Results','My Assessment stores assessment/student result context and opens assessmentstudentresult. A published evaluation/result status can also force the card to Completed.')
) @(2000,7000)

Add-Paragraph $parts '12. Persistence and browser events' H1
Add-Table $parts @('Data','Storage / event','Purpose') @(
  @('Published assessments','localStorage: vx-assessment-published','Source list and completion update.'),
  @('Selected protected assessment','sessionStorage: vx-online-proctored-exam-assessment','Carries the selected assessment into the exam route.'),
  @('Attempt state','localStorage attempt key','Stores start time, section, question index, MCQ answers/statuses, descriptive answers, submission flags, and applied reset version.'),
  @('Exam Controls state','localStorage: vx-exam-controls-state:{assessmentId}','Stores per-student violation/lock, access request, status, extensions, and logs.'),
  @('Time extension','localStorage + vx-student-exam-time-extension-changed','Synchronizes whole-exam or split-section extra time.'),
  @('Submission status','localStorage + vx-student-exam-submission-status-changed','Reports Manual Submit / Auto Submit and completion timing.'),
  @('Session heartbeat','localStorage + event every 5 seconds','Reports active attempt, pause/fullscreen/visibility/focus and current location.'),
  @('Attempt reset','localStorage + vx-student-exam-reset-changed','Applies keep-answer or clear-answer restart behavior.')
) @(1900,3500,3600)

Add-Paragraph $parts '13. State transition summary' H1 -PageBreakBefore
Add-Table $parts @('From','Trigger','To','Student-visible result') @(
  @('Upcoming','Schedule reaches start','Live','Start Assessment becomes available.'),
  @('Live / not started','Acknowledgement + successful preflight/start','In progress','Protected workspace opens.'),
  @('In progress','Tab/page hidden or focus lost while fullscreen remains valid','Paused','Blocking overlay; resume after returning.'),
  @('In progress','Desktop fullscreen exits or restore fails','Violation / locked','Exam Locked; redirected to My Assessment.'),
  @('Violation','Request Access','Request pending','Request Sent; waits for invigilator.'),
  @('Request pending','Invigilator Resume & Extend','Eligible to resume','Student can re-enter; fullscreen restored.'),
  @('In progress','Section submit','Section submitted','Section locks; next section opens if present.'),
  @('In progress','Manual final submit or time expiry','Completed','Controls released; returns to My Assessment.'),
  @('Completed','View Results','Result page','Student result context opens.')
) @(1500,2600,1800,3200)

Add-Paragraph $parts '14. Current restrictions versus guaranteed security' H1
Add-Paragraph $parts 'The following controls are enforceable only inside the browser page: context menus, clipboard events, selection, drag/drop, focus/visibility detection, fullscreen requests, history handling, and supported keyboard locks. They reduce accidental or common misuse but are not an operating-system lockdown.' Body
Add-Paragraph $parts 'Not guaranteed by a browser-only implementation' H2
@(
  'Preventing screenshots through OS tools, hardware buttons, external cameras, or another device.',
  'Detecting every application switch, virtual desktop, remote-control tool, overlay, or developer-tool launch.',
  'Reliably detecting all multi-monitor arrangements from availLeft/availTop.',
  'Preventing manipulation of localStorage/sessionStorage by a technically capable user.',
  'Server-authoritative audit continuity when the browser is offline or terminated.',
  'Identity verification, camera/microphone proctoring, face presence, gaze, audio, or room monitoring; these are not implemented in the reviewed flow.'
) | ForEach-Object { Add-Paragraph $parts $_ Bullet }

Add-Paragraph $parts '15. Identified gaps and required decisions' H1
Add-Table $parts @('Priority','Gap','Recommended decision / action') @(
  @('Critical','Global keyboard blocking blurs all text fields and blocks input/composition events. This conflicts with Descriptive and Hybrid exams that require typed answers.','Either limit keyboard blocking to prohibited shortcuts while allowing answer editors, or formally disallow Descriptive content in this protected mode and enforce that rule before publication.'),
  @('High','Repeated violation escalation is specified but not fully connected to live monitoring events.','Centralize a violation state machine: warning -> timed penalty -> invigilator lock -> auto-submit, with configurable thresholds and immutable audit events.'),
  @('High','Attempt, controls, heartbeat, logs, and completion are primarily browser-storage based.','Move authoritative attempt/control/audit state to authenticated server APIs with monotonic versions and retry queues.'),
  @('High','Current student identity uses a fixed MC2568 fallback in reviewed pages.','Bind all student and assessment operations to the authenticated session identity and server authorization.'),
  @('High','Direct route entry is not independently schedule-gated in startExam.','Revalidate assignment, attendance, schedule, attempt limit, and lock state on the server immediately before issuing an exam session token.'),
  @('Medium','Browser/user-agent and multi-monitor checks are heuristic.','Treat them as preflight signals, report uncertainty, and use a managed kiosk/secure-browser strategy where strict enforcement is required.'),
  @('Medium','Monitoring log presentation and protected-exam control logs are not clearly one server-backed audit pipeline.','Unify monitoring events, invigilator actions, access requests, resets, extensions, and submissions under one audit schema.'),
  @('Medium','Exit Anyway allows navigation without completion while preserving the attempt.','Define whether this should pause, lock, count as a violation, or permit later resume; apply one explicit policy.'),
  @('Medium','Result visibility can be derived from completed or published-result signals.','Define whether completion should show a pending-evaluation state until faculty publishes the result.')
) @(900,3900,4400)

Add-Paragraph $parts '16. Recommended production architecture' H1 -PageBreakBefore
@(
  'Issue a short-lived, assessment-scoped exam session token after server-side eligibility and schedule checks.',
  'Persist answers through idempotent autosave endpoints with local retry as a resilience layer, not as the source of truth.',
  'Use a centralized violation engine with event type, count, cooldown, configured threshold, action, timestamp, device/session id, and invigilator override.',
  'Persist every transition as an append-only audit event and derive current state from authoritative records.',
  'Synchronize timer deadlines from server timestamps; never trust only the client clock.',
  'Separate restriction policies by exam form so Descriptive input remains possible while forbidden shortcuts stay blocked.',
  'Use WebSocket/SSE for live invigilator commands and heartbeat state, with polling fallback.',
  'Require explicit confirmation and reason for reset/resume actions and show those actions in the student/faculty audit history.',
  'Use a secure browser or managed-device policy when OS-level prevention is a contractual requirement.'
) | ForEach-Object { Add-Paragraph $parts $_ Bullet }

Add-Paragraph $parts '17. Acceptance and regression test checklist' H1
$tests = @(
  'Upcoming assessment cannot start; it becomes startable at the configured time.',
  'Active invigilator lock overrides Live and exposes Request Access only.',
  'Unsupported webview, Firefox, missing desktop fullscreen support, and detected secondary display each block entry with the correct message.',
  'Acknowledgement is mandatory and keyboard activation cannot start the exam.',
  'Desktop fullscreen enters successfully and exits only on intentional completion.',
  'Right-click, copy, cut, paste, selection, drag/drop, and prohibited keyboard shortcuts are blocked during the live attempt.',
  'MCQ mouse/touch answering, Try Later, status tracking, navigation, and local restore work.',
  'Decision for Descriptive typing is implemented and tested explicitly.',
  'Visibility/focus loss pauses and logs; desktop fullscreen exit locks and increments the violation count once.',
  'Request Access appears in Exam Controls; Resume & Extend clears the lock and restores access.',
  'Whole-exam and split-section extensions update the student timer without resetting answers.',
  'Split hybrid respects sequence, section locks, transition countdown, and final auto-submit.',
  'Manual section/final confirmations, success state, and lock behavior are correct.',
  'Overall timeout auto-submits once, persists completion, releases controls, and redirects.',
  'Reset with saved answers preserves responses; fresh reset clears them.',
  'Refresh/reopen restores the correct attempt state without duplicate submission or duplicate violation.',
  'Dark/light mode, mobile/tablet/desktop/wide layouts, modal focus, and scroll locking are verified.',
  'Server-side authorization, tamper resistance, and audit continuity are tested before production use.'
)
$tests | ForEach-Object { Add-Paragraph $parts ("[ ] $_") Bullet }

Add-Paragraph $parts '18. Source traceability' H1
Add-Table $parts @('Source file','Coverage') @(
  @('src/pages/AssessmentDashboardPage.jsx','My Assessment listing, status derivation, filters, launch, violation/access request, and result navigation.'),
  @('src/pages/OnlineProctoredExamPage.jsx','Preflight, restrictions, fullscreen, keyboard lock, monitoring, attempt state, timers, sections, violations, submission, and completion.'),
  @('src/pages/ExamControlsPage.jsx','Invigilator status, Resume & Extend, whole/split timing, attempt reset, access request, and control audit state.'),
  @('src/pages/ExamLogPage.jsx','Monitoring log presentation and event metrics.'),
  @('src/config/appPages.js and src/App.jsx','Page identities and routes for My Assessment, protected exam, and student result.'),
  @('src/project_instruction.md section 9','Required protected-exam enforcement and escalation policy.')
) @(3600,5400)

Add-Paragraph $parts 'End of document' Caption

$documentXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $($parts -join "`n")
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="900" w:right="850" w:bottom="900" w:left="850" w:header="420" w:footer="420" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$documentRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
"@

$coreProps = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>My Assessment Protected Exam Flow and Restrictions</dc:title>
  <dc:subject>Implementation-aligned protected exam specification</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:keywords>My Assessment; Proctored Exam; Restrictions; Invigilation; Security</cp:keywords>
  <dc:description>End-to-end protected exam flow, restrictions, recovery, submission, implementation gaps, and tests.</dc:description>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-08-03T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-03T00:00:00Z</dcterms:modified>
</cp:coreProperties>
"@

$appProps = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <Company>Medsy</Company>
  <AppVersion>1.0</AppVersion>
</Properties>
"@

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("proctored-exam-doc-" + [Guid]::NewGuid().ToString('N'))
$wordDir = Join-Path $tempRoot 'word'
$wordRelsDir = Join-Path $wordDir '_rels'
$relsDir = Join-Path $tempRoot '_rels'
$propsDir = Join-Path $tempRoot 'docProps'
[IO.Directory]::CreateDirectory($wordRelsDir) | Out-Null
[IO.Directory]::CreateDirectory($relsDir) | Out-Null
[IO.Directory]::CreateDirectory($propsDir) | Out-Null

$utf8NoBom = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText((Join-Path $tempRoot '[Content_Types].xml'), $contentTypes, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $relsDir '.rels'), $rootRels, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $wordDir 'document.xml'), $documentXml, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $wordRelsDir 'document.xml.rels'), $documentRels, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $propsDir 'core.xml'), $coreProps, $utf8NoBom)
[IO.File]::WriteAllText((Join-Path $propsDir 'app.xml'), $appProps, $utf8NoBom)

if (Test-Path -LiteralPath $OutputPath) {
  Remove-Item -LiteralPath $OutputPath -Force
}
[IO.Compression.ZipFile]::CreateFromDirectory($tempRoot, $OutputPath)
Remove-Item -LiteralPath $tempRoot -Recurse -Force

Write-Output $OutputPath
