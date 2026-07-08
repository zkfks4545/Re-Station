# EXTERNAL_STRUCTURE_REPORT.md — 문서 검토

> 기준: `mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md` (2026-07-08 갱신)  
> 검토일: 2026-07-08  
> 상태: **위반 사항 존재 — 정리 필요**

---

## 1. 헤더 메타데이터 (라인 4-8)

| 위치 | 내용 | 위반 사유 |
|---|---|---|
| L4 | `최종 갱신일: 2026-07-08 (Phase 10 Farewell Formatter slice 2A 반영)` | Phase별 slice 완료를 기록 — 작업 로그 성격. 갱신일만 남기고 괄호 설명 제거 |
| L8 | `현재 구현 기준: abddb95 + 현재 작업 트리의 Phase 10 ...` | 작업 트리 기반 현재 시점 고정 — 진행 상황 추적. 아키텍처 문서에 불필요 |

**권장**: 헤더를 단순화한다.
```
> 최종 갱신일: 2026-07-08
> 목적: ...
> 대상 경로: bar_tend/
> 작성·갱신 기준: mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md
```

---

## 2. 섹션 3 — 핵심 경계 (라인 58)

> `Phase 10은 전체 92%이며 Recommendation Formatter 4/4와 Welcome Formatter, Farewell Formatter slice 2A는 완료했다.`

**위반**: 진행률(%)과 slice 완료 상태를 핵심 경계 원칙에 포함 — CURRENT_STATE.md로 이동

**권장**: 핵심 경계 원칙 12번에서 진행률과 slice 정보를 제거한다. 대신 "Phase 1~9와 DLG-807 전체 대사 감사는 완료되었다. ResponsePlan DB 이관이 진행 중이며 상세 진행 상태는 CURRENT_STATE.md를 참조한다."로 대체.

---

## 3. 섹션 4.3 — 대사 데이터 (라인 142, 143, 151-159)

| 위치 | 내용 | 위반 사유 |
|---|---|---|
| L142 | `formatter plan 29개·template line 111개 포함` | 마이그레이션 산출물 개수 — 가변적 수치 |
| L143 | `Recommendation/Welcome/Farewell Formatter 전용 ... slice 2A` | slice 완료 상태 기록 |
| L151-159 | `Phase 10 시작 시점의 이관 출처 인벤토리` 전체 표 | 마이그레이션 일지 — WORK_LOG 또는 HANDOVER 소유 |

**권장**: response-plan-data.ts 설명에서 plan/template line 개수 제거. 4.3의 이관 출처 인벤토리 표 전체를 제거하고 핵심 대사 데이터 계층만 설명하도록 축소.

---

## 4. 섹션 5.1 — Recommendation Formatter 사전 조사 (라인 279-343)

전체가 **Phase 10 마이그레이션 경계 조사 보고서**다.

| 위치 | 내용 | 위반 사유 |
|---|---|---|
| L279-313 | SAFE TO MIGRATE / DO NOT MIGRATE 표 | 이관 결정 — HANDOVER 또는 TASK_BOARD |
| L316-318 | `4/4 완료`, `Welcome Formatter는 ... 완료` | slice 완료 상태 |
| L322-328 | Farewell Formatter slice 1/slice 2A 상세 완료 보고 | 마이그레이션 일지 |
| L330-343 | safety-alert, 정보 요청 라우팅 설명 (중복 — 4.2/4.3에 분산) | 중복 |

**권장**: 섹션 5.1 전체를 제거한다. ResponsePlan의 역할과 책임 경계는 새 섹션 9(ResponsePlan)로 축약하여 옮기고, 마이그레이션 결정 상세는 HANDOVER.md로 이동한다.

---

## 5. 섹션 6.5 — Response Pipeline (라인 477)

> `Recommendation Formatter는 randomPick, exact, nearest fallback 본문, acknowledgement/lead-in 4/4를 이관했고 Welcome Formatter는 body+feedback을 완료했으며 Farewell Formatter는 slice 2A까지 완료했다.`

**위반**: migration progress detail. Response Pipeline의 계약 설명에 진행률이 포함됨.

**권장**: "response-plan.ts의 필수 expression 계약과 이중 읽기 어댑터가 연결되어 있으며 대화 category와 formatter 영역이 ResponsePlan 우선으로 동작한다. 상세 이관 상태는 CURRENT_STATE.md를 참조한다."로 대체.

---

## 6. 섹션 10.2 — 대사 데이터 표 (라인 632)

> `대화 14개 category, Recommendation Formatter 4/4, Welcome Formatter 완료, Farewell Formatter slice 2A 완료`

**위반**: 동일한 migration progress detail이 데이터 구조 섹션에 중복 출현.

**권장**: "ResponsePlan 계약: response-plan.ts, 필수 expression·문자열 line 금지·validator 강제"까지만 남기고 이관 상태는 제거한다.

---

## 7. 섹션 11.3 — Phase 9 감사 상세 (라인 676-686)

전체가 **완료된 Phase 9의 상세 작업 보고**다.

| 내용 | 위반 사유 |
|---|---|
| 525개 문자열, 55개 카테고리·436개 문장 수치 | 완료된 작업의 세부 산출물 수치 — TASK_BOARD나 WORK_LOG에 기록 완료 |
| 3건 위반 사례 원문/수정 대조표 | 마이그레이션 수정 이력 |

**권장**: "Phase 9에서 전체 대사 감사를 완료했으며 금지 패턴 3건을 수정했다. 상세는 WORK_LOG.md를 참조한다." 한 줄로 축약.

---

## 8. 섹션 14 — 추천 후속 작업 순서 (라인 810-835)

Phase 1~15 전체 로드맵을 각 상태(완료/진행 중/계획)와 함께 나열.

**위반**: TASK_BOARD.md가 소유하는 정보를 통째로 복사. 로드맵 전체가 외부 보고서에 들어갈 내용이 아니다.

**권장**: "Phase 진행 로드맵은 mission_control/TASK_BOARD.md를 참조한다." 한 줄로 대체.

---

## 9. 섹션 15 — 현재 검증 상태 (라인 838-852)

| 내용 | 위반 사유 |
|---|---|
| 테스트 46개 파일·666개 | CURRENT_STATE.md 소유 |
| 번들 사이즈 532.48 kB / gzip 158.46 kB | CURRENT_STATE.md 소유 |
| WebLLM Worker 크기, CSS 크기 | 운영 수치 — 외부 기획자에게 불필요 |
| 타입체크/린트/빌드 통과 여부 | 검증 보고서 — CURRENT_STATE.md 소유 |

**권장**: "검증 상태는 mission_control/CURRENT_STATE.md를 참조한다." 한 줄로 대체.

---

## 10. 섹션 17 — 현재 후속 작업 요약 (라인 870-919)

| 내용 | 위반 사유 |
|---|---|
| Phase 10 Progress Dashboard (ASCII 차트 + 백분율 + 산정 기준) | 진행률 대시보드 — CURRENT_STATE.md 또는 TASK_BOARD.md |
| 트랙 B/C/D 설명 | 카테고리화된 작업 목록 — TASK_BOARD.md |
| `당장 시작 가능한 작업` 5항목 | TASK_BOARD.md 소유 |

**권장**: 섹션 17 전체를 제거한다. 트랙 설명이 정말로 필요하다면 "WebLLM 의미 보조와 대사 출처 정상화가 주요 후속 트랙이다. 상세 작업 상태는 TASK_BOARD.md를 참조한다." 한 줄로 충분.

---

## 종합 요약

| 구분 | 제거/축소 권장 내용 | 이동 대상 문서 |
|---|---|---|
| 진행률 | Phase 92%, slice 4/4, 2A, plan 29개, line 111개 | CURRENT_STATE.md |
| 마이그레이션 상세 | SAFE TO MIGRATE 표, slice 완료 보고, 이관 출처 인벤토리 | HANDOVER.md, WORK_LOG.md |
| 로드맵 | Phase 1~15 전체 목록, 트랙 A/B/C/D | TASK_BOARD.md |
| 검증 상태 | 테스트 수, 번들 크기, 빌드 결과 | CURRENT_STATE.md |
| 작업 목록 | "당장 시작 가능한 작업" 5항목 | TASK_BOARD.md |
| 감사 상세 | 525개 문자열, 3건 수정 대조표 | WORK_LOG.md |

**예상 축소 효과**: 350~400줄(40~45%) 감소. 문서가 아키텍처와 책임 경계 설명에 집중하게 된다.
