# 인수인계

> 최종 갱신일: 2026-07-22
> 목적: 다음 작업자가 추가 질문 없이 바로 이어받을 수 있는 행동 맥락만 남긴다.

## 1. 먼저 읽을 문서

| 순서 | 문서 | 이유 |
|---|---|---|
| 1 | `mission_control/README.md` | 문서 포털과 정보 소유권 확인 |
| 2 | `mission_control/CURRENT_STATE.md` | 현재 상태, 검증 상태, 우선순위 확인 |
| 3 | `mission_control/TASK_BOARD.md` | 작업 ID, 범위, 완료 조건 확인 |
| 4 | `mission_control/DECISIONS.md` | 변경하면 안 되는 결정 확인 |
| 5 | `mission_control/WORK_LOG.md` | 최근 작업 이력과 검증 기록 확인 |

대사·말투 작업이면 `CHARACTER_DESIGN.md`, 시에스타 이벤트 작업이면 `SIESTA.md`, 세션 종료 작업이면 `SESSION_FLOW_SPEC.md`, 구조 작업이면 `ARCHITECTURE.md`와 `EXTERNAL_STRUCTURE_REPORT.md`를 추가로 읽는다.

## 2. 현재 이어받을 위치

- 현재 상태 스냅샷은 `CURRENT_STATE.md`가 소유한다.
- 작업 계획과 완료 조건은 `TASK_BOARD.md`가 소유한다.
- 상세 작업 이력과 검증 결과는 `WORK_LOG.md`가 소유한다.
- 이 문서는 위 정보를 반복하지 않고, 다음 작업자가 바로 주의해야 할 맥락만 남긴다.

현재 다음 행동은 `CURRENT_STATE.md`의 현재 우선순위를 기준으로 한다.

## 3. 다음 행동

1. `PIPE-801` 기준선 고정은 완료됐다. 기준 커밋은 `ad058ed`이며 856 tests, check, lint, build와 대표 20 tests가 통과했다.
2. 다음 작업은 `PIPE-802`다. WebLLM 런타임과 의존성을 제거한 뒤 멈추고 전체 테스트·빌드·asset 차이를 검증한다. classifier 개편을 같은 변경에 섞지 않는다.
3. `PIPE-803` Replay를 만든 뒤 `PIPE-804` InputUnderstanding을 shadow로 실행한다. Replay 승인 전 FSM 소비자를 전환하지 않는다.
4. P0.5 Conversation Expansion은 완료됐다. 후속 대화 변경은 질문 보존·복귀와 `RecommendationState.extractedPreferences` 계약을 먼저 확인한다.
5. `AUD-001` 실제 청취 QA와 `SPR-004~005`, `FLOW-003`은 기존 승인·환경 게이트를 유지한다.
6. 작업 후 `WORK_LOG.md`, `CURRENT_STATE.md`, 필요 시 `TASK_BOARD.md`를 갱신한다.

## 4. 주의사항

- 카루아 대사는 상담원식 위로가 아니라 관찰, 짧은 농담, 한 잔 권유의 흐름을 유지한다.
- `persona.ts`를 JSON 어댑터로 대체하지 않는다.
- DEC-029가 DEC-004~006, DEC-011, DEC-015, DEC-025~027의 활성 WebLLM 방향을 대체한다. RST-602~606과 Phase 14를 재개하지 않는다.
- 공통 구조는 `Input → Understand → Evaluate → Select → Plan → Present`다. 공통 단계만 공유하고 도메인 후보 타입과 평가기를 하나로 합치지 않는다.
- Understand, Evaluate, Select는 상태를 변경하지 않는다. Plan만 DialogueMove와 FSM transition을 만들며 Present는 ResponsePlan·Sprite·Audio로 표현만 담당한다.
- 외부 API는 의미 후보와 evidence span만 제안할 수 있고 상태·추천·사실·행동·최종 표현을 결정할 수 없다.
- safety-alert는 추천, 주문, 웰컴, farewell, 농담, 캐릭터 대사보다 우선한다.
- `ResponsePlanLine`은 `text`와 `expression`을 직접 소유해야 한다.
- Farewell 이후 신규 주문·추천은 차단하고, 귀가 흐름은 세션 도메인의 정책을 따른다.
- 기존 사용자의 변경이나 미커밋 변경을 임의로 되돌리지 않는다.
- 추천 중 잡담을 처리할 때 mode를 추가하거나 PendingQuestion을 지우지 않는다. 취소·추천 완료·safety·farewell만 질문 문맥을 닫는다.

## 5. 검증 기준

문서만 바꾸는 작업은 `git diff --check`를 최소 검증으로 삼는다.

코드 변경은 범위에 따라 아래에서 필요한 것을 실행한다.

- `npm.cmd test`
- `npm.cmd run check`
- `npm.cmd run lint`
- `npm.cmd run build`

검증 결과와 미실행 검증은 `WORK_LOG.md`에 기록한다.

## 6. 동기화 주의

다중 PC 작업 시 강제 푸시를 금지한다. 로컬 변경이 있으면 먼저 보존한 뒤 원격 상태를 확인한다.

```bash
git fetch origin
git status
```

로컬 변경을 지우는 명령은 사용자가 명시적으로 요청한 경우에만 실행한다.
