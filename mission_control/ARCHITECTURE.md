# 프로젝트 구조

> 최종 갱신일: 2026-07-22
> 실제 애플리케이션 경로: `bar_tend/`

## 프로젝트 개요

Re:Station은 브라우저에서 실행되는 단일 페이지 웹 애플리케이션이다. 사용자는 바 외부 화면에서 내부로 진입한 뒤 카루아와 대화하며 취향 질문에 답하고 칵테일 추천을 받는다. 추천 결과, 도감 해제, 레시피, 음악, 세션 초기화 기능이 사이드바와 모달 형태로 제공된다.

## 기술 스택

| 영역 | 확인된 기술 |
|---|---|
| UI | React 19 |
| 언어 | TypeScript |
| 빌드 도구 | Vite 8 |
| 스타일 | Tailwind CSS 4 및 `src/index.css` |
| 정적 데이터 | JSON, TypeScript 모듈 |
| 브라우저 저장소 | `localStorage` |
| 린트 | ESLint 10, typescript-eslint |
| 외부 연동 후보 | TheCocktailDB, 제한적 same-origin 의미 보조 API |
| 테스트 | Vitest, 데이터 계약 및 검색 우선순위 회귀 테스트 |

## 폴더 구조

```text
prac/
├─ mission_control/                 # 작업 운영 문서
└─ bar_tend/
   ├─ public/                       # 정적 아이콘과 파비콘
   ├─ scripts/                      # 칵테일 데이터 생성 및 보강 스크립트
   ├─ src/
   │  ├─ components/
   │  │  ├─ bar/                   # 바 내부, 대화, 카드 UI
   │  │  ├─ entrance/              # 바 입장 UI
   │  │  └─ sidebar/               # 도감, 레시피, 음악, 초기화 UI
   │  ├─ data/                      # 정규화된 칵테일 및 제휴 바 JSON
   │  ├─ hooks/                     # 세션 상태 훅
   │  ├─ lib/
   │  │  ├─ recommendation/        # 추천 상태, 질문, 후보 필터 및 점수화
   │  │  ├─ bartender/             # 규칙 기반 대화 응답
   │  │  ├─ cocktails/             # 데이터 접근, 검색, 순위화
   │  │  ├─ idol/                  # 대화 메모리 갱신
   │  │  └─ storage/               # 세션 및 도감 해제 저장
   │  ├─ App.tsx                   # 화면과 핵심 사용자 흐름 조정
   │  └─ types*.ts                 # 공통 타입
   ├─ package.json
   ├─ vite.config.ts
   └─ tsconfig.json
```

## 주요 구성 요소

| 구성 요소 | 책임 | 주요 파일 |
|---|---|---|
| 애플리케이션 조정 | 장면, 메시지, 모달, 사이드바와 저장 상태를 연결 | `src/hooks/useRestationController.ts` |
| 대화 서비스 | 대화 컨텍스트 구성, 의도 분류, 세션 차단, 행동 해석, Context 이벤트, 직접 응답과 최종 DialogueTurn 조립·검증 | `src/lib/dialogue/dialogue-service.ts` |
| 공통 입력 라우팅 | 안전, 퇴장, 설문 밖 랜덤 추천, 이름 검색, 추천, 일반 대화의 처리 우선순위 결정 | `src/lib/dialogue/input-router.ts` |
| 대화 컨텍스트 | 직전 논의·추천·서빙·주문 후보 칵테일 참조와 갱신 규칙 관리 | `src/lib/dialogue/conversation-context.ts` |
| 대화 행동 해석 | 통합 분류 결과와 컨텍스트를 주문·추천·이야기·논의·일반 응답 행동으로 변환 | `src/lib/dialogue/action-resolver.ts` |
| lore 참조 검색 | 구조화 lore, talking points, 대중문화 단서로 인물·작품·이름 유래 기반 칵테일 참조 검색 | `src/lib/cocktails/lore-reference.ts` |
| 대사 트리거 계층 | 입력 경로 태그, FSM 상태, 감정 상태를 기준으로 대사 풀·말투·표정 스프라이트·애니메이션 선택 | 목표: `src/domain/dialogue/triggers/` |
| 입장 및 바 UI | 바 입장 연출, 내부 무대, 적응형 추천 선택지와 자유 입력 구성 | `src/components/entrance/`, `src/components/bar/` |
| 대화 엔진 | 키워드 규칙과 대화 문맥 기반 응답 생성 | `src/lib/bartender/engine.ts`, `conversation.ts`, `keywords.ts` |
| 만담 이벤트 엔진 | 안전한 구간에서 시에스타 이벤트 발생 여부와 짧은 발화 시퀀스 결정 | 목표: `src/domain/character/events/` |
| 추천 세션 | 후보군, 질문 진행, 최종 선택 흐름 연결 | `src/hooks/useRecommendationSession.ts` |
| 추천 중 대화 확장 | 활성 추천 질문 중 주제 전환, 질문 보존, 주제 응답 뒤 복귀 | `src/lib/dialogue/conversation-expansion.ts` |
| 추천 상태와 근거 | 기분, 상황, 취향, 제약, 질문 이력, 구조화 근거 관리 | `src/lib/recommendation/state.ts`, `src/types/recommendation.ts` |
| 추천 질문 엔진 | JSON 질문 정의, 취향 신호 수집, 상태·이력·후보 분별력 기반 다음 질문, 최종 선택 | `src/data/recommendation-questions.json`, `src/lib/recommendation/question-engine.ts` |
| 칵테일 데이터 계층 | JSON 데이터 접근, 단일 `CocktailData` 구성, 검색과 순위화 | `src/lib/cocktails/database.ts`, `cocktail-db.ts` |
| 손님 취향 세션 | 취향, 대화 메모리, 칵테일 해제를 브라우저에 저장 | `src/hooks/useGuestPreferenceSession.ts`, `src/lib/storage/` |
| 부가 기능 | 도감, 레시피, 음악, 밤 초기화 | `src/components/sidebar/` |

## 데이터 흐름

### 대화 및 추천

1. 사용자가 `ChatInput`에서 텍스트를 전송한다.
2. `useRestationController`가 메시지를 화면 상태에 추가하고 세션 취향 신호를 갱신한 뒤 현재 세션 스냅샷을 `DialogueService`에 전달한다.
3. `DialogueService`가 Conversation Context로 `DialogueContext`를 구성하고, `IntentClassifier`와 공통 입력 라우터를 사용해 흐름 제어용 route와 응답 의미용 intent를 확정한다.
4. 명시적 lore/person/media 단서가 있으면 lore 참조 검색이 DB 근거로 대상 칵테일을 먼저 확정한다. 결과가 있는 주문은 `lore-based-order`가 되며 대명사 컨텍스트보다 우선한다.
5. Conversation Context가 직전 논의·추천·서빙·주문 후보 칵테일을 제공하고, 서비스 내부 Action Resolver가 통합 분류 결과를 `order`, `loreBasedOrder`, `recommend`, `continueStory`, `discuss`, `respond` 행동으로 변환한다. 서비스는 세션 차단을 먼저 판정하며, 허용된 행동에만 Context 이벤트와 직접 응답 턴을 반환한다.
6. 안전 입력은 퇴장과 추천보다 먼저 규칙 기반 안전 응답으로 전달한다.
7. 활성 추천 질문 중 잡담·지식·세계관·캐릭터·감정/일상 질문은 추천 답변으로 소비하지 않는다. RecommendationState와 PendingQuestion을 유지하고 ConversationTopic과 SuspendedQuestion을 기록한 뒤, 주제 응답 마지막에 저장 질문으로 복귀한다.
8. 이름 검색 결과가 없고 추천 의도이면 `recommendation/question-engine.ts`가 현재 후보군을 필터링하고 다음 질문 또는 결과를 정한다.
9. 추천 엔진과 UI는 초기 로딩 시 구성된 동일한 `CocktailData` 객체를 사용한다.
10. 대사 트리거 계층은 확정된 추천 결과, 입력 경로 태그, 현재 FSM 상태, 감정 상태를 받아 대사 풀, 말투, 표정 스프라이트, 애니메이션 클립을 선택한다. 칵테일 ID는 제조·서빙 문장의 변수로 결합하며 추천 결과를 다시 계산하지 않는다.
11. 추천 엔진이 계산한 결과는 `DialogueService.buildMainTurn()`에서 최종 DialogueTurn으로 조립·검증한 뒤 메시지에 표시한다. `CocktailCard`는 DB 기반 중립 설명과 기존 상세 정보를 표시하고 도감 해제 ID도 저장한다.
12. 추천 질문과 안전 흐름이 아닌 구간에는 이벤트 엔진이 시에스타 만담 이벤트 발생 여부를 판단할 수 있다.

### 시에스타 이벤트 상태 흐름

```text
IDLE
  └─ 조건 충족 + 쿨다운 종료
      └─ INTERRUPTING   # 시에스타가 직전 대화에 예고 없이 난입
          └─ BANTER    # 카루아 또는 손님과 짧은 만담
              └─ EXITING   # 창고 정리, 청소 등 업무 복귀 발화
                  └─ COOLDOWN
                      └─ IDLE
```

- `INTERRUPTING` 첫 발화는 직전 손님 또는 카루아 발화와 연결한다.
- `BANTER`는 카루아 대상, 손님 대상, 삼자 대화 패턴을 지원한다.
- `EXITING`의 시에스타 마지막 발화는 업무 복귀 이유를 포함한다.
- `EXITING` 후 다음 사용자 입력은 카루아가 받는다.
- 이벤트 도중 사용자가 시에스타에게 답하면 남은 이벤트 길이 안에서 한 번 받아줄 수 있지만, 퇴장을 무기한 미루지 않는다.
- 추천 질문, 안전 확인, 퇴장, 초기화 상태에서는 `IDLE`에서 이벤트를 시작하지 않는다.

### 영속 데이터

| 데이터 | 저장 위치 | 수명 |
|---|---|---|
| 취향 선호 및 대화 메모리 | `localStorage`의 `restation_session_v1` | 브라우저 저장소 삭제 전까지 |
| 도감 해제 ID | `localStorage` 기반 저장 모듈 | 브라우저 저장소 삭제 전까지 |
| 현재 장면, 메시지, 후보군 | React 상태 | 페이지 세션 동안 |
| 칵테일 및 제휴 바 | 번들에 포함된 JSON과 TypeScript 데이터 | 배포 빌드 기준 |

손님 취향 세션과 도감 해제 저장은 localStorage 접근 실패를 런타임 오류로 전파하지 않는다. 세션 로드 시 취향 수치, 감정, 최근 주제, 교환 횟수를 필드별로 검증하며 손상된 값은 기본값으로 복구한다.

## 기능 흐름

| 기능 | 시작점 | 핵심 흐름 | 결과 |
|---|---|---|---|
| 바 입장 | `BarExterior` | `handleEnter()` | 내부 장면과 첫 메시지 표시 |
| 자유 대화 | `ChatInput` | 대화 엔진 | 바텐더 메시지와 표정 변경 |
| 칵테일 추천 | 추천 의도 입력 | 질문 기반 후보 필터와 점수화 | 추천 카드 및 도감 해제 |
| 이름 검색 | 칵테일 이름 입력 | 데이터베이스 검색 및 유사 문자열 비교 | 해당 칵테일 표시 |
| 사이드바 | 메뉴 버튼 | 도감, 레시피, 음악, 초기화 탭 | 부가 정보 또는 상태 초기화 |
| 퇴장 | 퇴장 버튼 또는 의도 입력 | 작별 응답 후 장면 초기화 | 외부 장면 |

## 외부 의존성

| 의존성 | 현재 확인 상태 |
|---|---|
| React 및 React DOM | 주 실행 경로에서 사용 |
| TheCocktailDB | 과거 정적 데이터 생성·보강 출처. 현재 런타임 API 모듈은 제거됨 |
| IBA 공식 칵테일 목록 | 클래식 칵테일 레시피 수치와 공식 분류 출처. URL을 정적 데이터에 기록 |
| 제한적 의미 보조 API | 아직 미구현. 향후 의미 후보와 evidence span만 제안 가능 |
| 외부 이미지 URL | 일부 칵테일 이미지에 사용 |
| 지도 링크 | 시그니처 칵테일의 제휴 바 위치에 사용 |

## 확인된 구조적 위험

| 위험 | 근거 | 영향 |
|---|---|---|
| 컨트롤러 통합 검증 한계 | 도메인·서비스 단위 테스트는 확장됐지만 React 컨트롤러 전체 흐름은 주로 하위 계약 테스트에 의존 | 세션 reducer와 UI 부수효과 연결의 통합 회귀 위험 |
| 분산된 입력 판단 | IntentClassifier, router, recommendation, reaction, continuation, conversation expansion이 일부 판정을 중복 소유 | 복합 발화 충돌과 단계별 회귀 원인 추적이 어려움 |
| Replay 기반 부재 | 현재 continuity 테스트는 있으나 단계별 old/new diff corpus는 아직 없음 | PIPE-803에서 새 소비자 연결 전 회귀 경계 구축 필요 |

`useRestationController`의 응답 준비, 타이핑, 추천 카드, 화면 흔들림, 퇴장 지연 작업은 관리형 타이머 레지스트리를 사용한다. 퇴장, 초기화, 컴포넌트 언마운트 시 남은 작업을 모두 취소하며, 처리 상태는 `idle`, `processing`, `typing`, `exiting` 중 하나로 유지한다.

## 미확인 사항

- [ ] 배포 환경과 실제 운영 URL
- [ ] 지원 브라우저와 최소 화면 크기
- [ ] 제한적 의미 보조 API의 공급자, same-origin 프록시, 예산, 개인정보 정책
- [ ] TheCocktailDB 데이터를 갱신하는 운영 절차
- [ ] IBA 공식 목록 변경 시 기존 레시피를 재검수하는 운영 절차
- [ ] 사용자 분석, 오류 추적, 성능 측정 도구
- [ ] 제휴 바 데이터의 실제 운영 책임과 갱신 절차

## 목표 구조

현재 구조는 위의 실제 구현을 설명한다. 승인된 목표 구조는 모든 상호작용이 같은 단계와 불변식을 공유하는 결정론적 파이프라인이다.

```text
TurnInput + CurrentContext
→ Understand: InputUnderstanding
→ Evaluate: 도메인 후보 평가
→ Select: 결정적 최종 선택
→ Plan: DialogueMove + FSM transition
→ Present: ResponsePlan + Sprite + Audio
```

### 목표 데이터 흐름

1. Input은 사용자 문장과 세션·캐릭터·시스템 이벤트, 현재 읽기 전용 문맥을 정규화한다.
2. Understand는 `PrimaryTopic`, `SpeechAct`, `PreferenceSignal`, `Entity`, `ControlIntent`, `ConversationStateCue`를 evidence와 confidence와 함께 반환한다.
3. Evaluate는 칵테일, 질문, 스토리 fact, 대화 전략, 이벤트 후보별 `eligible`, score, hard constraint, contribution을 계산한다.
4. Select는 안전·ControlIntent·하드 제약을 우선해 최종 후보를 결정적으로 선택한다.
5. Plan은 선택 결과를 `DialogueMove`와 FSM transition으로 변환한다. reducer가 transition을 적용하기 전까지 상태를 변경하지 않는다.
6. Present는 ResponsePlan으로 문장과 expression을 정하고 Sprite와 Audio cue를 구성한다. 이미 선택된 결과와 사실을 바꾸지 않는다.

공통 파이프라인은 단계의 순서, 입출력 경계, 불변식만 공유한다. 칵테일, 질문, 스토리 fact, 대화 전략, 캐릭터 이벤트를 하나의 범용 후보 타입이나 범용 평가기에 합치지 않는다.

### 단계 불변식

- Understand, Evaluate, Select는 읽기 전용이며 상태를 변경하지 않는다.
- Plan만 상태 transition을 만든다.
- Present는 표현만 담당한다.
- 후보 점수와 추천 이유는 같은 evaluation contribution에서 파생한다.
- 동일 입력과 상태는 동일한 평가·선택·계획을 만든다.
- 의도적 문장 변이는 Present 내부에서만 다루며 도메인 선택을 바꾸지 않는다.
- 각 단계 출력은 Replay에서 독립 비교할 수 있어야 한다.

### 대사·스프라이트 상태 축

```text
route          # 무엇을 이야기할지: 직접 주문, 취향 추론, 재료 언급, 감정 주문, 랜덤 등
dialogueState  # 어떤 장면인지: idle, listening, thinking, asking, recommending, serving, bantering, safety, error, exiting
affectState    # 어떤 얼굴인지: neutral, warm, curious, confident, playful, concerned, awkward, tired
```

- `route`는 대화 소재를 결정한다. FSM 상태가 입력 경로에서 나온 소재를 덮어쓰지 않는다.
- `dialogueState`는 말투의 속도와 확신 정도, 발화 길이, 애니메이션 클립을 결정한다.
- `affectState`는 감정 스프라이트와 세부 어조를 결정한다.
- 같은 `recommending` 상태라도 감정·무드 주문은 `warm`, 취향 추론은 `confident`, 랜덤 추천은 `playful`, 안전 관련 입력은 `concerned`처럼 갈라질 수 있다.
- 칵테일 ID는 제조·서빙 대사의 변수로 결합하고, 대사·표정·애니메이션의 유일한 결정 기준으로 쓰지 않는다.

### 단계적 질문 구조

추천 중 대화 확장은 새 session mode를 만들지 않는다. RecommendationState + ExtractedPreferences, ConversationTopic, PendingQuestion + SuspendedQuestion을 동시에 유지한다. 범용 지식·세계관은 제한된 전용 계약 응답을 사용하고, 칵테일 지식·캐릭터·감정/일상은 기존 DB/ResponsePlan 경로를 우선한다. 추천 취소만 FSM을 닫고 일반 대화로 돌아가며 이후 재진입을 허용한다.

```text
추천 상태 + 질문 이력
└─ 추천 엔진: 다음 질문 주제 결정
   ├─ Evaluate: 후보 분리도·답변 난이도·문맥 연속성·질문 피로도 평가
   ├─ Select: 결정적 다음 질문 선택
   └─ Plan: PendingQuestion 또는 최종 추천 transition 생성
```

- 질문 JSON은 주제, 카루아식 반응, 질문 문구, 선택지, 상태 갱신 규칙을 포함한다.
- 질문은 고정 순서로 진행하지 않고 이미 확인한 상태와 직전 답변에 따라 선택한다.
- 점수상 1위 후보가 명확하더라도 실제 후보가 여러 개라면 질문을 계속한다. 실제 후보가 1개일 때만 조기 종료한다.
- 조기 종료가 아닌 각 선택지는 최소 한 실제 후보를 가져야 하며, 모든 칵테일은 각 질문에서 최소 한 선택지에 대응해야 한다.
- 누적 선택 조합이 엄격 필터와 정확히 일치하지 않으면 베이스와 제외 재료 조건은 유지하고 맛·도수 거리가 가장 가까운 후보를 반환한다.
- 추천 질문은 맛과 풍미, 도수, 탄산, 베이스의 4축을 사용하며, 이해하기 쉬운 맛과 풍미 질문을 우선한다.
- 롱·숏 드링크는 현재 데이터에 검수된 독립 필드가 없고 도수·탄산과 겹치므로 질문 축으로 사용하지 않는다.
- 정확 일치가 없어도 즉시 추천하지 않고 베이스·제외 재료 등 하드 조건을 지키는 전체 후보군에서 남은 항목을 추가 질문한다. 질문 종료 후 최근접 추천임을 대화에서 알리며, 현재 120개 전체 선택 조합은 최소 한 결과를 가져야 한다.
- `카루아에게 맡기기`와 활성 설문 중 긍정형 `아무거나`만 질문 수와 무관하게 즉시 종료할 수 있다.
- 최근접 추천 대사는 정확 추천 대사와 구분하며, 일부 조건을 양보한 결과라는 사실을 숨기지 않는다.
- `잘 모르겠어요`는 현재 질문만 건너뛴다. 활성 질문 중 `카루아에게 맡기기`와 긍정형 `아무거나`는 이전까지 수집한 상태로 즉시 추천하고, 활성 질문이 없을 때 긍정형 `아무거나`는 설문 없이 전체 후보에서 랜덤 추천한다. `아무거나 말고` 같은 부정형은 어느 쪽으로도 처리하지 않는다.
- 질문 상태 계약, 자유 입력 해석, 추천 결정권은 규칙 엔진에 남는다.
- 추천 질문 JSON은 중립적인 질문·선택 확인 문장과 구조화 신호만 보관하며 캐릭터 말투를 포함하지 않는다.
- 런타임 기본 응답은 실제 직원이 짧게 응대하는 자연스러운 존댓말을 사용하며 내부 상태, 처리 과정, 콜센터식 문구를 반복하지 않는다. 캐릭터 프롬프트와 예문은 출력하지 않고 JSON 대사 블록과 ResponsePlan 자산으로 보존한다.
- 외부 API는 검증 전 `PreferenceSignal` 후보와 evidence span만 제안할 수 있으며 `RecommendationState`를 직접 변경하지 않는다.
- 추천 결과는 `RecommendationDecision`으로 칵테일, 검증된 상태, 데이터 기반 근거를 함께 반환한다.
- 대화 소재는 추천된 칵테일 ID가 아니라 입력 경로가 결정한다. 같은 칵테일도 직접 이름 주문, 감정·무드 주문, 취향 추론, 재료·베이스 언급, 랜덤 추천에 따라 다른 대사 풀을 사용한다.
- FSM 상태는 대사 소재가 아니라 말투, 발화 리듬, 애니메이션 클립을 결정한다. 감정 상태는 표정 스프라이트와 세부 어조를 결정한다.
- 반복 방지는 최근 N개 사용 대사 제외, FSM 상태별 대사 풀 분리, 입력 경로 태그와 감정 상태 필터링으로 처리한다. 대사 풀이 커지면 Ink 스크립트의 `shuffle`/`cycle`과 템플릿 변수 치환을 사용한다.
- 기분과 상황은 대응하는 DB 태그가 추가되기 전까지 질문과 설명 맥락으로만 보관하고 추천 적합성 근거로 과장하지 않는다.
- 칵테일 DB 레시피는 한국어 재료명과 ml 중심 정량을 쉼표로 구분한다. 화면 재료 목록은 레시피에서 수량을 제거해 생성하고, 설명문은 한 문장의 중립적인 `…칵테일입니다.` 형식을 사용한다.
- 레거시 데이터는 별칭·이미지 등 보조 메타데이터에만 사용하며 DB의 레시피, 재료와 설명문을 덮어쓰지 않는다.

### 목표 기술 경계

| 영역 | 원칙 |
|---|---|
| 내부 엔진 | Understand 이후 모든 Evaluate·Select·Plan 결정을 소유 |
| 상태 변경 | Plan이 만든 transition을 reducer가 적용할 때만 허용 |
| Present | ResponsePlan + Sprite + Audio. 결정된 결과를 변경하지 않음 |
| WebLLM | PIPE-802에서 실행 경로와 의존성 제거 완료, 과거 실험 기록만 보존 |
| 외부 API | 실제 연결 시 same-origin 프록시 사용. 의미 후보와 evidence span만 제안 |
| 복구 경로 | API 미사용·오류·시간 초과·검증 실패 시 상태 불변, 내부 확인 질문 또는 기존 ResponsePlan |

### 제한적 의미 보조 경계

```text
내부 Understand가 낮은 confidence의 미등록 은유·복합 발화·암시적 취향 감지
└─ SemanticAssistPort
   ├─ 성공: SemanticCandidate + confidence + 원문 evidence span
   │  └─ Validator와 내부 reconciler가 채택 여부 결정
   └─ 시간 초과/오류/검증 실패: 결과 폐기, 상태 불변, 내부 fallback
```

- API는 safety, ControlIntent, FSM, 추천 결과, 후보 점수, 세계관·캐릭터 사실, DialogueMove, ResponsePlan, 최종 문장·표정·행동을 제안할 수 없다.
- 명시 취향, 알려진 엔티티, 정상 추천 질문 응답에는 API를 호출하지 않는다.
- API 제안은 내부 명시 근거보다 낮은 우선순위다.
- 실제 공급자 연결 전에는 validator, fake/no-op adapter, 호출 자격 판정만 구현한다.
- 브라우저 번들에 공급자 secret을 포함하지 않는다.

### 캐릭터 대화 구조 목표

```text
character/
├─ contracts/             # 시에스타·카루아의 발화 알고리즘과 금지 패턴
├─ rule-engine/           # 의도와 상황을 캐릭터 대사로 변환
├─ dialogue-triggers/     # 입력 경로 기반 대사 풀, FSM 말투, 감정 스프라이트, 반복 방지
├─ events/                # 시에스타 난입, 만담, 업무복귀 퇴장, 쿨다운
├─ presentation/          # ResponsePlan, expression, Sprite, Audio cue
└─ evaluation/            # 캐릭터별 대표 상황과 실패 판정
```

- 캐릭터 설정의 문서 기준은 `mission_control/CHARACTER_DESIGN.md`다.
- MVP 런타임의 주 대화 캐릭터는 카루아이며, 시에스타는 낮은 빈도의 짧은 만담 이벤트로만 사용한다.
- 공통 의도 분류와 추천 결과는 캐릭터와 분리한다.
- 캐릭터 계층은 결과를 표현하며 추천 결과를 변경하지 않는다.
- 이벤트 계층은 추천 진행, 안전 확인, 퇴장 및 초기화 상태에서 비활성화한다.
- 시에스타 이벤트는 `INTERRUPTING → BANTER → EXITING` 순서를 생략하지 않는다.

## 문서 갱신 조건

다음 변경이 있으면 이 문서를 갱신한다.

- [ ] 새 최상위 폴더 또는 주요 모듈 추가
- [ ] 데이터 모델 또는 저장 방식 변경
- [ ] 외부 서비스 추가 또는 제거
- [ ] 사용자 핵심 흐름 변경
- [ ] 빌드, 배포, 테스트 구조 변경
