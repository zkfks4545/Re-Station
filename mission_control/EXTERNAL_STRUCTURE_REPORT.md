# Re:Station 외부 구조 보고서

> 작성일: 2026-06-22
> 최종 갱신일: 2026-07-13
> 목적: 외부 AI 또는 기획 협업자가 현재 프로젝트 구조, 책임 경계, 데이터 흐름을 빠르게 파악하기 위한 구조 지도
> 대상 경로: `bar_tend/`
> 작성·갱신 기준: `mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md`

## 0. 문서 사용법

이 문서는 작업 이력이나 상태 보고서가 아니다. 외부 협업자가 Re:Station의 구조와 금지선을 빠르게 이해하도록 돕는 장기 구조 지도다.

상태성 정보는 `mission_control/CURRENT_STATE.md`를 참조한다. 작업 항목과 완료 조건은 `mission_control/TASK_BOARD.md`, 세부 작업 이력은 `mission_control/WORK_LOG.md`, 이어받을 맥락은 `mission_control/HANDOVER.md`가 소유한다.

외부 AI와 기획을 이어갈 때는 보통 이 문서와 `mission_control/CONVERGENCE_PRINCIPLES.md`, 현재 받고 싶은 질문이나 과제 문장을 함께 전달한다. 말투 검수가 핵심이면 `mission_control/CHARACTER_DESIGN.md` 또는 `bar_tend/src/lib/bartender/persona.ts`의 관련 부분을 추가한다.

## 1. Project Overview

Re:Station은 사용자가 가상의 바에 입장해 바텐더 카루아와 대화하고, 취향·상태·요청을 바탕으로 칵테일 추천을 받는 React/Vite 기반 프론트엔드 앱이다.

핵심 구조는 다음과 같다.

- 추천 결과와 추천 근거는 정적 칵테일 DB와 규칙 기반 추천 엔진이 결정한다.
- 대사 계층은 추천 결과, 입력 경로, 세션 상태를 받아 ResponsePlan과 formatter 중심으로 표현만 담당한다.
- 세션은 웰컴드링크, 추천, 주문, 이야기, XYZ, Farewell, 귀가로 닫힌 흐름을 가진다.
- WebLLM은 최종 대사를 생성하지 않고 topic·stance·block·세션 태그 같은 의미 보조 후보만 제안한다.
- 카루아 말투, 시에스타 역할, 제조·서빙 cue는 추천 판단과 분리된 표현·연출 계층의 문제다.

## 2. Architecture at a Glance

Re:Station은 사용자 입력을 바로 대사로 바꾸지 않는다. 입력을 이해하고, 도메인 판단을 끝낸 뒤, 표현 계층이 카루아다운 문장과 표정으로 감싼다.

```text
User Input
  ↓
Input Understanding
  - intent, route, safety, explicit cocktail/story target
  ↓
Decision Layer
  - Recommendation: 후보 필터, 질문 순서, 추천 결과
  - Session: 웰컴, 주문 가능 여부, XYZ/Farewell, safety lock
  - Story: 공개할 칵테일 fact와 다음 이야기 대상
  - Cocktail DB: 재료, 레시피, lore, talking point의 단일 사실 출처
  ↓
Expression Layer
  - ResponsePlan: 입력 경로·상태·요청별 문단과 표정
  - Formatter: 추천, 웰컴, farewell, story wrapper
  - Character QA: 카루아 말투와 금지 표현 검증
  ↓
Presentation Layer
  - typing, preparation, serving reveal, screen shake, queued interaction, audio cue
  ↓
UI
  - Dialogue, bartender sprite, cocktail card, sidebar, entrance/interior
```

이 지도는 책임의 큰 흐름만 보여준다. 실제 호출 순서와 파일별 책임은 Runtime Architecture와 Major Modules에서 설명한다.

## 3. Core Design Principles

1. 추천 결과는 AI가 임의 생성하지 않는다.
2. 추천 결과와 추천 근거는 DB와 추천 엔진이 결정한다.
3. 대사는 추천 결과를 표현하는 계층이다.
4. 칵테일 ID만으로 대사를 고르지 않는다.
5. 사용자 입력 경로, 감정 상태, 요청 의도에 따라 대사 풀이 달라진다.
6. `persona.ts`는 카루아 말투 기준 파일이며 JSON 어댑터로 대체하지 않는다.
7. 시에스타는 상시 대화 캐릭터가 아니라 낮은 빈도의 만담 이벤트 캐릭터다.
8. safety-alert는 추천, 주문, 웰컴, farewell, 농담, 캐릭터 대사보다 우선하는 Hard Stop이다.
9. Character Layer는 표현과 검증만 담당하며 추천·상태·행동·intent를 변경하지 않는다.
10. Hidden RapportState는 사용자에게 노출하지 않고 추천·게임플레이 결정에 사용하지 않는다.
11. WebLLM은 자유대사 생성기가 아니며 추천 결과, 세션 상태, Action을 변경하지 않는다.
12. 외부 기획안은 구조를 바꾸기보다 현재 구조 안에서 대사 품질, 문단 구조, 검수 기준을 보강해야 한다.

## 4. Runtime Architecture

기본 입력 흐름은 아래 순서를 따른다.

```text
App / ChatInput
→ useRestationController
→ DialogueService
→ IntentClassifier + input-router
→ action-resolver
→ action-executor
→ recommendation / story / session domain
→ ResponsePlan / response templates / domain formatter / response pipeline
→ Character Layer
→ DialogueTurn
→ useRestationController UI effects
→ DialogueBox + BartenderSprite + CocktailCard
```

중요한 분리 원칙은 다음과 같다.

- `DialogueService`는 분류, 세션 차단, Action 해석, Context 이벤트, 직접 응답, DialogueTurn 검증을 담당한다.
- `useRestationController`는 서비스 결과를 UI와 세션 reducer에 반영한다.
- 추천 엔진은 칵테일과 근거를 결정한다.
- ResponsePlan과 formatter는 이미 결정된 결과의 최종 표현을 렌더링한다.
- Character Layer는 최종 문구와 표정의 말투 적합성을 검사한다.
- 안전 입력은 모든 큐와 예약 작업보다 우선한다.
- WebLLM과 Rapport는 현재 구조에서 최종 대사 선택이나 추천 판단을 직접 바꾸지 않는다.

## 5. Major Modules

### 5.1 App and UI

| 경로 | 책임 |
|---|---|
| `bar_tend/src/App.tsx` | 전체 화면 조립 |
| `bar_tend/src/hooks/useRestationController.ts` | 입장, 퇴장, 세션 reducer, 메시지, 추천 실행, 제조·서빙 cue, 카드·도감·시에스타 UI 효과 연결 |
| `bar_tend/src/components/entrance/BarExterior.tsx` | 바 외부 입장 화면 |
| `bar_tend/src/components/bar/BarInterior.tsx` | 바 내부 메인 화면 |
| `bar_tend/src/components/bar/ChatInput.tsx` | 사용자 입력과 추천 선택지 |
| `bar_tend/src/components/bar/DialogueBox.tsx` | 대화 표시 |
| `bar_tend/src/components/bar/DialogueRenderer.tsx` | 타이핑 표시와 대사 렌더링 |
| `bar_tend/src/components/bar/WelcomeDrinkButton.tsx` | 웰컴드링크 요청 버튼 |
| `bar_tend/src/components/bar/CocktailCard.tsx` | 추천 결과 카드와 주문·이야기 행동 |
| `bar_tend/src/components/bar/BartenderSprite.tsx` | 카루아 표정 스프라이트와 제조/서빙 표시 |
| `bar_tend/src/assets/characters/karua/sprites.ts` | `Expression`별 정적 PNG, 명시적 fallback, 셰이킹/서빙 프레임을 제공하는 캐릭터 에셋 진입점 |
| `bar_tend/src/components/bar/RapportDebugDisplay.tsx` | 개발용 hidden rapport 표시 |
| `bar_tend/src/components/sidebar/Sidebar.tsx` | 레시피, 도감, BGM 탭 컨테이너 |

### 5.2 Dialogue Domain

| 경로 | 책임 |
|---|---|
| `bar_tend/src/lib/bartender/intent-classifier.ts` | 추천, 대화, 이야기, 캐릭터, 안전 의도 분류 |
| `bar_tend/src/lib/bartender/keywords.ts` | `keyword-rules.json`을 런타임 규칙으로 컴파일 |
| `bar_tend/src/data/keyword-rules.json` | 키워드 패턴, route, 표현 category 연결 |
| `bar_tend/src/lib/dialogue/input-router.ts` | 원문 입력을 안전, 퇴장, 추천, 주문, 이야기, 정보, 캐릭터, 일반 대화 route로 분류 |
| `bar_tend/src/lib/dialogue/dialogue-service.ts` | 분류와 Action 해석을 오케스트레이션하고 검증된 DialogueTurn 반환 |
| `bar_tend/src/lib/dialogue/action-resolver.ts` | route/intent와 컨텍스트를 행동 객체로 변환 |
| `bar_tend/src/lib/dialogue/action-executor.ts` | 행동을 추천·주문·이야기 도메인 포트에 연결 |
| `bar_tend/src/lib/dialogue/conversation-context.ts` | 직전 논의·추천·서빙·주문 후보와 공개된 칵테일 팩트 이력 관리 |
| `bar_tend/src/lib/dialogue/story-query.ts` | 칵테일별 story/lore/info/recipe/taste/trivia 공개 순서 선택 |
| `bar_tend/src/lib/dialogue/reaction-layer.ts` | 대화 경로보다 먼저 적용되는 짧은 반응 계층 |
| `bar_tend/src/lib/dialogue/conversation-flow.ts` | 일반 대화, 정보 요청, 이야기 흐름 보조 |
| `bar_tend/src/types/dialogue-turn.ts` | 구조화된 대화 턴 계약 |
| `bar_tend/src/lib/dialogue/turn-builder.ts` | DialogueTurn 구성과 복구 템플릿 |

### 5.3 Response and Character

| 경로 | 책임 |
|---|---|
| `bar_tend/src/data/dialogues.json` | ResponsePlan이 소유하지 않는 legacy fallback과 일부 짧은 응답 풀 |
| `bar_tend/src/lib/dialogue/dialogue-loader.ts` | ResponsePlan 우선 조회와 legacy JSON fallback 선택 |
| `bar_tend/src/lib/dialogue/response-templates.ts` | intent별 fallback/tone 템플릿과 데이터 삽입용 ResponseDraft |
| `bar_tend/src/lib/dialogue/response-pipeline.ts` | 텍스트와 tone/affect를 최종 응답 문자열·표정으로 조립 |
| `bar_tend/src/lib/dialogue/text-presets.ts` | 추천 질문 문장 프리셋과 추천 응답 문단 프리셋 |
| `bar_tend/src/lib/dialogue/response-plan.ts` | ResponsePlan 타입, 선택, 검증 계약 |
| `bar_tend/src/lib/dialogue/response-plan-data.ts` | ResponsePlan 데이터 |
| `bar_tend/src/lib/dialogue/response-plan-renderer.ts` | 제한 slot 기반 ResponsePlan 렌더링 |
| `bar_tend/src/lib/dialogue/response-plan-adapter.ts` | legacy category를 ResponsePlan query로 매핑하는 어댑터 |
| `bar_tend/src/lib/bartender/persona.ts` | 카루아 말투 기준 |
| `bar_tend/src/lib/character/character-profile.ts` | 화자별 말투·금지/권장 표현 계약 |
| `bar_tend/src/lib/character/character-validator.ts` | 금지 표현, 문장 수, 반존대, 추천 어조 검증 |
| `bar_tend/src/lib/character/character-layer.ts` | 응답 의미를 바꾸지 않고 말투 검증 메타데이터 생성 |

### 5.4 Recommendation

| 경로 | 책임 |
|---|---|
| `bar_tend/src/data/recommendation-questions.json` | 추천 질문, 선택지, 상태 갱신 신호 |
| `bar_tend/src/lib/recommendation/question-engine.ts` | 다음 질문 선택, 답변 반영, 후보 분별력 계산 |
| `bar_tend/src/lib/recommendation/state.ts` | 자유 입력 신호 추출, 추천 상태, 후보 필터, 추천 근거 |
| `bar_tend/src/lib/recommendation/response.ts` | 결정된 추천 결과의 최종 표현 포맷 |
| `bar_tend/src/hooks/useRecommendationSession.ts` | 추천 FSM과 추천 엔진 호출 |
| `bar_tend/src/lib/recommendation/welcome-drink.ts` | 웰컴드링크 선정, 피드백 질문, 표현 포맷 |
| `bar_tend/src/types/recommendation.ts` | 추천 상태, 질문, 선택지, 결정 타입 |

### 5.5 Session and Closing Flow

| 경로 | 책임 |
|---|---|
| `bar_tend/src/lib/session/dialogue-session.ts` | 대화/추천 모드, 웰컴 상태, 누적 도수, farewell 종류, safety lock을 소유하는 세션 reducer |
| `bar_tend/src/lib/session/session-flow.ts` | 세션 단계, 주문 가능 여부, XYZ 마지막 잔, Farewell 정책 |
| `bar_tend/src/lib/session/farewell-replies.ts` | XYZ, Farewell 단계, 주문 차단, 귀가 응답 표현 |
| `bar_tend/src/lib/dialogue/serving-plan.ts` | 서빙 대상의 도수 누적, XYZ 여부, farewell 필요 여부, 다음 phase 계산 |

### 5.6 Cocktail Data

| 경로 | 책임 |
|---|---|
| `bar_tend/src/data/cocktail-db.json` | 정적 칵테일 DB |
| `bar_tend/src/lib/cocktails/database.ts` | 칵테일 검색, 이름·별칭 매칭, 추천 정렬 |
| `bar_tend/src/lib/cocktails/secret-menu.ts` | 일반 추천에서 숨긴 시크릿 메뉴와 암구호 주문 |
| `bar_tend/src/lib/cocktails/lore-reference.ts` | lore, talking points, 인물/작품/이름 유래 참조 검색 |
| `bar_tend/src/lib/cocktails/ingestion-pipeline.ts` | 레시피 후보 처리와 검증 큐 분기 |
| `bar_tend/src/lib/cocktails/admin-queue-manager.ts` | 관리자 검증 큐 |
| `bar_tend/src/types.ts` | 공통 칵테일, 메시지, 표정 타입 |
| `bar_tend/src/types/cocktail-db.ts` | 정규화 칵테일 DB 타입 |

### 5.7 Storage, Timing, Audio, Relationship, WebLLM

| 경로 | 책임 |
|---|---|
| `bar_tend/src/lib/storage/guest-session-store.ts` | localStorage 기반 게스트 세션 저장/복원 |
| `bar_tend/src/lib/storage/cocktail-unlocks.ts` | 칵테일 도감 해금 상태 저장 |
| `bar_tend/src/lib/timing/timer-registry.ts` | 타이머 생명주기 관리 |
| `bar_tend/src/hooks/useAudioManager.ts` | BGM 상태, YouTube player lifecycle, 볼륨·음소거·저장/복원 소유 |
| `bar_tend/src/lib/relationship/*` | 숨은 RapportState 타입, config, 상태 갱신, 구간 매핑 |
| `bar_tend/src/lib/relationship/dialogue-selector.ts` | rapport 구간별 variation 선택 헬퍼 |
| `bar_tend/src/hooks/useExperimentalWebLLMPreparation.ts` | WebLLM 준비 예약 |
| `bar_tend/src/lib/webllm/service.ts` | 비차단 의미 분석 서비스 |
| `bar_tend/src/lib/webllm/validator.ts` | 의미 분석 결과 허용 목록 검증 |
| `bar_tend/src/lib/webllm/session-tags.ts` | 세션 전용 의미 태그 저장 |

## 6. Responsibility Boundaries

### 6.1 추천 판단과 대사 표현

추천 엔진은 칵테일, 후보, 근거, talking point를 결정한다. ResponsePlan은 이미 결정된 값을 받아 문단과 표정을 선택한다. ResponsePlan이 칵테일 ID, 추천 이유, 후보 필터, 질문 순서를 바꾸면 안 된다.

### 6.2 세션 판단과 farewell 표현

`dialogue-session.ts`, `session-flow.ts`, `serving-plan.ts`는 세션 단계와 종료 정책을 결정한다. `farewell-replies.ts`와 ResponsePlan은 사용자에게 보여줄 문구와 표정만 담당한다.

### 6.3 컨트롤러와 도메인 로직

컨트롤러는 UI 효과, 타이머, 카드 표시, 도감 해금, 세션 reducer 반영을 담당한다. 입력 분류, Action 선택, 추천 판단, 공개할 이야기 선택은 도메인 모듈이 담당한다. 제조 준비, 카드 공개, 화면 흔들림, queue drain은 컨트롤러의 연출성 책임이지만 safety hard stop과 세션 전이 순서에 묶여 있으므로 도메인 판단과 분리해서 다룬다. 오디오 재생 방식은 Audio Manager가 소유하며, 컨트롤러는 제조·서빙 같은 cue만 전달해야 한다.

### 6.4 안전 입력

safety-alert는 최상위 Hard Stop이다. 추천 FSM, 주문, 웰컴, XYZ/farewell 예약, 만담 이벤트보다 먼저 처리하고, 세션을 safetyLocked 상태로 닫는다.

### 6.5 Character Layer

Character Layer는 문구와 표정을 보존하면서 말투 검증 메타데이터를 만든다. 추천 결과, 세션 상태, Action, intent를 변경하지 않는다.

### 6.6 WebLLM

WebLLM은 구조화 의미 분석만 담당한다. 최종 대사, 추천 결과, 칵테일 ID, 추천 이유, 세션 상태, Action을 생성하거나 변경하지 않는다. 허용 목록 검증을 통과한 의미 태그만 낮은 우선순위 힌트로 사용할 수 있으며, 검증 실패 시 기존 규칙 기반 흐름을 유지한다.

### 6.7 Rapport

RapportState는 숨은 관계 상태다. controller는 입력 맥락에 따라 값을 갱신하고 개발용 표시를 제공할 수 있지만, 현재 구조에서 추천 결과, Action, SessionState, ResponsePlan 선택을 직접 변경하지 않는다. rapport 기반 variation 선택은 별도 헬퍼로 존재하며 런타임 표현 선택에 연결할 때도 안전·추천·세션 판단보다 낮은 우선순위여야 한다.

### 6.8 Character Sprite Contract

`Expression`은 대사 표현과 무대 표정의 공통 계약이다. `sprites.ts`는 문자열 경로 조합 없이 `Record<Expression, image>`로 정적 PNG를 제공하고, 준비되지 않은 슬롯은 명시적 fallback으로 처리한다. 현재 카루아의 `sympathy`, `surprised`, `annoyed`, `stern`, `disappointed` 표정은 각각 독립 이미지로 연결되며, `talk`은 별도 입 모양 PNG를 만들지 않고 `idle` 이미지를 의도적으로 공유한다.

`upset.png`는 별도 대사 표현 타입을 만들지 않고, 안전·경계 응답에 쓰이는 기존 `stern` 슬롯의 이미지 자산으로 연결한다. 이미지 파일명은 에셋 관리 정보이며, 대화·안전·세션 로직은 항상 `Expression` 타입만 사용한다.

표정의 노출 시간, 자동 복귀, 전환 효과 같은 시간 정책은 `Presentation Layer`의 후속 책임이다. 현재 스프라이트 계약은 이미지 선택과 fallback만 소유한다.

## 7. Dialogue Architecture

대사 출처는 여러 계층으로 나뉜다. 중심 소유자는 ResponsePlan과 도메인 formatter이며, legacy JSON은 ResponsePlan이 실패하거나 아직 별도 안전망이 필요한 일부 category에만 fallback으로 남는다.

- `response-plan-data.ts`: speaker/intent/state/request/block 기반 표현 계획
- `response-plan-adapter.ts`: keyword-rule/legacy category를 ResponsePlan query로 연결
- `dialogues.json`: ResponsePlan이 소유하지 않는 fallback-required category와 일부 legacy pool
- `response-templates.ts`: intent별 fallback/tone과 데이터 삽입용 Draft
- `text-presets.ts`: 추천 질문과 문단 프리셋
- `story-query.ts`: 칵테일 DB의 공개 가능한 fact 선택과 최종 wrapper 포맷
- `farewell-replies.ts`, `welcome-drink.ts`, `recommendation/response.ts`: 도메인별 표현 포매터

중요한 기준은 “판단은 도메인 계층, 표현은 ResponsePlan/포매터 계층”이다. 대사 출처가 늘어나더라도 추천 결과, 세션 전이, 안전 판단은 표현 계층으로 이동하지 않는다.

`fallbackText`와 legacy fallback은 일반 표현 소유권이 아니라 실패·불완전 plan에 대비한 안전망이다. fallback이 실제 호출 경로와 의미를 잃으면 제거 대상이고, safety나 차단 응답처럼 안전망 의미가 남아 있으면 유지 대상이다.

## 8. Recommendation Architecture

추천은 Slot Filling과 후보 필터를 중심으로 동작한다.

1. 사용자 입력에서 taste/base/strength/fizz 같은 신호를 추출한다.
2. 이미 채워진 슬롯을 고려해 다음 질문을 고른다.
3. 정적 칵테일 DB에서 후보를 필터링하고 점수화한다.
4. 추천 결과와 근거를 결정한다.
5. 결정된 결과를 ResponsePlan 또는 formatter가 표현한다.

추천 질문, 질문 순서, 후보 필터, nearest fallback 판단은 추천 도메인이 소유한다. 대사 계층은 질문 문구, acknowledgement, lead-in, 추천 설명 문단을 표현한다.

## 9. Session and Context

세션은 사용자가 무한 잡담으로 빠지지 않도록 닫힌 흐름을 가진다.

- 기본 입장 후 conversation mode
- `추천받기` 버튼으로 recommendation mode
- 웰컴드링크는 별도 phase가 아니라 세션 상태의 `served/resolved` 플래그로 관리
- 서빙 완료 후 conversation mode 복귀
- 누적 도수나 명시적 퇴장으로 XYZ/Farewell 흐름 진입
- Farewell 이후 신규 주문·추천 차단
- 명시적 귀가 입력 또는 종료 조건으로 returnHome

Conversation Context는 직전 논의, 추천, 서빙, 주문 후보, story target, 칵테일별 공개 fact 이력을 관리한다. 명시적 칵테일명과 lore/person/media 검색 결과는 대명사 컨텍스트보다 우선한다.

## 10. ResponsePlan and Data Ownership

ResponsePlan은 대사 표현을 구조화하기 위한 계약이다.

- `speaker`: 말하는 캐릭터
- `intent`: 응답 의도
- `state`: 감정·세션·추천 상태
- `request`: 사용 경로 또는 요청 종류
- `blocks`: reaction, recommend, explanation, answer 등 문단 단위
- `fallbackText`: WebLLM 실패나 plan 실패 시 보존할 안전 텍스트

ResponsePlanLine은 `text`와 `expression`을 직접 소유한다. 문자열 line만 둔 block은 허용하지 않는다.

소유권 기준은 다음과 같다.

| 정보 | 소유 계층 |
|---|---|
| 칵테일 사실, 재료, 레시피 | 칵테일 DB |
| 추천 결과와 추천 근거 | 추천 엔진 |
| 다음 질문과 후보 필터 | 추천 FSM / question engine |
| 세션 단계와 종료 정책 | session domain |
| keyword-rule category 표현 | ResponsePlan / response-plan-adapter |
| 최종 대사 문단과 표정 | ResponsePlan / formatter |
| 실패 시 안전 문구 | `fallbackText` / required legacy fallback |
| 말투 검증 | Character Layer |
| 의미 태그 후보 | WebLLM semantic assistant |

## 11. Character and External Collaboration

카루아는 상담가가 아니라 바텐더 캐릭터다. 직접 위로하거나 문제 해결책을 제시하기보다 관찰, 농담, 비유, 짧은 권유로 분위기를 환기한다. 술이 감정 문제의 해결책처럼 보이면 안 된다.

시에스타는 상시 조언자가 아니다. 낮은 빈도로 끼어드는 만담 이벤트 캐릭터이며, 추천 질문·안전·퇴장·초기화 구간을 방해하지 않는다.

외부 AI에게 요청하기 좋은 것:

- 카루아 말투 금지 규칙 정리
- intent별 문단 구조
- `reaction / recommend / explanation / answer` 블록 샘플
- 상태·요청별 대사 풀 설계
- 시에스타와 카루아의 말투 차이
- 대사 품질 검수 체크리스트

외부 AI에게 요청하지 않는 것:

- 바로 코드 구현
- 추천 알고리즘 교체
- DB에 없는 칵테일 사실 생성
- 출처 없는 역사·유래·창작자 생성
- WebLLM이 추천 결과를 정하는 구조
- 카루아를 상담가처럼 만드는 위로 대사
- 시에스타를 상시 대화 캐릭터로 확장하는 설계

## 12. Extension Points

장기 확장 지점은 다음과 같다.

- Interaction Timeline: typing, preparation, serving reveal, screen shake, queued interaction의 연출 계층 정리
- Audio SFX: BGM과 독립된 shaker loop, serving one-shot, SFX volume/mute 채널 추가
- Rapport 활용: 숨은 관계 상태를 표현 variation의 낮은 우선순위 힌트로 사용할지 검토
- Character QA: ResponsePlan, fallbackText, legacy fallback을 포함한 카루아 말투 검수
- 시에스타 스프라이트와 이벤트 큐: 허용 구간에서만 짧은 만담 표시
- WebLLM 의미 보조: 검증된 태그를 낮은 우선순위 ResponsePlan 선택 힌트로 사용할지 검토
- 칵테일 DB 확장: IBA 우선, 관리자 검증 큐 기반 승격
- 캐릭터 연출: 정적 표정 PNG와 제조 애니메이션을 분리한 현재 에셋 계약 위에 전환·시간 정책을 추가

확장 시에도 추천 결과, 세션 상태, safety, 칵테일 사실 선택을 표현 계층이나 WebLLM으로 옮기지 않는다.
