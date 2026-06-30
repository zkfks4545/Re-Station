# Mission Control Project README

## Mission Control - Consensus Building Framework

This document provides the required reading guidance for all Mission Control contributors.

## Effective Reading Principles

When starting new work, do not read all documents sequentially. Instead:

1. **First** read the mandatory files in order (steps 1-7 below)
2. **Then** selectively open only the files relevant to your specific task scope

## Required Reading Files

| Priority | File | Reason for Reading |
|----------|------|-------------------|
| **1** | `README.md` | Current document - entry point and reading priority |
| **2** | `CURRENT_STATE.md` | Current implementation status, verification status, next priorities |
| **3** | `HANDOVER.md` | Work handover, precautions, latest flow |
| **4** | `TASK_BOARD.md` | Task IDs, status, completion criteria |
| **5** | `DECISIONS.md` | Core decisions that cannot be changed, approved directions |
| **6** | `CONVERGENCE_PRINCIPLES.md` | DLG-807~809 convergence period's top principles |
| **7** | `SESSION_FLOW_SPEC.md` | XYZ, Farewell Phase, session flow that leads to returnHome |

## Optional/Review Files

| File | Open When...
|------|-------------------
| `EXTERNAL_STRUCTURE_REPORT.md` | External AI, planning collaboration, long-term structure needed |
| `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` | New external structure report or updating existing one |
| `ARCHITECTURE.md` | App structure, module boundaries, data flow details needed |
| `PROJECT_VISION.md` | Product goals, MVP success criteria, user experience direction |
| `CHARACTER_DESIGN.md` | Karua/Siesta speech pattern, banned patterns, character inspection needed |
| `AI_WORKFLOW.md` | AI work procedures, recording methods, collaboration rules |
| `WORK_LOG.md` | Detailed history of past work, modified files, verification results |
| `REFACTORING_LOG.md` | Operation-preserving refactoring issues, improvement reasons, changes, expected effects |

## Modification Guidelines

### When to Update Files:

- **Current State/Verification Results Change**: Update `CURRENT_STATE.md`
- **Task IDs, Status, Completion Criteria Change**: Update `TASK_BOARD.md`
- **Worker Context Changes**: Update `HANDOVER.md`
- **Irreversible Directional Decisions**: Record in `DECISIONS.md`
- **External sharing 'big picture' Changes**: Update `EXTERNAL_STRUCTURE_REPORT.md`
- **Before Updating `EXTERNAL_STRUCTURE_REPORT.md`**: Check `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` writing principles
- **Detailed operation histories and verification results**: Record in `WORK_LOG.md`

### Documentation Notes

`EXTERNAL_STRUCTURE_REPORT.md` is an independent structure report written for external planning collaboration. It is not an implementation instruction, but a shared document that explains the current system structure and the separation principles of the dialogue/recommendation hierarchy.

`EXTERNAL_STRUCTURE_REPORT_GUIDE.md` provides writing principles for continuously updating that report. When working with external AIs or planning collaborators repeatedly, use this document to judge what content to include and what to exclude.
