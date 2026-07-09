# EXTERNAL_STRUCTURE_REPORT 작성 가이드

> 최종 갱신일: 2026-07-09
> 대상 문서: `mission_control/EXTERNAL_STRUCTURE_REPORT.md`
> 목적: 외부 구조 보고서를 장기 유지 가능한 구조 지도 문서로 유지하기 위한 작성 기준

## 1. 문서 책임

`EXTERNAL_STRUCTURE_REPORT.md`는 Re:Station의 현재 구조를 한눈에 파악하기 위한 구조 지도다.

이 문서는 다음 정보를 소유한다.

- 프로젝트의 핵심 목적과 설계 원칙
- 런타임 흐름과 주요 모듈의 책임
- 도메인 간 책임 경계
- 데이터 소유권과 정보 흐름
- 외부 AI 또는 기획자가 알아야 할 구조적 제약
- 장기적으로 유지되는 확장 지점

이 문서는 다음 정보를 소유하지 않는다.

- Phase 진행률
- 작업 로그
- 테스트 통과 수
- 번들 크기
- 커밋 해시나 현재 작업 브랜치
- 다음 작업 목록
- 일회성 리뷰 지시
- 특정 날짜의 완료 보고

## 2. 정보 소유권

하나의 정보는 하나의 문서만 소유한다. 구조보고서는 다른 문서의 내용을 복사하지 않고, 필요한 경우 짧게 참조한다.

| 정보 | 소유 문서 |
|---|---|
| 구조, 모듈 책임, 런타임 흐름, 책임 경계 | `EXTERNAL_STRUCTURE_REPORT.md` |
| 현재 구현 상태, 검증 결과, 번들 크기 | `CURRENT_STATE.md` |
| 작업 ID, 완료 조건, 남은 작업 | `TASK_BOARD.md` |
| 작업 이력, 변경 파일, 검증 기록 | `WORK_LOG.md` |
| 인수인계, 최신 흐름, 주의사항 | `HANDOVER.md` |
| 구조보고서 작성 규칙 | `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` |

구조보고서가 상태성 정보를 언급해야 할 때는 세부 내용을 복사하지 않고 해당 문서를 참조한다.

## 3. 작성 원칙

1. 구조를 설명하고, 작업 상황을 설명하지 않는다.
2. 현재 구현의 사실과 앞으로의 희망 사항을 분리한다.
3. 외부 AI가 빠르게 이해해야 하는 경계와 흐름을 우선한다.
4. 같은 규칙을 여러 섹션에 반복하지 않는다.
5. 파일 경로는 실제 코드 경로를 쓴다.
6. 문서를 길게 만드는 것보다 중복을 줄이고 책임을 분명히 하는 것을 우선한다.
7. 임시 판단, 리뷰 코멘트, 수정 지시는 구조보고서에 남기지 않는다.

## 4. 갱신 기준

다음 변화가 있을 때 구조보고서를 갱신한다.

- 주요 모듈의 책임 경계가 바뀐 경우
- 런타임 흐름이나 데이터 흐름이 바뀐 경우
- 추천, 대화, 세션, 캐릭터, WebLLM 등 핵심 도메인의 소유권이 바뀐 경우
- 외부 AI에게 전달해야 하는 구조적 제약이 바뀐 경우
- 장기 확장 지점이 추가되거나 폐기된 경우

다음 변화만으로는 구조보고서를 갱신하지 않는다.

- Phase 진행률 변경
- 테스트 수 또는 번들 크기 변경
- 한 작업의 완료 여부
- 단순 버그 수정
- 작업 우선순위 변경
- 임시 아이디어나 검토 메모

## 5. 권장 목차

구조보고서는 다음 흐름을 기본으로 한다.

1. 문서 사용법
2. Project Overview
3. Core Design Principles
4. Runtime Architecture
5. Major Modules
6. Responsibility Boundaries
7. Dialogue Architecture
8. Recommendation Architecture
9. Session and Context
10. ResponsePlan and Data Ownership
11. Character and External Collaboration
12. Extension Points

필요하면 섹션을 추가할 수 있지만, 새 섹션이 기존 섹션의 책임을 반복하면 안 된다.

## 6. 외부 AI 전달 기준

외부 AI에게는 보통 다음 문서를 함께 전달한다.

1. `mission_control/EXTERNAL_STRUCTURE_REPORT.md`
2. `mission_control/CONVERGENCE_PRINCIPLES.md`
3. 현재 요청 또는 과제 문장

말투 검토가 필요하면 `mission_control/CHARACTER_DESIGN.md` 또는 `bar_tend/src/lib/bartender/persona.ts`의 관련 부분을 추가한다.

구현 구조 검토가 필요하면 `mission_control/ARCHITECTURE.md`를 추가한다.

외부 AI에게 요청하기 좋은 작업은 다음과 같다.

- 캐릭터 말투 금지 규칙 정리
- intent별 문단 구조 설계
- `reaction / recommend / explanation / answer` 블록 샘플
- 상태와 요청별 대사 구조 설계
- 시에스타와 바텐더의 말투 차이
- 대사 QA 체크리스트

외부 AI에게 요청하지 않는 작업은 다음과 같다.

- 바로 코드 구현
- 추천 알고리즘 교체
- DB에 없는 칵테일 사실 생성
- 출처 없는 역사, 유래, 창작 정보 생성
- WebLLM이 추천 결과를 정하게 하는 구조
- 바텐더를 상담가처럼 만드는 대화 구조
- 시에스타를 상시 대화 캐릭터로 확장하는 설계

## 7. Self Review

구조보고서를 갱신하기 전에 다음을 확인한다.

- [ ] 진행률이 포함되어 있지 않은가
- [ ] 테스트 수가 포함되어 있지 않은가
- [ ] 번들 크기가 포함되어 있지 않은가
- [ ] 작업 로그가 포함되어 있지 않은가
- [ ] 특정 날짜의 완료 보고가 포함되어 있지 않은가
- [ ] Runtime Architecture가 충분히 설명되는가
- [ ] Responsibility Boundary가 명확한가
- [ ] Data Ownership이 설명되는가
- [ ] 장기적으로 유지될 설명인가
- [ ] 외부 AI가 알아야 하는 내용인가
- [ ] 다른 문서와 책임이 중복되지 않는가
- [ ] 기존 설명을 대체하지 않고 단순히 덧붙인 부분은 없는가
