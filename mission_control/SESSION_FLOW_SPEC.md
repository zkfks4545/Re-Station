# 환상주점 세션 흐름 사양

> 최종 갱신일: 2026-07-22
> 목적: 기존 JSON 기반 칵테일 DB, 대사 DB, 추천 로직 이후의 사용자 경험과 세션 종료 구조를 정의한다.

## 전제

기존 JSON 기반 칵테일 데이터베이스, 대사 데이터베이스, 추천 로직은 유지한다.

이 문서는 추천 로직 자체가 아니라 추천 이후의 사용자 경험, 세션 상태, 종료 장치를 정의한다.

## 목표

환상주점은 AI 챗봇이 아니다.

환상주점은 연애 미연시가 아니다.

환상주점은 카루아와의 대화를 통해 취향을 추리하고 칵테일을 추천받는 인터랙티브 바 경험을 제공한다.

시스템은 항상 다음 흐름으로 복귀해야 한다.

```text
입장
→ 웰컴드링크(선택, 미제공 시 종료 이벤트에서 회수)
→ 대화
→ 취향 파악
→ 추천
→ 주문
→ 후일담
→ XYZ
→ 배웅
→ 귀가
```

## 핵심 설계 원칙

대화는 열려 있어야 한다.

진행은 닫혀 있어야 한다.

사용자는 자유롭게 말할 수 있지만 시스템은 반드시 다음 흐름 안에서 움직여야 한다.

```text
취향 파악
→ 추천
→ 주문
→ XYZ
→ 귀가
```

무한 챗봇 상태에 진입해서는 안 된다. 모든 세션은 결국 종료되어야 한다.

## DialogueSessionState 계약

대화 세션의 진행 상태는 `bar_tend/src/lib/session/dialogue-session.ts`의 `DialogueSessionState` 한 객체가 소유한다.

| 영역 | 필드 | 의미 |
|---|---|---|
| 진행 | `phase`, `mode`, `activeSessionId` | 세션 단계와 단일 active conversation/recommendation 입력 소유권 |
| 대화 | `dialogue.turnCount`, `dialogue.recommendationPrompted` | 일반 대화 진행과 추천 권유 여부 |
| 웰컴 | `welcomeDrink.served`, `welcomeDrink.resolved` | 제공 여부와 피드백/건너뛰기 해결 여부 |
| 주문 | `order.alcoholStarTotal` | XYZ 한계 판단용 누적 도수 별점 |
| 종료 | `farewell.entryKind`, `farewell.turnCount` | 종료 진입 종류와 배웅 턴 수 |
| 안전 | `safetyLocked` | safety-alert 이후 모든 대화·추천·주문·웰컴·farewell 흐름을 잠그는 Hard Stop |

한 시점의 사용자 입력은 `mode + activeSessionId`가 가리키는 세션 하나만 소비한다. 선택지 payload는 `sessionId`, `questionId`, `answerValue`를 포함하며 현재 `pendingQuestion`과 일치하지 않으면 상태를 변경하지 않는다.

story 대화 중 명시적으로 `추천받기`를 선택하면 첫 추천 질문이 준비된 시점에 단일 `switch-to-recommendation` transition으로 story topic·후속 질문 소유권을 닫고 recommendation mode·session ID·첫 pending question을 함께 등록한다. 이는 추천 중 잡담을 잠시 처리한 뒤 기존 질문으로 복귀하는 흐름과 다르다. 명시적 추천 전환 뒤 story는 자동 재개하지 않는다.

`welcomeDrink`는 별도 session phase나 독립 FSM이 아니다. 피드백 대기는 `served && !resolved`에서 파생하며, 피드백 응답·건너뛰기·다른 입력 진행 시 `resolved=true`가 된다.

## 자유입력 처리 원칙

사용자는 자유롭게 입력할 수 있다. 그러나 시스템은 무한 잡담 상태에 진입하지 않는다.

모든 자유입력 응답은 다음 구조를 유지한다.

1. 사용자 입력에 대한 짧은 반응
2. 추천 또는 칵테일 관련 대화로 복귀

단, `safety-alert`는 이 원칙의 예외다. 안전 안내 이후 일반 대화나 추천으로 복귀하지 않는다.

예시:

```text
사용자:
"오늘 너무 피곤해."

카루아:
"그런 날도 있죠."
"그럼 오늘은 달달하게 갈래요?"
```

## 선택지 이벤트

중요한 정보 수집 구간에서는 자유입력을 제한할 수 있다.

선택지 이벤트는 다음 목적에 사용한다.

- 취향 분류
- 의도 파악
- 추천 정확도 향상
- 대화 흐름 통제

선택지 예시:

```text
[달달한 것]
[상쾌한 것]
[독한 것]
```

또는:

```text
[기분전환]
[취향탐색]
[그냥 한잔]
```

## 세션 분위기 상태값

호감도 시스템은 사용하지 않는다.

대신 세션 분위기 상태를 기록한다.

예시:

- `trust`
- `familiarity`
- `playfulness`
- `tension`

이 상태값은 엔딩 분기용이 아니다. 카루아의 반응과 말투를 조절하기 위한 값이다.

## 엔딩 구조 금지

구현 금지 항목:

- Happy End
- Bad End
- True End
- 공략 루트
- 연애 루트
- 호감도 엔딩

사용자는 평가받지 않는다.

세션은 모두 귀가로 종료된다. 차이는 배웅 대사와 분위기뿐이다.

## XYZ 시스템

XYZ는 환상주점의 핵심 종료 장치다.

XYZ는 오늘의 마지막 드링크이며, 동시에 추가 주문 종료 선언이다.

### XYZ 발동 조건

다음 조건 중 하나 이상 충족 시 발동 가능하다.

- 취기 수치 임계점 도달
- 누적 도수 별점 10 도달
- 일정 체류 시간 경과
- 추천 완료 후 일정 시간 경과
- 웰컴드링크가 제공되지 않은 채 farewell 진입

구체 수치는 추후 조정 가능하다.

### Farewell 진입 결정

| 조건 | 종료 진입 |
|---|---|
| 웰컴드링크 제공됨 + 누적 도수 한계 | 일반 알코올 XYZ |
| 웰컴드링크 미제공 | Welcome-Farewell XYZ. 첫 잔과 마지막 잔을 겸함 |

미성년자 응대와 무알코올 대체 주문은 실제 주류 판매 서비스 정책에 해당하므로 Phase 3 설계 범위에서 제외한다. 전용 intent, 추천 제약, 응답 템플릿, 대체 farewell을 두지 않는다.

## Safety Hard Stop

`self-harm`, `suicide`, `immediate violence`, 즉각적인 생명·신체 위험이 `safety-alert`로 감지되면 일반 intent 처리보다 먼저 다음 작업을 수행한다.

1. 진행 중인 recommendation FSM과 예약 작업을 중단한다.
2. order/action과 제조 흐름을 중단한다.
3. `welcomeDrink`를 해결 상태로 닫고 이벤트를 중단한다.
4. 진행 중이거나 예정된 XYZ/farewell 이벤트를 중단한다.
5. 카루아식 후속 대사 없이 짧고 직접적인 안전 안내만 출력한다.
6. `DialogueSessionState.safetyLocked=true`, `phase='safetyLocked'`로 전환한다.

잠금 이후 일반 입력은 처리하지 않는다. XYZ, Welcome-Farewell XYZ, 일반 farewell도 실행하지 않으며 세션은 종료된 것으로 간주한다.

### XYZ 발동 시

카루아는 사용자에게 명확히 안내한다.

```text
"오늘의 마지막 드링크입니다."

"더 이상 주문은 안 받을게요."
```

## Farewell Phase

일반 주문/추천으로 칵테일을 서브한 뒤 누적 도수 별점이 10 이상에 도달하면 XYZ를 마지막 잔으로 이어서 서빙하고, 그 뒤 Farewell Phase에 진입한다.

이 시점부터:

- 추가 주문 불가
- 추가 추천 불가
- 대화 가능
- 칵테일 설명 가능
- 레시피 질문 가능
- 후기 대화 가능

## Farewell Phase 대화 정책

이 구간은 2~3턴 정도 유지한다.

이 구간은 추천 서비스가 아니라 배웅 이벤트다.

사용 가능한 주제:

- XYZ 설명
- 칵테일 유래
- 칵테일 후기
- 오늘 추천 결과
- 가벼운 잡담
- 다음 방문 암시

금지:

- 신규 주문
- 신규 추천
- 추천 루프 재진입

## 카루아 캐릭터 활용 지침

평상시 카루아는 바텐더 역할을 우선한다.

추천 단계에서는 항상 칵테일 관련 주제로 복귀해야 한다.

XYZ 이후에는 캐릭터성이 조금 더 드러나도 된다. 단, 여전히 연애 미연시처럼 보이면 안 된다.

목표는 공략 대상이 아니라 잠시 만난 바텐더다.
