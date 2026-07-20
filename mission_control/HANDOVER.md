# 인수인계

> 최종 갱신일: 2026-07-20
> 목적: 다음 작업자가 추가 질문 없이 바로 이어받을 수 있는 행동 맥락만 남긴다.

## 1. 먼저 읽을 문서

| 순서 | 문서 | 이유 |
|---|---|---|
| 1 | `mission_control/README.md` | 문서 포털과 정보 소유권 확인 |
| 2 | `mission_control/CURRENT_STATE.md` | 현재 상태, 검증 상태, 우선순위 확인 |
| 3 | `mission_control/TASK_BOARD.md` | 작업 ID, 범위, 완료 조건 확인 |
| 4 | `mission_control/DECISIONS.md` | 변경하면 안 되는 결정 확인 |
| 5 | `mission_control/WORK_LOG.md` | 최근 작업 이력과 검증 기록 확인 |

대사·말투 작업이면 `CHARACTER_DESIGN.md`, 세션 종료 작업이면 `SESSION_FLOW_SPEC.md`, 구조 작업이면 `ARCHITECTURE.md`와 `EXTERNAL_STRUCTURE_REPORT.md`를 추가로 읽는다.

## 2. 현재 이어받을 위치

- 현재 상태 스냅샷은 `CURRENT_STATE.md`가 소유한다.
- 작업 계획과 완료 조건은 `TASK_BOARD.md`가 소유한다.
- 상세 작업 이력과 검증 결과는 `WORK_LOG.md`가 소유한다.
- 이 문서는 위 정보를 반복하지 않고, 다음 작업자가 바로 주의해야 할 맥락만 남긴다.

현재 다음 행동은 `CURRENT_STATE.md`의 현재 우선순위를 기준으로 한다.

## 3. 다음 행동

1. `AUD-001`의 자동 QA는 완료됐다. 브라우저 연결이 가능해지면 실제 재생·음소거·볼륨 복원·모바일 음악 탭만 검수한다.
2. `SPR-003`은 완료됐다. 다음 구현 후보 `SPR-004`는 시에스타 기준 디자인·최소 5개 슬롯 에셋을 승인받은 뒤 착수한다.
3. 코드 작업을 시작하기 전에 관련 도메인 문서와 기존 테스트 계약을 확인한다.
4. 작업 후 `WORK_LOG.md`, `CURRENT_STATE.md`, 필요 시 `TASK_BOARD.md`만 갱신한다.
5. `SPR-004~005`, `FLOW-003`, WebLLM RST-602~606은 승인 또는 환경 조건 전까지 착수하지 않는다.

## 4. 주의사항

- 카루아 대사는 상담원식 위로가 아니라 관찰, 짧은 농담, 한 잔 권유의 흐름을 유지한다.
- `persona.ts`를 JSON 어댑터로 대체하지 않는다.
- WebLLM은 최종 대사, 추천 결과, 세션 상태, Action을 생성하거나 변경하지 않는다.
- WebLLM 의미 태그는 현재 ResponsePlan 선택과 사용자 출력에 연결되지 않는다. 향후 승인되더라도 검증된 낮은 우선순위 힌트로만 사용할 수 있다.
- safety-alert는 추천, 주문, 웰컴, farewell, 농담, 캐릭터 대사보다 우선한다.
- `ResponsePlanLine`은 `text`와 `expression`을 직접 소유해야 한다.
- Farewell 이후 신규 주문·추천은 차단하고, 귀가 흐름은 세션 도메인의 정책을 따른다.
- 기존 사용자의 변경이나 미커밋 변경을 임의로 되돌리지 않는다.

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
