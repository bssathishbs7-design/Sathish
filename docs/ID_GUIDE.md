# ID guide

What each ID means and when it is given. Draft IDs are temporary; the others never change.

## How an ID changes

**Created** → *gets* → `DRF-AP-7K2M9Q` (Temporary) → *assigned, published or approved* → `SRMC-AP-00149` (Permanent, never changes)

## Reading an ID

| | | |
|---|---|---|
| `SRMC` | **Institution** | MED for Medsy, DRF for drafts |
| `AP` | **Type** | SA, AP, BP, QB or AQ |
| `00149` | **Number** | Counts up and never restarts. The last digit is a check digit |

| | | |
|---|---|---|
| Questions (QB, AQ) | **7 digits** | `SRMC-QB-0000130` |
| Skill activity, assessment, blueprint (SA, AP, BP) | **5 digits** | `SRMC-AP-00149` |
| Maximum, any type | **12 digits** | `SRMC-QB-999999999999` |

Every type uses the same shape. The check digit catches a mistyped ID. A draft ID has random letters in place of the number (DRF-AP-7K2M9Q) and is replaced by the permanent ID.

## Skills

`DRF-SA-9QH3WD` → *First assigned* → `SRMC-SA-00125`

| | | |
|---|---|---|
| `DRF-SA-9QH3WD` | **Skill activity draft** | Given when the activity is created in Configuration. Used until the activity is first assigned. |
| `SRMC-SA-00125` | **Assigned skill activity** | Replaces the draft ID when the activity is first assigned. The same ID shows on Evaluation, Dashboard, My Skill Activity and the Logbook. |

## Assessment

`DRF-AP-7K2M9Q` (Draft or waiting for approval) → *Published* → `SRMC-AP-00149`

| | | |
|---|---|---|
| `DRF-AP-7K2M9Q` | **Assessment draft** | Given when the assessment is created. Used while it is a draft or waiting for approval. |
| `SRMC-AP-00149` | **Published assessment** | Replaces the draft ID when the assessment is published, directly or after approval; never changes after that. Earlier ones read SRMC-AP-26-01 and stay valid. |

## Blueprint

`DRF-BP-4F7Q2M` (Never sent for approval: stays a draft) → *Approved* → `SRMC-BP-00037` (Kept through revisions)

| | | |
|---|---|---|
| `DRF-BP-4F7Q2M` | **Blueprint draft** | Paired with its assessment draft until the blueprint is approved. Deleting the assessment deletes its blueprint. |
| `SRMC-BP-00037` | **Approved blueprint** | Given when the blueprint is approved. It is stored in Saved Templates for reuse, stays there if the assessment is deleted, and keeps the same ID through revisions. Earlier ones read SRMC-BP-26-01 and stay valid. |

## Question Bank

`DRF-QB-7K2M9Q` → *Approved* → `SRMC-QB-0000130` → *Own edit approved* → `SRMC-QB-0000130` (Same ID, no version)

`DRF-AQ-3PX8RN` → *Assessment published* → `SRMC-AQ-0000130` → *Sent to the bank, approved* → `SRMC-QB-0000149` (New ID)

**Medsy** → *Supplied* → `MED-QB-0000013` → *Edited, approved* → `SRMC-QB-0000158` (New ID)

| | | |
|---|---|---|
| `DRF-QB-7K2M9Q` | **Question draft** | A new or edited Question Bank question before approval. Earlier drafts read DRF-7K2M9QX4 and stay valid. |
| `SRMC-QB-0000130` | **Institution question** | Replaces the draft ID when the question is approved into the Question Bank. An approved edit keeps the ID and adds a version (v1, v2…). |
| `DRF-AQ-3PX8RN` | **Assessment question draft** | A question written or edited inside an assessment, until that assessment is published. |
| `SRMC-AQ-0000130` | **Assessment question** | Replaces the draft ID when its assessment is published. Earlier ones read SRMC-AS-… and stay valid. |
| `MED-QB-0000013` | **Medsy question** | Supplied by Medsy. Editing one creates a new institution question after approval. |
