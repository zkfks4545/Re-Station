# mission_control 읽기 가이드

> 최종 갱신일: 2026-06-23  
> 목적: `mission_control` 문서가 많아졌을 때 작업자가 먼저 읽을 파일과 필요할 때만 확인할 파일을 구분한다.

## 읽기 원칙

새 작업을 시작할 때 모든 문서를 처음부터 끝까지 읽지 않는다. 먼저 필독 파일로 현재 방향과 금지선을 확인하고, 작업 범위에 따라 선택 파일을 추가로 연다.

## 필독 파일

| 순서 | 파일 | 읽는 이유 |
|---|---|---|
| 1 | `mission_control/README.md` | 현재 문서 진입점과 읽기 우선순위 |
| 2 | `mission_control/CURRENT_STATE.md` | 현재 구현 상태, 검증 상태, 다음 우선순위 |
| 3 | `mission_control/HANDOVER.md` | 작업 인수인계, 주의사항, 최신 흐름 |
| 4 | `mission_control/TASK_BOARD.md` | 작업 ID, 상태, 완료 조건 |
| 5 | `mission_control/DECISIONS.md` | 변경하면 안 되는 핵심 결정과 승인된 방향 |
| 6 | `mission_control/CONVERGENCE_PRINCIPLES.md` | DLG-807~809 수렴 기간의 최상위 원칙 |

## 선택적 수정 및 검토 파일

| 파일 | 열어야 하는 경우 |
|---|---|
| `mission_control/EXTERNAL_STRUCTURE_REPORT.md` | 외부 AI, 기획 협업자, 장기 구조 설명이 필요할 때 |
| `mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md` | 외부 구조 보고서를 새로 쓰거나 갱신할 때 |
| `mission_control/ARCHITECTURE.md` | 앱 구조, 모듈 경계, 데이터 흐름을 자세히 확인할 때 |
| `mission_control/PROJECT_VISION.md` | 제품 목표, MVP 성공 기준, 사용자 경험 방향을 확인할 때 |
| `mission_control/CHARACTER_DESIGN.md` | 카루아/시에스타 말투, 금지 패턴, 캐릭터 검수가 필요할 때 |
| `mission_control/AI_WORKFLOW.md` | AI 작업 절차, 기록 방식, 협업 규칙을 확인할 때 |
| `mission_control/WORK_LOG.md` | 과거 작업의 세부 이력, 수정 파일, 검증 결과를 추적할 때 |

## 수정 기준

- 현재 상태나 검증 결과가 바뀌면 `CURRENT_STATE.md`를 갱신한다.
- 작업 ID, 상태, 완료 조건이 바뀌면 `TASK_BOARD.md`를 갱신한다.
- 작업자가 이어받아야 할 맥락이 바뀌면 `HANDOVER.md`를 갱신한다.
- 되돌리기 어려운 방향성 결정은 `DECISIONS.md`에 남긴다.
- 외부 공유용 큰 그림이 바뀌면 `EXTERNAL_STRUCTURE_REPORT.md`를 갱신한다.
- `EXTERNAL_STRUCTURE_REPORT.md`를 갱신하기 전에는 `EXTERNAL_STRUCTURE_REPORT_GUIDE.md`의 작성 원칙을 확인한다.
- 세부 작업 이력과 검증 결과는 `WORK_LOG.md`에 남긴다.

## 현재 문서화 메모

`EXTERNAL_STRUCTURE_REPORT.md`는 외부 기획 협업을 위해 작성된 독립 구조 보고서다. 구현 지시서가 아니라, 현재 시스템 구조와 대사/추천 계층의 분리 원칙을 설명하는 공유용 문서로 취급한다.

`EXTERNAL_STRUCTURE_REPORT_GUIDE.md`는 해당 보고서를 계속 갱신하기 위한 작성 가이드다. 외부 AI와 반복적으로 기획을 이어갈 때 어떤 내용을 포함하고, 무엇을 요청하면 안 되는지 이 문서를 기준으로 판단한다.
