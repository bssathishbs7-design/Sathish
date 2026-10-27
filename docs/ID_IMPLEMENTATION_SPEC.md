# ID System: Implementation Spec

**For:** the designer implementing the screens (with Codex), then the frontend developer who takes over the code base.
**Status:** agreed on 26 Oct 2026. The reference implementation is in this repository (see section 12).
**How to use it with Codex:** give it this whole file. Every rule here is already implemented and tested in the reference code; where this file and a screen design disagree, this file wins.

---

## 0. Summary

| Type | Code | Draft ID | Permanent ID | Draft becomes permanent when |
|---|---|---|---|---|
| Skill activity | `SA` | `DRF-SA-9QH3WD` | `SRMC-SA-00125` | it is **first assigned** |
| Assessment | `AP` | `DRF-AP-7K2M9Q` | `SRMC-AP-00149` | it is **published** (directly or after approval) |
| Blueprint | `BP` | `DRF-BP-4F7Q2M` | `SRMC-BP-00037` | it is **approved** (only then) |
| Question Bank question | `QB` | `DRF-QB-7K2M9Q` | `SRMC-QB-0000130` | it is **approved** into the Question Bank |
| Assessment question | `AQ` | `DRF-AQ-3PX8RN` | `SRMC-AQ-0000130` | its **assessment is published** |
| Medsy question | `QB` | none | `MED-QB-0000013` | supplied with its ID by Medsy |

- A draft ID is temporary. A permanent ID **never changes** once given.
- Questions are **not versioned**: there is no v1, v2. An approved edit replaces the question under the same ID.

---

## 1. Anatomy of an ID

```
SRMC - AP - 00149
 │     │     └── Number: counts up, never restarts; the last digit is a check digit
 │     └──────── Type: SA, AP, BP, QB or AQ
 └────────────── Institution: SRMC (from config), MED for Medsy, DRF for drafts
```

| Part | Rule |
|---|---|
| Institution | 2–8 uppercase letters or digits. The current institution comes from `CURRENT_INSTITUTION_CODE` in `src/config/institution.js` (`SRMC`). `MED` is Medsy. **No institution code may start with `DRF`**; that prefix is reserved for drafts. |
| Type | `SA`, `AP`, `BP` (records) or `QB`, `AQ` (questions). |
| Number | Digits only, last digit is a Damm check digit (section 3.2), zero-padded to a fixed width (section 3.3), **maximum 12 digits**. |

Draft IDs have the same three parts, with `DRF` in place of the institution and **6 random characters** in place of the number: `DRF-AP-7K2M9Q`.

---

## 2. Each ID type, step by step

### 2.1 Skill activity (`SA`)

1. Faculty creates an activity in **Skills → Configuration** → it gets a draft ID `DRF-SA-XXXXXX`.
2. The activity is **assigned for the first time** → it gets its permanent ID `SRMC-SA-NNNNN`. Later assignments keep the same ID.
3. Shown on: Configuration (activity row), Evaluation, Dashboard, My Skill Activity, the Logbook (entry lists, skill record, subject views), activity result pages.
4. The activity history pop-up treats the draft ID and the permanent ID as one record, so its log runs from creation to published results.
5. Sample activities that ship with the app and have never been assigned also show draft IDs.

### 2.2 Assessment (`AP`)

1. An assessment is created → draft ID `DRF-AP-XXXXXX`, shown in the editor header and on the assessment card.
2. It stays on the draft ID while it is a draft or waiting for approval.
3. It is **published**, directly or after approval → permanent ID `SRMC-AP-NNNNN`. Republishing keeps it.
4. The draft ID is kept on the record (`draftCode`) beside the permanent one, and Assessment History records the change.
5. A new assessment discarded before it is ever saved loses its draft ID. Drafts never use up a number.

### 2.3 Blueprint (`BP`)

1. A blueprint is created with its assessment → draft ID `DRF-BP-XXXXXX`, paired with that assessment.
2. It is **approved** → permanent ID `SRMC-BP-NNNNN`. Only approval issues it.
3. A blueprint **never sent for approval keeps its draft ID**, even after its assessment is published.
4. An approved blueprint is stored in **Saved Templates** under its permanent ID, keeps that ID through revisions, and stays there if the assessment is deleted.
5. Deleting an assessment deletes its blueprint in every state (draft, pending, rejected, approved); the approved template remains.

### 2.4 Question Bank question (`QB`)

1. A new question, or an edit of an existing one, gets a draft ID `DRF-QB-XXXXXX`.
2. It is **approved** into the Question Bank → permanent ID `SRMC-QB-NNNNNNN`.
3. When the **author edits their own approved question** and the edit is approved, the edit **replaces the question under the same ID** (no version number).
4. When **another faculty member's** question is edited, it becomes a **new** question under the editor's name after approval (new ID). The original is unchanged.
5. When a **Medsy** question is edited, it becomes a **new institution question** after approval (new `SRMC-QB` ID). The Medsy question is unchanged.
6. A question that is copied from another keeps where it came from in `derivedFrom` (for example `MED-QB-0000013`).

### 2.5 Assessment question (`AQ`)

1. A question written or edited **inside an assessment** gets a draft ID `DRF-AQ-XXXXXX`.
2. Its assessment is **published** → permanent ID `SRMC-AQ-NNNNNNN`. Questions added since the last publish get theirs at the next publish.
3. A Question Bank question that is **edited inside the assessment** becomes a new assessment question: it gets its own `AQ` ID, and the bank ID moves to `derivedFrom`.
4. An assessment question can be **sent to the Question Bank**. When approved it gets a **new** `SRMC-QB` ID, and its `AQ` ID is kept as `derivedFrom`.

### 2.6 Medsy question (`MED-QB`)

Supplied by Medsy with its permanent ID; there is no draft stage. Editing one creates a new institution question (2.4, point 5).

---

## 3. Numbering rules

### 3.1 Counters

- One counter per **institution + type** (for example `SRMC:QB`, `SRMC:AP`). Numbers never restart.
- A counter **only goes up**. Deleting a record never frees its number, so **an ID is never issued twice**.
- If a counter is lost or reset, it recovers by continuing after the highest ID already stored.
- The first **20 numbers** of `SA` and `AP` are reserved for sample data, so the first real skill activity is `SRMC-SA-00210` and the first real assessment is `SRMC-AP-00210`. `QB`, `AQ` and `BP` start at 1 (`SRMC-QB-0000013`, `SRMC-BP-00013`).
- **Maximum 12 digits** (check digit included), so 99,999,999,999 IDs per institution and type. The system must **refuse** to issue past it, and a batch that would pass it must be refused without moving the counter.

### 3.2 Check digit (Damm algorithm)

The number is the sequence followed by one check digit, so that any single wrong digit or any swap of two neighbouring digits is detected.

```
check digit = damm(sequence digits)
interim = 0
for each digit d of the sequence: interim = TABLE[interim][d]
check digit = interim

TABLE =
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
  [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
  [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
  [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
  [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
  [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
  [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0]
```

- Example: sequence `14` → check digit `9` → number `149` → `SRMC-AP-00149`.
- A number is valid when running the same table over **all** its digits (check digit included) ends at `0`.
- Leading zeros do not change the result, which is why padding is safe.

### 3.3 Width (zero padding)

| Types | Width | Example |
|---|---|---|
| Questions: `QB`, `AQ` (Medsy included) | **7 digits** | `SRMC-QB-0000130`, `MED-QB-0000013` |
| Records: `SA`, `AP`, `BP` | **5 digits** | `SRMC-AP-00149` |
| Any type, past its width | grows one digit at a time, up to **12** | `SRMC-QB-10000004` |

Padding keeps IDs the same length so they line up on screen and sort correctly as text (Excel, exports) within the width.

### 3.4 Draft IDs

- Format: `DRF-<TYPE>-` + **6 random characters** from the Crockford base32 alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. It has no I, L, O or U, so a draft ID read aloud cannot be confused with 1 or 0.
- Generated with a cryptographic random source.
- Question drafts are checked against every draft already known in the session, and a clash is silently retried.
- Draft IDs are never sorted, never counted, and never reused as a permanent ID.

---

## 4. Reading what people type

Everywhere an ID can be typed or pasted (search boxes, filters), accept:

| Input | Read as |
|---|---|
| `srmc-qb-0005549`, `SRMC QB 0005549`, `SRMC_QB_0005549` | `SRMC-QB-0005549` (any case, dash, space or underscore) |
| `SRMCQB0005549` | `SRMC-QB-0005549` (run together) |
| `SRMC-QB-5549` | the same question as `SRMC-QB-0005549` (leading zeros optional) |
| `drf qb 7k2m9q`, `QB7K2M9Q` | `DRF-QB-7K2M9Q`; `I`/`L` are read as `1` and `O` as `0` |

Rules the reader must follow:

1. **An ID written in parts is read part by part** (institution, type, number). Never strip the separators and search inside the result. Otherwise a draft such as `DRF-AP-VBP442` is misread as institution `DRFAPV`, type `BP`, number `442`.
2. **Nothing starting with `DRF` is ever a permanent ID.**
3. A number that fails its check digit is **not** an ID.
4. Compare IDs by **institution + type + number value**, never as raw text, so that `SRMC-QB-5549` and `SRMC-QB-0005549` match.

---

## 5. Search behaviour (Question Bank)

| Typed | Result |
|---|---|
| A full question ID | That question. If it was deleted, show its deletion note. |
| A bare number, e.g. `0005549` | Questions with that number. |
| An ID with a typo (wrong digit or two swapped digits) | No match, plus the nearest existing ID: "SRMC-QB-0005548 (did you mean SRMC-QB-0005549?)". |
| A draft ID | That draft; if it has since been approved: "`DRF-QB-…` was approved as `SRMC-QB-…`". |
| An assessment ID | The bank questions used in that paper: "*n* of *m* questions in *Paper name* (*ID*)". Questions written inside the assessment are noted as such. |
| Pasted list `0000130, SRMC-QB-0005549; SRMC QB 0005558` | Split on commas, semicolons and new lines; each part searched. |

---

## 6. Sorting

- Sort IDs by **institution** (A–Z, so `MED` before `SRMC`), then **type** (A–Z, so `AQ` before `QB`), then **number as a number**, never as text.
- Questions without a permanent ID yet (drafts) go **last**.
- Page-by-page loading uses the same order (institution, type, number, then internal record id as a tiebreaker), so no row is skipped or repeated between pages.
- Skill activity, assessment and blueprint lists are ordered by date or status, not by ID. Draft IDs are never sorted.

---

## 7. How IDs look and behave on screen

### 7.1 The ID chip

| Variant | Border | Background | Text |
|---|---|---|---|
| Permanent | 1px solid `#CFE3ED` | `#F6FBFD` | `#235066` |
| Draft | 1px **dashed** `#CBD5E1` | `#F8FAFC` | `#64748B` |
| Permanent, dark theme | `rgba(125,211,252,.4)` | `rgba(3,105,161,.2)` | `#BAE6FD` |
| Draft, dark theme | `rgba(148,163,184,.45)` dashed | `rgba(30,41,59,.5)` | `#94A3B8` |

- Monospace font (`ui-monospace, SFMono-Regular, Consolas, monospace`), 11px, weight 700, radius 5px, padding 1px 6px.
- **Never truncate or wrap an ID** (`white-space: nowrap`).
- The dashed border is the only thing that marks a draft; do not add the word "Draft" to the chip.

### 7.2 Copying

- Every ID shown has a small **copy button** right after it (copy icon → check icon for about 1.6 s, then back).
- Clicking the ID text selects the **whole** ID in one click.
- Clicking the ID or its copy button inside a clickable card or row must **not** open that card.
- Screen readers hear "Copy *skill activity ID* SRMC-SA-00125", then "Copied".
- When the browser blocks the clipboard, fall back to selecting the text: "Unable to copy. Select the ID to copy it manually."

### 7.3 Where each ID appears

| ID | Screens |
|---|---|
| `SA` | Configuration activity rows (draft or permanent), Evaluation, Dashboard rows, My Skill Activity, Logbook entry lists / skill record / subject views, activity result pages. Each has an **Activity history** button beside it. |
| `AP` | Assessment editor header ("Assessment ID …"), assessment cards on every tab, Assessment History dialog, exit dialog, approval queue cards. |
| `BP` | Assessment card settings ("Blueprint" row), Saved Templates, approval queue cards. |
| `QB` / `MED-QB` | Question Bank cards, My Questions (draft ID until approved), approval view, question history. |
| `AQ` | Assessment preview chips, Assessment History (questions written in published assessments). |

### 7.4 The ID guide (legend)

Opened from **Profile menu → ID guide** ("What SA, AP, BP, QB and AQ IDs mean"). Keep the content exactly as in `docs/ID_GUIDE.md`:

1. **How an ID changes:** `Created` → *gets* → `DRF-AP-7K2M9Q` (Temporary) → *assigned, published or approved* → `SRMC-AP-00149` (Permanent, never changes).
2. **Reading an ID:** the three parts, plus the digits list (questions 7, others 5, maximum 12, each with an example).
3. **One section per type** (Skills, Assessment, Blueprint, Question Bank). Each section has:
   - a **flow**: draft chip (dashed) → arrow labelled with the event → permanent chip (solid);
   - then one row per ID, giving the chip, its name and when it is given.
4. **Flow drawing:** the arrow is a dashed line in the brand green with an arrowhead, as tall as a chip so it lines up with the chips. The event label sits **under** the arrow, and captions sit under chips. On narrow screens (≤ 560px) each flow reads top to bottom with downward arrows.
5. **Use real IDs as examples.** In code, generate the example IDs with the real formatter, so their check digits are valid and they follow the institution code.

### 7.5 Wording

- Say **ID**, not "code", "reference" or "number", in labels ("Assessment ID", "Question ID", "Activity ID").
- Never show a version label (v1, v2) next to a question ID.
- Approval queue label for an author's own edit: "Edit of SRMC-QB-… · replaces it under the same ID".
- Edit warning for an author's own approved question: "Your changes replace SRMC-QB-… after approval, under the same ID. Until then the approved question stays in use."
- Assessment preview, when a bank question changed after it was added to the paper: chip "**Edited in the Question Bank since it was added**", with a tooltip: "This paper keeps the question as it was when added. Remove and re-add it to use the edited question."

---

## 8. Edits and approval

- An approved edit of the author's **own** question keeps the ID and replaces the content. The question history shows "Edited: Approved edit replaced the content; the ID is unchanged".
- An edit of **someone else's** question, or of a Medsy question, creates a **new** question with a new ID after approval, with `derivedFrom` pointing at the original.
- A published paper keeps each bank question **as it was when added**. A later bank edit does not change the paper, and the preview shows the notice from 7.5.
- Detect "edited since added" by comparing the content (question text, options, correct answer, answer key, marks, images, parts), ignoring markup and spacing. Do not use a version number.

---

## 9. Older IDs that must keep working

Records created before 26 Oct 2026 may carry older forms. They must be read, searched and shown as they are:

| Older form | Meaning |
|---|---|
| `SRMC-AP-26-01`, `SRMC-BP-26-01` | Assessment / blueprint numbered within academic year 2026-27 |
| `SRMC-AP-26-00017` | Even older form, with a check digit (number 1 of 2026-27) |
| `SRMC-AS-0000013` / `SRMC-AS-13` | Assessment question, before `AS` was renamed `AQ`; read as `AQ` |
| `SRMC-QB-5549` (no padding) | Same question as `SRMC-QB-0005549` |
| `DRF-7K2M9QX4` (8 characters, no type) | Question draft ID |
| Version fields (`currentVersion`, `versionHistory`, …) on old questions | Ignored |

A record that already has a permanent ID in an older form **keeps it** (for example on republish); it is not reissued.

---

## 10. What must change before real use (frontend + backend)

1. **Issue IDs on the server.** The reference code issues permanent IDs in the browser (counters in `localStorage`: `vx-qid-sequences`), which can give two users the same number. In production, the server must issue each permanent ID in **one atomic step** when the triggering event happens (assign, publish, approve), and the frontend must show what the server returns.
2. **Reserve `DRF`** on the server too: refuse any institution code starting with `DRF`.
3. **Convert stored IDs.** Existing browser data still holds older forms (section 9). Convert them once to the current forms, or keep them as aliases so the old ID is still found by search.

---

## 11. Acceptance checklist

- [ ] Each type gets a draft ID at the step in section 2, and its permanent ID **only** at the trigger in the summary table.
- [ ] A blueprint never sent for approval still shows `DRF-BP-…` after its assessment is published.
- [ ] Permanent IDs never change, including on republish, re-approval and edits by the author.
- [ ] No number is issued twice, including after deleting records or clearing the counter.
- [ ] Question IDs are 7 digits, record IDs 5; nothing exceeds 12 digits.
- [ ] Every issued ID passes the check digit; a one-digit typo or a swap of two digits is rejected and gets a suggestion in search.
- [ ] `DRF-AP-VBP442` and any other draft is never read as a permanent ID.
- [ ] `SRMC-QB-5549` and `SRMC-QB-0005549` find the same question.
- [ ] Older forms in section 9 are shown, searched and kept.
- [ ] Draft chips are dashed grey, permanent chips solid blue, in light and dark themes; IDs never truncate.
- [ ] Every ID has a copy button; copying inside a card does not open the card.
- [ ] No v1 / v2 label anywhere.
- [ ] The ID guide matches `docs/ID_GUIDE.md` and works at phone width.

---

## 12. Reference implementation (this repository)

| File | What it holds |
|---|---|
| `src/utils/qid.js` | Permanent IDs: format, check digit, widths, 12-digit maximum, part-by-part reading, comparison and sorting (`compareQids`), counters (`mintQids`, `mintRecordId`) |
| `src/utils/draftReference.js` | All draft IDs: `createDraftRecordCode`, question draft registry, typed-draft matching |
| `src/utils/periodRecordId.js` | Reading the older year-based assessment / blueprint IDs; `isPermanentRecordId` (current or older form) |
| `src/utils/recordCodes.js` | Skill activity IDs (draft and permanent, sample reservation, history aliases) and sample assessment IDs |
| `src/services/assessmentIdentity.js` | Assessment draft ID on create, permanent ID on publish |
| `src/services/blueprintApproval.js` | Blueprint draft ID, permanent ID on approval |
| `src/utils/questionBankIdentity.js`, `src/utils/questionLifecycle.js` | Question Bank IDs on approval; assessment question IDs on publish |
| `src/utils/questionSearch.js` | Search by ID, number, draft ID, assessment ID; typo suggestions |
| `src/utils/questionContent.js` | Content comparison used for "edited since added" |
| `src/components/CopyableId.jsx`, `src/components/CopyIdBadge.jsx` | ID chip with copy button |
| `src/components/IdGuideDialog.jsx` (+ `.css`) | The ID guide (legend) |
| `docs/ID_GUIDE.md` | The ID guide text, for reference |
| `*.test.js` next to each file above | Tests for every rule here (run: `node --test` over `src/**/*.test.js`) |
