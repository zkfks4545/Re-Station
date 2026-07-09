# mission_control 문서 포털

> 최종 갱신일: 2026-07-09
> 목적: `mission_control`의 문서 책임, 읽는 순서, 정보 소유권을 한눈에 안내한다.

## 1. 원칙

`mission_control`의 목표는 문서 수를 최소화하는 것이 아니라, 필요한 문서를 빠르게 찾고 오래 유지할 수 있게 만드는 것이다.

- 하나의 정보는 하나의 문서만 소유한다.
- README는 내용을 중복 저장하지 않고 문서로 안내하는 포털 역할만 한다.
- 새 작업자는 모든 문서를 읽지 않는다. 작업 유형에 맞는 경로만 읽는다.
- 진행 상황, 작업 이력, 구조 설명, 제품 철학, 캐릭터 규칙을 섞지 않는다.
- 문서 삭제는 마지막 단계다. 먼저 책임을 분리하고 중복을 줄인다.

## 2. 빠른 시작

대부분의 작업자는 아래 순서만 읽고 시작한다.

| 순서 | 문서 | 이유 |
|---|---|---|
| 1 | `README.md` | 문서 포털과 읽는 경로 확인 |
| 2 | `CURRENT_STATE.md` | 현재 구현 상태, 검증 상태, 다음 우선순위 확인 |
| 3 | `HANDOVER.md` | 직전 작업자가 남긴 이어받을 맥락 확인 |
| 4 | `TASK_BOARD.md` | 작업 ID, 범위, 완료 조건 확인 |
| 5 | `DECISIONS.md` | 바꾸면 안 되는 핵심 결정 확인 |

작업이 캐릭터, 세션, 구조, 외부 AI, WebLLM에 닿으면 아래의 상황별 문서를 추가로 읽는다.

## 3. 상황별 읽기 경로

| 작업 유형 | 먼저 읽을 문서 | 다음에 읽을 문서 |
|---|---|---|
| 일반 구현 | `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md` | `ARCHITECTURE.md`, `DECISIONS.md` |
| 대사·말투·캐릭터 | `CHARACTER_DESIGN.md` | `CONVERGENCE_PRINCIPLES.md`, `PROJECT_VISION.md` |
| 세션 종료·XYZ·Farewell | `SESSION_FLOW_SPEC.md` | `CURRENT_STATE.md`, `ARCHITECTURE.md` |
| 추천·대화 구조 | `ARCHITECTURE.md` | `EXTERNAL_STRUCTURE_REPORT.md`, `DECISIONS.md` |
| 외부 AI 협업 | `EXTERNAL_STRUCTURE_REPORT.md` | `EXTERNAL_STRUCTURE_REPORT_GUIDE.md`, `CONVERGENCE_PRINCIPLES.md` |
| WebLLM 의미 보조 | `DECISIONS.md` | `ARCHITECTURE.md`, `CURRENT_STATE.md` |
| 작업 절차·기록 방식 | `AI_WORKFLOW.md` | `WORK_LOG.md`, `TASK_BOARD.md` |
| 과거 변경 추적 | `WORK_LOG.md` | 관련 커밋 |
| 제품 방향성 확인 | `PROJECT_VISION.md` | `DECISIONS.md`, `CHARACTER_DESIGN.md` |

## 4. 문서별 책임

### 포털

| 문서 | 소유하는 정보 | 소유하지 않는 정보 |
|---|---|---|
| `README.md` | 문서 목록, 읽는 순서, 정보 소유권, 갱신 기준 | 실제 작업 상태, 상세 로그, 설계 본문 |

### 현재 작업 운영

| 문서 | 소유하는 정보 | 소유하지 않는 정보 |
|---|---|---|
| `CURRENT_STATE.md` | 현재 구현 상태, 검증 상태, 현재 우선순위, 주요 이슈 | 세부 작업 이력, 장기 철학, 전체 작업 보드 |
| `HANDOVER.md` | 다음 작업자가 바로 이어받아야 할 맥락, 주의사항, 최근 흐름 | 모든 완료 작업의 상세 기록, 장기 로드맵 |
| `TASK_BOARD.md` | 작업 ID, 상태, 범위, 완료 조건, 계획 | 실제 수행 이력, 검증 로그 전문 |
| `WORK_LOG.md` | 날짜별 작업 이력, 변경 내용, 검증 결과 | 현재 우선순위, 장기 설계 원칙 |

### 장기 기준

| 문서 | 소유하는 정보 | 소유하지 않는 정보 |
|---|---|---|
| `PROJECT_VISION.md` | 제품 철학, MVP 범위, 핵심 가치, 성공 기준 | 현재 진행률, 작업 상세 |
| `DECISIONS.md` | 되돌리기 어려운 승인 결정과 대체·폐기 이력 | 매 작업의 실행 로그 |
| `CHARACTER_DESIGN.md` | 카루아·시에스타 말투, 금지 패턴, 관계성, 캐릭터 검수 기준 | 구현 진행 상황, 테스트 수 |
| `SESSION_FLOW_SPEC.md` | 웰컴, 추천, 주문, XYZ, Farewell, 귀가 흐름의 세션 계약 | 현재 작업 우선순위 |
| `CONVERGENCE_PRINCIPLES.md` | 대사·캐릭터 수렴 기간의 최상위 품질 원칙 | 일반 작업 로그, 구조 상세 |

### 구조와 외부 협업

| 문서 | 소유하는 정보 | 소유하지 않는 정보 |
|---|---|---|
| `ARCHITECTURE.md` | 내부 개발자를 위한 앱 구조, 기술 스택, 데이터 흐름, 구조 위험 | 외부 AI 브리핑, 작업 진행률 |
| `EXTERNAL_STRUCTURE_REPORT.md` | 외부 AI와 기획자가 볼 구조 지도, 책임 경계, 데이터 소유권 | 테스트 수, 번들 크기, 작업 로그 |
| `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` | 구조보고서 작성 기준, Self Review, 정보 소유권 규칙 | 프로젝트 구조 본문 |

### 특수 목적

| 문서 | 소유하는 정보 | 소유하지 않는 정보 |
|---|---|---|
| `AI_WORKFLOW.md` | AI 작업자 시작·수행·종료 절차, 기록 규칙 | 프로젝트 상태 본문 |

## 5. 정보 소유권

| 정보 | 소유 문서 |
|---|---|
| 현재 구현 상태 | `CURRENT_STATE.md` |
| 검증 상태, 테스트 수, 번들 크기 | `CURRENT_STATE.md` |
| 작업 ID, 상태, 완료 조건 | `TASK_BOARD.md` |
| 세부 작업 이력과 검증 실행 기록 | `WORK_LOG.md` |
| 다음 작업자가 이어받을 맥락 | `HANDOVER.md` |
| 장기 제품 방향 | `PROJECT_VISION.md` |
| 승인된 결정 | `DECISIONS.md` |
| 캐릭터 말투와 금지 패턴 | `CHARACTER_DESIGN.md` |
| 세션 흐름 계약 | `SESSION_FLOW_SPEC.md` |
| 내부 앱 구조 | `ARCHITECTURE.md` |
| 외부 협업용 구조 지도 | `EXTERNAL_STRUCTURE_REPORT.md` |
| 구조보고서 작성 규칙 | `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` |
| WebLLM 의미 보조 계약 | `DECISIONS.md`, `ARCHITECTURE.md` |

중복이 생기면 위 표의 소유 문서를 남기고 다른 문서는 링크나 짧은 참조로 바꾼다.

## 6. 갱신 기준

| 변경 내용 | 갱신 문서 |
|---|---|
| 구현 상태, 검증 결과, 다음 우선순위 변경 | `CURRENT_STATE.md` |
| 작업 범위, 상태, 완료 조건 변경 | `TASK_BOARD.md` |
| 이어받을 맥락, 주의사항, 최근 흐름 변경 | `HANDOVER.md` |
| 실제 수행 이력이나 검증 실행 추가 | `WORK_LOG.md` |
| 되돌리기 어려운 방향성 결정 | `DECISIONS.md` |
| 제품 목표나 MVP 기준 변경 | `PROJECT_VISION.md` |
| 캐릭터 말투나 금지 패턴 변경 | `CHARACTER_DESIGN.md` |
| 세션 단계와 종료 정책 변경 | `SESSION_FLOW_SPEC.md` |
| 내부 모듈 구조나 데이터 흐름 변경 | `ARCHITECTURE.md` |
| 외부 AI에게 전달할 구조 지도가 변경 | `EXTERNAL_STRUCTURE_REPORT.md` |
| 문서 체계와 읽는 순서 변경 | `README.md` |

## 7. 압축 검토 대상

아래 문서는 바로 삭제하지 않는다. 먼저 책임이 다른 문서에 흡수 가능한지 검토한다.

| 문서 | 검토 방향 |
|---|---|
| `HANDOVER.md` | `CURRENT_STATE.md`와 병합하지 않고 유지. 단, 상태 요약 중복을 줄여 이어받기 전용 문서로 축소 |
| `CONVERGENCE_PRINCIPLES.md` | 임시 수렴 원칙을 장기 캐릭터·제품 원칙으로 흡수할지 판단 |
| `TASK_BOARD.md` | 오래된 완료 작업 상세를 요약 또는 인덱스화 |
| `WORK_LOG.md` | 오래된 작업 기록을 1줄 인덱스로 압축하고 최근 기록만 상세 유지 |

## 8. 유지보수 체크리스트

문서를 갱신하기 전에 확인한다.

- [ ] 이 정보의 소유 문서가 맞는가
- [ ] 같은 내용을 다른 문서에도 쓰고 있지 않은가
- [ ] 진행 상황과 장기 원칙을 섞지 않았는가
- [ ] 오래된 완료 기록을 불필요하게 상세히 남기지 않았는가
- [ ] README의 읽는 경로가 바뀌어야 하는가
- [ ] 외부 AI와 내부 작업자가 각각 필요한 문서를 찾을 수 있는가
