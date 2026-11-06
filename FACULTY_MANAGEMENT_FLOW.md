# Faculty Management flow

Reviewed: 4 November 2026

## Scope and verification

This document describes the Faculty Management flow implemented in this local project. It is intended for product review, backend integration, and QA handoff.

- Reference supplied: https://admin.medsy.ai/SMVMCH/faculty-management
- Local route mapping: `/faculty-management`.
- Main source: `src/pages/FacultyManagementPageV2.jsx`.
- Shell integration: `src/App.jsx` imports and renders the page, passing its shared alert handler.
- Verification: source inspection only. The supplied live URL could not be accessed through the web tool. Production parity, the institution-prefixed route, browser behaviour, and backend integration are not verified.
- No application behaviour was changed to prepare this document.

## 1. Overall journey

1. Open Faculty Management.
2. Review directory totals and faculty records.
3. Search and optionally apply designation, role, and status filters.
4. Open a row to inspect class assignment details.
5. Add a faculty member, edit an existing record, or delete a record.
6. Review the updated local directory and completion alert.

Alternative actions: switch between compact and detailed columns, navigate result pages, or select Import. Import currently stops at an informational alert.

## 2. Initial page state

| Element | Current behaviour |
| --- | --- |
| Breadcrumb | Faculty → Faculty Management |
| Data source | Six static sample records declared inside the page component |
| Search | Empty |
| Filters | Hidden, with no active filter values |
| View | Compact |
| Pagination | Page 1; five records per page |
| Expanded record | FAC-001 is initially expanded |
| Add/edit dialog | Closed |
| Summary | Total 6; active 4; inactive 1; unassigned 2 |

The summary counts use the entire local directory, independently of search and filters. The result count uses the filtered directory.

Unassigned means either faculty status is `Not Assigned` or assignment status is anything other than `Assigned`. These summary categories overlap: an inactive record can also be unassigned.

## 3. Find faculty

### Search

1. Enter text in the search field.
2. The page trims the search text and compares it case-insensitively.
3. Matching checks faculty ID, name, designation, department, and each role.
4. Search combines with every active filter using AND logic.
5. Each search change returns pagination to page 1.

Email and phone are not searched. There is no search submit button or network request.

### Filters

1. Select the filter icon to show the filter controls.
2. Choose a designation, role, and/or status.
3. Results update immediately; each selection resets pagination to page 1.
4. Select the relevant “All” option to clear an individual filter.

Hiding the filter controls does not clear their values. There is no combined reset action or department filter.

| Filter | Available values |
| --- | --- |
| Designation | Professor; Associate Professor; Assistant Professor; Tutor; Senior Resident |
| Role | Course Lead; Exam Coordinator; Module Coordinator; Assessment Reviewer; Practical Lead; Content Reviewer; Attendance Lead; Lab Coordinator |
| Status | Active; Inactive; Not Assigned |

The sample data includes `Exam Lead`, which is absent from the role filter and role picker options. Text search can still match that role.

### No matches

The result count becomes zero and the table body is empty. There is no dedicated empty-state message or recovery action. Pagination still displays one page.

## 4. Directory and assignment details

Compact columns: selection checkbox, name with faculty ID, job title, department, status, and actions.

Detailed View adds course, class/section, and student count. Selecting Compact View removes those extra columns without changing the records.

### Expand a record

1. Click a faculty row, or focus the row and press Enter or Space.
2. Its assignment panel opens directly below the row.
3. Opening another row replaces the previous expanded selection.
4. Activating the same row again collapses it.

The View action opens the selected row and displays “Faculty assignment details opened below.” It does not navigate to a separate profile page.

Assignment details show course, department, year/semester, subjects, class/section, student count, and assignment status. These values cannot be edited through the expanded panel.

Row checkboxes are uncontrolled UI inputs. There is no selected-record state, select-all control, or bulk operation. Checkbox clicks also bubble to the row expansion handler.

## 5. Add faculty

1. Select Add Faculty.
2. The shared add/edit dialog opens with a fresh draft.
3. Enter identity details, choose department and status, and toggle roles.
4. Select Save Faculty.
5. If name or email is blank after trimming, display a warning and keep the dialog open.
6. Otherwise create the record, prepend it to the local directory, set it as the expanded record, close the dialog, and display a success alert.

| Field | Initial value | Current save behaviour |
| --- | --- | --- |
| Faculty ID | `FAC-` plus directory length + 1, padded to three digits | Editable; trimmed; no required or uniqueness check |
| Name | Empty | Required; trimmed |
| Designation | Assistant Professor | Selected value saved |
| Email | Empty | Required; trimmed; save handler does not validate email format |
| Phone number | Empty; visual `+91` prefix | Optional; trimmed; prefix is not automatically stored |
| Department mapping | Anatomy | Selected value saved |
| Status | Active | Selected value saved |
| Roles | Course Lead | Multiple roles allowed; empty selection silently becomes Course Lead |

The email input uses `type="email"`, but Save is a button handler outside a native form submission and does not invoke validity checking.

### Assignment created on save

| Assignment field | Value |
| --- | --- |
| Course | Pending course mapping |
| Department | Selected department |
| Year/semester | To be assigned |
| Subjects | Pending subject mapping |
| Class/section | TBD |
| Student count | 0 |
| Assignment status | Pending Allocation when faculty status is Not Assigned; otherwise Assigned |

These are current code values, not evidence of a completed course allocation. An Active or Inactive faculty member can therefore display Assigned with pending course and subject mappings.

Saving does not reset search, filters, or the current page. A newly added record may not be visible in the current result set or page even though it is selected for expansion.

## 6. Edit faculty

1. Select Edit on a faculty row.
2. The same dialog opens with existing identity, department, status, phone, and roles.
3. Update values and select Save Faculty.
4. The same name/email presence checks run.
5. Replace the matching local record, close the dialog, and display “Faculty profile updated successfully.”

Important current behaviour:

- The Faculty ID input remains editable, but the save handler preserves the original ID when editing. Changes typed into that input are ignored.
- Every save rebuilds the assignment using the defaults listed above. Existing course, year/semester, subjects, class/section, and student count are overwritten, even if the user only changes the name or email.
- No separate course/class assignment editor exists on this page.
- Search, filters, and pagination remain unchanged, so an edited record can disappear from the active filtered results.

## 7. Cancel or close the dialog

Cancel, the close icon, or a backdrop click closes the dialog and resets the draft, selected roles, and editing ID. Unsaved changes are discarded without confirmation.

The component does not implement Escape handling, focus trapping/restoration, or body scroll locking. Its dialog backdrop is permanently marked `aria-hidden="true"`, including when open. These are accessibility gaps requiring correction and browser verification.

## 8. Delete faculty

1. Select Delete on a row.
2. Remove every local record matching that faculty ID immediately.
3. Clear the expanded selection if it matches that ID.
4. Reset pagination to page 1.
5. Display “Faculty profile removed from the directory.”

There is no confirmation dialog, undo, dependency check, archive state, or backend request. Duplicate IDs can cause multiple records to be removed together.

## 9. Import faculty

1. Select Import.
2. Display “Faculty import will be connected to your source file flow next.”
3. Remain on the directory without changing data.

File selection, templates, parsing, validation, preview, duplicate resolution, progress, and import results are not implemented.

## 10. Pagination

- Five filtered records are displayed per page.
- Prev, Next, and numbered buttons change the current page within bounds.
- Prev is disabled on page 1; Next is disabled on the last page.
- The page-size dropdown is disabled, so its displayed 10 and 20 options cannot be selected.
- The footer text “from 200 data” is hardcoded and does not reflect the directory size.
- Search/filter changes and deletion reset the page to 1. Add/edit saves do not.
- Editing a record out of the filtered results can leave the current page beyond the new page count; there is no automatic page-clamping effect.

## 11. Data and persistence

The page owns directory data through React `useState`. There is no faculty service, fetch request, localStorage persistence, or sessionStorage persistence in this component. Reloading or unmounting and remounting the page restores the six sample records.

Current record shape, illustrated by a sample record:

```json
{
  "id": "FAC-001",
  "name": "Dr. Anika Sharma",
  "designation": "Professor",
  "email": "anika.sharma@medsy.edu",
  "department": "Anatomy",
  "roles": ["Course Lead", "Exam Coordinator"],
  "status": "Active",
  "avatar": "AS",
  "assignment": {
    "course": "MBBS Phase I",
    "department": "Anatomy",
    "yearSem": "1st Year - Sem 1",
    "subjects": "Anatomy, Histology",
    "classSec": "A / B",
    "studentCount": 120,
    "assignmentStatus": "Assigned"
  }
}
```

`phone` is absent from the seed records and is saved as a string for added/edited records. Subjects and class/section are display strings, not arrays of linked entity IDs. Each faculty record contains one assignment object; this does not establish support for multiple course assignments.

The page receives only `onAlert`. It receives no institution identifier, current-user permissions, or API client. Shell authentication and production authorisation are outside this source review.

## 12. Backend handoff decisions and gaps

The following are proposed requirements for implementation, not verified existing behaviour or an agreed API contract.

| Area | Decision or work needed |
| --- | --- |
| Persistence | Introduce asynchronous directory/create/update/delete services while retaining default mock data for development |
| Tenant and permissions | Establish institution scoping and server-enforced read/write permissions |
| Identity | Use stable unique IDs; validate required/duplicate employee IDs and email addresses |
| Validation | Define email and phone rules, field-level errors, and whether at least one role is required |
| Roles | Resolve the Exam Lead option mismatch and define authoritative role values |
| Assignment preservation | Keep existing assignment data when editing identity fields |
| Assignment model | Define course/subject/class IDs, single versus multiple assignments, and a dedicated assignment workflow |
| Status | Separate faculty activity status from allocation status and define valid transitions |
| Delete | Define confirmation, linked-record restrictions, archive versus permanent removal, and recovery |
| Import | Define template, validation, preview, duplicate handling, and partial-failure reporting |
| Async feedback | Add loading, pending-save protection, server errors, retries, and failure recovery |
| Directory controls | Correct totals, empty states, page clamping, and checkbox behaviour |
| Accessibility | Use an accessible dialog; label icon actions; verify row/action keyboard interactions |

## 13. QA handoff

These are proposed browser checks; none were executed as part of this documentation task.

| Check | Source-derived expectation or acceptance target |
| --- | --- |
| Initial load | Six samples; 6/4/1/2 summary; five rows on page 1; first row expanded |
| Search | Case-insensitive matches for ID/name/designation/department/role; email does not match |
| Combined filters | All selected conditions apply together; page resets to 1 |
| Hidden filters | Hiding controls retains active filter values |
| No results | Confirm current empty table; future implementation should provide clear recovery |
| View modes | Detailed view adds three columns without changing data |
| Row expansion | One selected row at a time; View opens details; Enter/Space activate focused rows |
| Add validation | Blank name/email blocks save; malformed non-empty email currently passes the handler |
| Add success | New record prepended, default assignment created, dialog closes, alert shown |
| No roles selected | Current save restores Course Lead |
| Edit identity | Original ID retained; confirm assignment overwrite defect before fixing |
| Cancel | Draft changes discarded and stored local record unchanged |
| Delete | Immediate local removal, page reset, and alert; no confirmation |
| ID collision | Delete a sample then add; length-based ID may duplicate a surviving ID |
| Pagination after edit | Edit the only page-2 filtered result out of the filter; check invalid page state |
| Import | Informational alert only; no file picker |
| Reload/revisit | Samples restored after reload or component remount |
| Keyboard/dialog | Check focus visibility, action labels, Escape, focus trap, and focus restoration |
| Responsive/themes | Check 390, 768, 1024, and 1440px; light/dark contrast; table overflow and dialog clipping |
| Production parity | Compare the authenticated live page against this local flow before treating this as live-site documentation |

## 14. Evidence index

| Source | Evidence |
| --- | --- |
| `src/pages/FacultyManagementPageV2.jsx` → `facultyRows` | Initial records and assignments |
| Same file → `visibleRows`, `pageRows`, summary calculations | Search, filtering, pagination, and counts |
| Same file → `handleOpenAddFaculty`, `handleSaveFaculty` | Draft defaults, validation, create/update, and assignment overwrite |
| Same file → `handleEditFaculty`, `handleDeleteFaculty` | Edit population and immediate local deletion |
| Same file → `handleImportFaculty`, `handleViewFaculty` | Import message and inline detail viewing |
| Same file → table and modal markup | Columns, row controls, dialog fields, and close actions |
| `src/App.jsx` | `/faculty-management` route mapping, page rendering, and shared alert integration |
