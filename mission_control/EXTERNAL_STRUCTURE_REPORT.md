# Re:Station 외부 기획용 구조 보고서

> 작성일: 2026-06-22  
> 최종 갱신일: 2026-06-26
> 목적: 외부 AI 또는 기획 협업자에게 현재 프로젝트 구조, 대화 시스템, 추천 시스템, 남은 기획 쟁점을 설명하기 위한 독립 보고서  
> 대상 경로: `bar_tend/`
> 작성·갱신 기준: `mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md`

## 0. 문서 사용법

이 보고서는 외부 AI 또는 기획 협업자에게 전달하는 브리핑 문서다. 내부 작업 로그나 구현 지시서가 아니라, 현재 구조와 기획 경계를 설명하고 외부 기획안을 받아오기 위한 기준 자료로 사용한다.

외부 AI와 기획을 이어갈 때는 이 문서와 함께 `mission_control/CONVERGENCE_PRINCIPLES.md`를 전달한다. 말투 검수가 핵심이면 `mission_control/CHARACTER_DESIGN.md` 또는 `bar_tend/src/lib/bartender/persona.ts`의 관련 부분을 추가로 전달한다.

이 문서를 갱신할 때는 `mission_control/EXTERNAL_STRUCTURE_REPORT_GUIDE.md`의 작성 원칙과 갱신 기준을 먼저 확인한다.

## 1. 프로젝트 한줄 요약

Re:Station은 사용자가 가상의 바에 입장해 바텐더 카루아와 대화하고, 취향·상태·요청을 바탕으로 칵테일 추천을 받는 React/Vite 기반 프론트엔드 앱이다. 현재 구조는 기본 대화 세션과 `추천받기` 버튼으로 시작하는 추천 세션을 구분하며, 추천 결과는 규칙과 JSON 데이터가 결정하고 캐릭터 대사는 규칙 기반 대사 풀과 프리셋으로 출력한다.

현재 WebLLM은 연결하지 않는다. 향후 도입하더라도 추천 판단이나 상태 변경이 아니라, 이미 확정된 답변의 말투 포장만 담당해야 한다.

## 2. 현재 제품 컨셉

| 항목 | 내용 |
|---|---|
| 제품명 | Re:Station |
| 주 캐릭터 | 카루아 |
| 보조 캐릭터 | 시에스타 |
| 핵심 경험 | 바에 들어와 짧게 대화하고, 취향에 맞는 칵테일을 추천받는다 |
| 추천 방식 | DB + 규칙 엔진 + JSON 질문 |
| 대화 방식 | 기본 대화 세션, `추천받기` 버튼 기반 추천 세션, 입력 라우터, 키워드 규칙, 추천 응답 프리셋 |
| 현재 톤 | 카루아 말투 계약은 존재하지만, 말투는 아직 재검수 대상 |
| 기획상 주의 | 상담/치료/과한 위로가 아니라 농담과 추천을 통한 환기 |

현재 런타임에서는 카루아 단독 핵심 루프를 먼저 다잡기 위해 시에스타 만담 이벤트를 임시 비활성화했다. 시에스타 설계와 이벤트 엔진은 보존되어 있지만, `SIESTA_EVENTS_ENABLED = false` 상태에서는 화면에 만담이 예약되지 않는다.

세션 진행 방향성은 `mission_control/SESSION_FLOW_SPEC.md`를 기준으로 이미 구현 완료되어 작동 중이다. 환상주점은 AI 챗봇이나 연애 미연시가 아니며, 자유입력은 허용하되 세션 진행은 웰컴드링크, 추천, 주문, XYZ, 배웅, 귀가로 닫힌 구조를 강제한다.

현재 UI는 별도의 `대화하기` 버튼을 두지 않는다. 입장 후 기본 상태가 대화 세션이며, 사용자는 `추천받기` 버튼으로 추천 세션에 진입한다. 일반 대화가 일정 턴 이상 이어지면 시스템 팝업이 아니라 카루아의 대사 안에서 자연스럽게 추천을 권한다.

## 3. 반드시 지켜야 하는 핵심 경계

1. 추천 결과는 AI가 임의 생성하지 않는다.
2. 추천 결과와 추천 근거는 DB와 추천 엔진이 결정한다.
3. 대사는 추천 결과를 표현하는 계층이다.
4. 칵테일 ID만으로 대사를 고르지 않는다.
5. 사용자 입력 경로, 감정 상태, 요청 의도에 따라 대사 풀이 달라져야 한다.
6. `persona.ts`는 사용자가 직접 다듬은 카루아 말투 기준 파일이다.
7. `persona.ts`를 JSON 어댑터로 바꾸지 않는다.
8. 시에스타는 상시 대화 캐릭터가 아니라 짧은 만담 이벤트 캐릭터다.
9. 안전 입력은 항상 추천, 농담, 캐릭터 대사보다 우선한다.
10. WebLLM은 도입하더라도 말투 포장만 담당한다.
11. 입력 의도와 응답 출처를 먼저 안정화하고, 카루아 말투 개선은 그 다음 단계로 둔다.
12. 현재 향후 구조 우선순위는 `Phase 1.5` Context + Action Layer다.
13. DLG-807~DLG-809 같은 대사 수렴 작업은 의도·행동·응답 출처가 안정된 뒤 재검토한다.
14. 기준 문서는 `mission_control/CONVERGENCE_PRINCIPLES.md`다.

## 4. 주요 파일 지도

### 4.1 화면과 앱 흐름

| 파일 | 역할 |
|---|---|
| `bar_tend/src/App.tsx` | 전체 화면 렌더링 조립 |
| `bar_tend/src/hooks/useRestationController.ts` | 입장, 퇴장, 메시지, 기본 대화/추천 세션, 최근 칵테일 컨텍스트, 타이핑/제조 상태, 시에스타 이벤트 플래그 |
| `bar_tend/src/components/entrance/BarExterior.tsx` | 바 외부 입장 화면 |
| `bar_tend/src/components/bar/BarInterior.tsx` | 바 내부 메인 화면 |
| `bar_tend/src/components/bar/ChatInput.tsx` | 사용자 입력, 추천 선택지 버튼, 취소 버튼 |
| `bar_tend/src/components/bar/DialogueBox.tsx` | 대화 표시 |
| `bar_tend/src/components/bar/CocktailCard.tsx` | 추천 결과 카드 |
| `bar_tend/src/components/bar/BartenderSprite.tsx` | 카루아 정적 스프라이트와 셰이킹 애니메이션 표시 |
| `bar_tend/src/assets/characters/karua/sprites.ts` | 카루아 정적 이미지와 애니메이션 프레임 import 계약 |
| `bar_tend/src/assets/characters/karua/static/` | 카루아 정적 PNG 에셋 |
| `bar_tend/src/assets/characters/karua/animations/shaker/` | 칵테일 제조 셰이킹 프레임과 metadata |

### 4.2 일반 대화

| 파일 | 역할 |
|---|---|
| `bar_tend/src/lib/bartender/engine.ts` | 안전 검사, 키워드 규칙, 일반 대화 fallback 연결 |
| `bar_tend/src/lib/bartender/intent-classifier.ts` | 추천/대화/이야기/캐릭터/안전 의도 분류와 컨텍스트 메타데이터 |
| `bar_tend/src/lib/bartender/intent-classifier-adapter.ts` | 기존 대화 엔진이 IntentClassifier를 사용하도록 연결 |
| `bar_tend/src/lib/bartender/keywords.ts` | `keyword-rules.json`을 런타임 키워드 규칙으로 컴파일 |
| `bar_tend/src/data/keyword-rules.json` | 키워드 패턴, 표정, 폴백 응답, 대사 카테고리 |
| `bar_tend/src/lib/bartender/conversation.ts` | 일반 대화 intent 감지와 fallback 응답 |
| `bar_tend/src/lib/bartender/persona.ts` | 현재 카루아 말투 기준 프롬프트 |
| `bar_tend/src/lib/bartender/prompts.ts` | persona와 대화 기록을 조합해 프롬프트 구성 |

### 4.3 대사 데이터와 프리셋

| 파일 | 역할 |
|---|---|
| `bar_tend/src/data/dialogues.json` | 카테고리별 짧은 대사 풀 |
| `bar_tend/src/lib/dialogue/dialogue-loader.ts` | `dialogues.json`에서 카테고리 대사 선택 |
| `bar_tend/src/lib/dialogue/text-presets.ts` | 추천 질문 문장 프리셋과 추천 응답 문단 프리셋 |
| `bar_tend/src/types/dialogue-turn.ts` | 구조화된 대화 턴 계약 |
| `bar_tend/src/lib/dialogue/turn-builder.ts` | DialogueTurn 구성과 복구 템플릿 |
| `bar_tend/src/lib/dialogue/input-router.ts` | 안전, 퇴장, 추천, 주문, 이야기, 유래, 칵테일 정보, 캐릭터 질문, 이름 검색 등 입력 경로 판정 |
| `bar_tend/src/lib/dialogue/story-query.ts` | 직전/현재 칵테일의 `talkingPoints` 또는 바 세계관 lore 응답 포맷 |

### 4.4 추천 시스템

| 파일 | 역할 |
|---|---|
| `bar_tend/src/data/recommendation-questions.json` | 추천 질문, 선택지, 상태 갱신 신호, 프리셋 참조 |
| `bar_tend/src/lib/recommendation/question-engine.ts` | 다음 질문 선택, 답변 반영, 후보 분별력 계산 |
| `bar_tend/src/lib/recommendation/state.ts` | 자유 입력 신호 추출, 추천 상태, 후보 필터, 추천 근거 |
| `bar_tend/src/lib/recommendation/response.ts` | 최종 추천 대화문 포맷 |
| `bar_tend/src/hooks/useRecommendationSession.ts` | 추천 질문 진행과 최종 추천 연결 |
| `bar_tend/src/types/recommendation.ts` | 추천 상태, 질문, 선택지, 결정 타입 |

### 4.5 칵테일 데이터

| 파일 | 역할 |
|---|---|
| `bar_tend/src/data/cocktail-db.json` | 실제 추천 후보 칵테일 DB |
| `bar_tend/src/lib/cocktails/database.ts` | 칵테일 검색, 이름/별칭 매칭, 데이터 접근 |
| `bar_tend/src/lib/cocktails/cocktail-db.ts` | 정규화 DB 로드 |
| `bar_tend/src/types.ts` | 공통 칵테일, 메시지, 표정 타입 |
| `bar_tend/src/types/cocktail-db.ts` | 정규화 칵테일 DB 타입 |

### 4.6 시에스타 만담

| 파일 | 역할 |
|---|---|
| `bar_tend/src/lib/banter/siesta-event.ts` | 시에스타 이벤트 발생 조건과 4발화 만담 생성 |
| `bar_tend/src/lib/banter/siesta-event.test.ts` | 만담 이벤트 조건과 구조 테스트 |
| `bar_tend/src/hooks/useRestationController.ts` | `SIESTA_EVENTS_ENABLED`가 켜진 경우에만 본 답변 뒤 시에스타 이벤트 예약 |

### 4.7 세션 흐름 및 마감 정책

| 파일 | 역할 |
|---|---|
| `bar_tend/src/lib/session/session-flow.ts` | 세션 단계 및 XYZ 마지막 잔 발동/Farewell 정책 제어 |
| `bar_tend/src/lib/session/farewell-replies.ts` | XYZ, Farewell Phase, 주문 차단, 귀가 관련 세션 응답 포맷 |
| `bar_tend/src/lib/session/session-flow.test.ts` | 서브 이후 누적 도수 10 이상 도달 시 XYZ 후속 서빙 및 Farewell 단계 테스트 |


## 5. 현재 사용자 입력 처리 흐름

```text
사용자 입력
  ↓
useRestationController
  ↓
현재 actionSessionMode 확인
  - conversation: 일반 대화 기본, 추천 라우트 제한
  - recommendation: 추천 질문/추천 라우트 허용
  ↓
안전 입력 검사
  ↓
웰컴드링크 피드백 또는 추천 질문 진행 중인지 확인
  ↓
입력 라우터
  - safety / exit / recommendation-cancel
  - story-query / lore-query / cocktail-info-query / character-query
  - explicit-cocktail / cocktail-mention / recommendation / general
  ↓
최근 칵테일 컨텍스트 확인
  - lastDiscussedCocktailId
  - lastRecommendedCocktailId
  - lastServedCocktailId
  - lastOrderCandidateCocktailId
  ↓
행동 또는 응답 경로 선택
  ↓
대사 생성
  ↓
추천 칵테일이 있으면 카루아 제조 애니메이션
  ↓
메시지 표시 + 표정 변경 + 필요 시 추천 카드 표시
  ↓
현재는 시에스타 이벤트 비활성화
```

중요한 점은 “추천 판단”과 “대사 표현”이 분리되어 있다는 것이다. 추천 엔진은 칵테일과 근거를 결정하고, 대사 계층은 그것을 어떤 말투와 문단으로 보여줄지 결정한다.

`이야기`, `얽힌`, `유래`, `배경`, `더 들려줘`, `설명해줘` 계열 입력은 일반 경청 fallback으로 보내지 않고 `story-query`, `lore-query`, `cocktail-info-query` 계열로 먼저 분류한다. 직전 추천 칵테일 또는 현재 표시 중인 칵테일 카드가 있으면 해당 칵테일의 `talkingPoints`를 우선 사용하고, 없으면 Re:Station 바 세계관 lore 응답으로 처리한다.

`그걸로 주세요`, `한 잔 주세요`처럼 칵테일명을 생략한 주문형 입력은 `orderCandidateCocktailId`가 있으면 `explicit-cocktail`로 라우팅한다. 이 기능은 아직 완성된 Action Layer가 아니라 컨트롤러 내부 컨텍스트 ref와 입력 라우터 옵션으로 연결된 Phase 1.5의 초기 형태다.

대화 세션은 무한 채팅을 목표로 하지 않는다. 현재 `useRestationController.ts`는 일반 대화 턴을 내부적으로 세고, 약 12턴 이후에는 카루아의 대사 안에서 자연스럽게 추천을 권한다.

## 5.1 세션 종료 흐름 및 마감 정책 (구현 완료)

추천 카드 표시 이후에도 세션이 무한 대화로 열려 있지 않도록 마감 장치가 구현되었습니다.

```text
입장 ➔ 웰컴드링크 ➔ 대화 ➔ 취향 파악 ➔ 추천 ➔ 주문 ➔ 후일담 ➔ XYZ ➔ Farewell Phase ➔ 귀가
```

* **도수 한계:** 웰컴드링크를 제외한 일반 주문/추천으로 칵테일을 서브한 뒤 누적 도수 별점이 10 이상에 도달하면 XYZ를 마지막 잔으로 이어서 서빙하고, 그 뒤 Farewell Phase로 이행합니다.
* **Farewell Phase:** 이 구간에서는 신규 추천, 주문, 재추천이 모두 차단됩니다. 2~3턴(총 3턴) 동안 XYZ의 배경, 유래, 후기, 가벼운 잡담만을 허용하며 이후 자동으로 퇴장 및 귀가 단계로 전환됩니다.
* **상태값 활용:** 세션 분위기 상태값(`trust`, `familiarity`, `playfulness`, `tension`)은 엔딩 분기나 평가용이 아니며, 오직 카루아의 대사 톤과 반응 조절용으로만 사용됩니다.
* **구조 정합성:** 주문이 닫힌 단계(`xyz`, `farewell`, `returnHome`)는 `isOrderingClosedPhase`로 명시되어 있습니다. 컨트롤러는 이 함수로 흐름을 판정하고, 실제 종료·차단 응답 문구는 `farewell-replies.ts`가 담당합니다.

## 6. 현재 대사 구조

### 6.1 키워드 규칙

`keyword-rules.json`은 다음 구조를 사용한다.

```json
{
  "patterns": ["피곤", "지쳤", "지침", "퇴근", "졸려", "녹초"],
  "expression": "sympathy",
  "response": "아, 연료등 켜졌네요. 그럼 오늘은 무거운 건 빼고, 부담 없는 쪽으로 가죠.",
  "dialogueCategory": "mood-tired"
}
```

현재 동작 원칙:

1. `patterns`가 사용자 입력과 매칭된다.
2. `dialogueCategory`가 있으면 `dialogues.json`에서 해당 카테고리 대사를 랜덤 선택한다.
3. 카테고리 대사가 없으면 `response`를 폴백으로 사용한다.
4. `expression`은 표정 상태로 사용한다.

### 6.2 추천 질문 프리셋

`recommendation-questions.json`은 질문 전문을 직접 반복하기보다 프리셋 참조를 사용한다.

대표 필드:

```json
{
  "promptPreset": { "id": "ask_taste" },
  "dialogueFlow": {
    "leadInPreset": { "id": "lead_taste" },
    "continuationPreset": { "id": "continue_taste" }
  }
}
```

프리셋 렌더링은 `text-presets.ts`와 `question-engine.ts`가 담당한다.

### 6.3 추천 응답 문단 프리셋

현재 새 구조는 문장을 잘게 조립하기보다 문단 블록을 조립하는 방향이다.

기본 구조:

```text
[reaction]
[recommend]
[explanation]
```

예시:

```text
연료 부족 경고등이 켜진 것 같은데요.
오늘은 진 토닉이 어울릴 것 같아요.
입맛을 깨워주는 느낌이라 답답할 때도 부담이 적거든요.
```

현재 구현된 슬롯:

| 슬롯 | 의미 |
|---|---|
| `{cocktail_name}` | 칵테일 이름 |
| `{cocktail_name_subject}` | 주격 조사 붙은 칵테일 이름 |
| `{taste_desc}` | 맛 설명 |
| `{reason_desc}` | 추천 이유 |
| `{effect_desc}` | 기대되는 분위기/효과 설명 |
| `{closing_desc}` | 마무리 설명 |

현재 구현 범위:

- `karua + recommend + tired + light`
- `siesta + recommend + tired + light`
- `karua + recommend + default`
- `siesta + recommend + default`

아직 전체 의도와 전체 감정 상태로 확장되지는 않았다.

### 6.4 이야기/유래/정보 질문 응답

현재 이야기 계열 입력은 일반 대화 fallback보다 먼저 처리한다.

| 입력 계열 | 라우트 | 응답 출처 |
|---|---|---|
| “여기 얽힌 이야기 더 들려줘요” | `story-query` | 직전/현재 칵테일의 `talkingPoints`, 없으면 바 세계관 lore |
| “이름 유래가 뭐예요” | `lore-query` | 칵테일명이 있으면 해당 데이터, 없으면 대화 엔진 intent 응답 |
| “레시피/재료/도수 알려줘요” | `cocktail-info-query` | 칵테일 설명/정보 응답 |
| “당신은 누구예요” | `character-query` | 캐릭터 질문 전용 응답 |

추천 멘트, 웰컴드링크 멘트, 사이드바 레시피 주문 멘트는 모두 `selectCocktailTalkingPoint()`를 통해 `cocktail.talkingPoints`를 반영하는 방향으로 정리되어 있다. 다만 전체 Response Pipeline은 아직 미분리 상태라, 응답 선택·템플릿·데이터 삽입·표정 선택은 다음 구조 작업에서 더 명확히 나눠야 한다.

## 7. 카루아 말투 계약

현재 `persona.ts`는 사용자가 직접 수정한 기준 파일이다. 요약하면 다음과 같다.

| 항목 | 방향 |
|---|---|
| 기본 말투 | 존댓말 기반, 문장 사이에 반말/혼잣말/능청을 섞는 반존대 |
| 성격 | 친절하지만 상담원처럼 굴지 않음 |
| 감정 대응 | 정면 위로 대신 농담, 비유, 딴소리로 분위기를 비틂 |
| 금지 | 직접 위로, 해결책 제시, 과한 공손함, 감동 조언 |
| 좋은 예 | “아, 연료등 켜졌네요. 그럼 오늘은 무거운 건 빼고 가죠.” |

기획 시 중요한 점:

- 카루아는 손님을 챙기지만 헌신적이지 않다.
- 카루아는 상담가가 아니다.
- 카루아는 말을 가볍게 하지만 눈치가 빠르다.
- 슬픈 입력에도 바로 위로하지 않는다.
- 피곤한 입력에는 쉬어가게 하되 술을 해결책처럼 말하지 않는다.
- 카루아는 관찰한 사실을 가볍게 말하고 한 잔을 권한다.
- 카루아는 감정을 분석하거나 상대를 교정하지 않는다.

## 8. 시에스타 구조

시에스타는 상시 선택 가능한 대화 캐릭터가 아니다. 설계상 구조는 낮은 빈도의 만담 이벤트다.

2026-06-23 현재 런타임에서는 카루아 단독 흐름을 점검하기 위해 시에스타 이벤트가 임시로 꺼져 있다. `bar_tend/src/hooks/useRestationController.ts`의 `SIESTA_EVENTS_ENABLED`를 다시 `true`로 바꾸기 전까지 시에스타 만담은 화면에 나오지 않는다.

현재 만담 구조:

```text
시에스타 발화
카루아 반응
시에스타 업무 복귀
카루아가 손님에게 대화권 반환
```

기획 원칙:

1. 시에스타는 직전 대화에 짧게 끼어든다.
2. 시에스타는 오래 머물지 않는다.
3. 시에스타는 마지막에 재고, 잔, 청소, 배달 확인 같은 업무로 돌아간다.
4. 마지막 대화권은 카루아가 다시 가져온다.
5. 추천 질문, 안전 입력, 퇴장, 초기화 중에는 끼어들지 않는다.
6. 시에스타는 현자가 아니며 삶의 정답을 말하지 않는다.
7. 시에스타의 말은 철학보다 한번 망해본 사람의 생존 경험처럼 들려야 한다.

## 9. 추천 시스템 구조

추천 시스템은 크게 네 단계다.

```text
입력 신호 추출
  ↓
추천 상태 갱신
  ↓
후보 필터링 / 질문 선택
  ↓
최종 추천 결정 + 대사 포맷
```

### 9.1 추천 상태 및 피처 관리

대표 상태:

| 상태 | 의미 |
|---|---|
| 맛 선호 | 단맛, 신맛, 드라이함 등 |
| 도수 선호 | 낮음, 중간, 높음 |
| 탄산 선호 | 있음/없음 |
| 베이스 선호 | 진, 럼, 위스키 등 (완전 일치 매칭) |
| 선호 재료 | 라임 주스, 민트 등 (자유입력에서 정규화 후 추출) |
| 제외 재료 | 알레르기나 싫어하는 재료 (base_spirit까지 적용하여 제외) |
| 감정 상태 | tired, sad, happy 등 |
| 질문 이력 | 이미 물어본 추천 질문 |

* **드라이함 표기:** 사용자에게 보이는 `쓴맛` 스테이터스 명칭은 `드라이함`으로 정리합니다. 내부 추천 축은 기존 normalized feature를 사용하며, 현재 구조에서는 독립 드라이함 축과 반별점 표시를 제공하지 않습니다.

### 9.2 질문 정책

현재 질문 정책:

- 일반적으로 2~3문항 진행 (맛/풍미, 도수, 탄산, 베이스의 4축 간소화 질문 활용)
- 실제 후보가 1개일 때만 조기 종료
- `카루아에게 맡기기`는 추가 질문 없이 즉시 추천 가능
- `잘 모르겠어요`는 현재 질문만 건너뜀
- 활성 질문 중 긍정형 `아무거나`는 이전 답변을 유지한 '맡기기'로 처리
- 활성 질문이 없을 때 긍정형 `아무거나`는 설문 없이 전체 DB 대상 즉시 랜덤 추천
- 제외 재료와 베이스 같은 하드 조건은 최대한 유지하며 정확 매칭 후보가 없어도 추가 질문 진행

### 9.3 추천 출력

추천 출력은 두 층으로 나뉜다.

| 층 | 역할 |
|---|---|
| 대화창 | 카루아식 추천 멘트와 추천 이유 |
| 카드 | 중립적인 칵테일 정보, 재료, 레시피, 상세 정보 |

카드에 캐릭터 말투를 넣지 않는 것이 현재 원칙이다.

추천 대화문은 `formatRecommendationReply()`에서 문단 프리셋과 추천 사유를 조합한 뒤, 해당 칵테일의 `talkingPoints` 중 하나를 안정적으로 선택해 덧붙인다. 직접 주문(`formatExplicitCocktailReply()`), 랜덤 추천(`formatRandomRecommendationReply()`), 웰컴드링크(`formatWelcomeDrinkReply()`)도 같은 `selectCocktailTalkingPoint()`를 사용한다.

레시피 사이드바에서 `주문` 버튼을 누르면 `RecipeInfoTab` → `Sidebar` → `useRestationController.handleOrderCocktail()` → `formatExplicitCocktailReply()` 경로로 처리된다. 따라서 사이드바 주문도 단순 카드 표시가 아니라 칵테일 제조/서빙 흐름과 이야기 포인트를 포함한 대사로 연결된다.

## 10. 데이터 구조

### 10.0 캐릭터 에셋 구조

카루아 에셋은 대화 로직 폴더에서 분리되어 캐릭터 에셋 루트 아래에 있다.

| 위치 | 역할 |
|---|---|
| `bar_tend/src/assets/characters/karua/static/` | 정적 카루아 PNG |
| `bar_tend/src/assets/characters/karua/animations/shaker/` | 제조 셰이킹 프레임과 metadata |
| `bar_tend/src/assets/characters/karua/sprites.ts` | UI 컴포넌트가 참조하는 단일 import 계약 |

추천 또는 웰컴드링크로 칵테일이 확정되면 `useRestationController`가 `preparing` 상태로 들어가고, `BartenderSprite`가 셰이킹 프레임을 먼저 보여준 뒤 추천 대사와 칵테일 카드가 표시된다.

### 10.1 칵테일 DB

`cocktail-db.json`은 실제 추천 후보의 핵심 데이터입니다. 현재 IBA 공식 31종을 포함해 총 45종의 칵테일 데이터가 구축되어 있습니다.

대표 필드:

| 필드 | 의미 |
|---|---|
| 이름 | 한국어/영어 이름 |
| 설명 | 한 문장 형태의 중립 설명 |
| 재료 | 추천 필터링 및 렌더링에 사용 |
| 레시피 | 한국어 재료명과 ml 중심 정량 |
| 맛 프로필 | 단맛, 신맛, 드라이함, 도수감 (감칠맛 `savory`는 표시 스테이터스에서 제외) |
| 베이스 | 진, 럼, 위스키 등 |
| 출처 | IBA 공식 URL 등 |
| talking_points / talkingPoints | 도감과 대화에서 쓰는 칵테일의 탄생 배경, 이름 유래, 이야기 (정규화 후 런타임에서는 `talkingPoints`로 사용) |

기획상 주의:

- 출처 없는 역사, 유래, 창작자를 만들면 안 되며, 확실하지 않은 정보는 "전해지는 이야기"로 서술합니다.
- IBA 공식이 아닌 항목에 “정통”, “공식”, “클래식” 같은 권위 표현을 붙이면 안 됩니다.
- XYZ 칵테일(`cocktail_classic_043`)은 공식 출처를 비워둔 채 클래식 항목으로 기재되어 있습니다.
- 미확정 칵테일은 관리자 검증 큐로 보내는 구조가 있다.

### 10.2 대사 데이터

현재 대사 데이터는 세 종류가 섞여 있다.

| 데이터 | 위치 | 상태 |
|---|---|---|
| 카테고리 대사 풀 | `dialogues.json` | 정리 필요 |
| 키워드 규칙 | `keyword-rules.json` | JSON 분리 완료 |
| 프리셋/문단 블록 | `text-presets.ts` | 초기 도입 완료 |

다음 기획의 핵심은 이 세 가지의 역할을 명확히 나누는 것이다.

## 11. 현재 구조적 문제

### 11.1 대사 데이터가 아직 세 층으로 흩어져 있음

현재 대사는 다음 위치에 분산되어 있다.

- `dialogues.json`
- `keyword-rules.json`
- `text-presets.ts`
- `conversation.ts`
- `response.ts`

이것은 당장 동작에는 문제가 없지만, 장기적으로 말투 검수와 대사 확장이 어렵다.

### 11.2 문단 프리셋은 아직 추천 일부에만 적용됨

새로 도입한 `[reaction] + [recommend] + [explanation]` 구조는 방향이 좋지만 아직 전체 의도에 적용되지 않았다.

확장이 필요한 의도:

- `greeting`
- `welcome_drink`
- `ask_preference`
- `recommend`
- `explain`
- `small_talk`
- `joke`
- `comfort`
- `refusal`
- `goodbye`
- `story-query`
- `lore-query`
- `cocktail-info-query`
- `character-query`

### 11.3 카루아 말투 검수 기준이 테스트로 충분히 고정되지 않음

`persona.ts`에는 금지 문장과 좋은 예시가 있지만, 실제 대사 풀 전체가 이 계약을 지키는지는 아직 충분히 자동 검증되지 않는다.

특히 점검해야 할 문장:

- “괜찮으시면 천천히 말씀해 주세요”
- “힘드셨겠어요”
- “괜찮아요”
- “제가 도와드릴게요”
- “해결해드릴게요”
- “마음이 나아질 거예요”

이런 문장은 카루아 톤과 어긋날 가능성이 높다.

### 11.4 시에스타 말투와 카루아 말투의 구조적 분리가 더 필요함

현재 시에스타 만담은 별도 이벤트 엔진으로 존재하지만 런타임에서는 임시 비활성화되어 있다. 추천 응답 프리셋에서는 이제 막 시에스타 버전을 넣기 시작한 상태다.

기획적으로 정해야 할 것:

- 시에스타가 추천을 직접 해도 되는가
- 시에스타가 사용자 질문에 얼마나 답해도 되는가
- 시에스타의 대사 톤은 얼마나 건조해야 하는가
- 카루아가 시에스타를 어떻게 받아치는가

### 11.5 컨트롤러와 세션 도메인의 책임 경계

`useRestationController.ts`는 입장, 퇴장, 입력 라우팅, 추천 세션 연결, 최근 칵테일 컨텍스트, 세션 종료, 타이핑/제조 연출을 조율하는 중심 컨트롤러다.

세션 단계와 마감 정책은 `lib/session/session-flow.ts`가 담당한다. 주문이 닫힌 단계는 `isOrderingClosedPhase`가 판정하며, 해당 단계는 `xyz`, `farewell`, `returnHome`이다.

XYZ, Farewell Phase, 주문 차단, 귀가 관련 응답 문구는 `lib/session/farewell-replies.ts`가 담당한다. 컨트롤러는 이 모듈들이 제공하는 판정과 응답을 사용해 실제 메시지 출력, 타이핑 상태, 카드 표시, 퇴장 지연 같은 화면 흐름을 연결한다.

현재 책임 경계:

- `session-flow.ts`: 세션 단계, 주문 가능 여부, 서브 이후 도수 한계 기반 XYZ 후속 서빙, Farewell 종료 조건
- `farewell-replies.ts`: 세션 마감 구간에서 사용자에게 보여줄 응답 문구
- `input-router.ts`: 사용자의 원문 입력을 안전, 퇴장, 추천, 이야기, 정보, 캐릭터, 주문, 일반 대화 라우트로 분류
- `useRestationController.ts`: 입력 처리 흐름 조율, 컨텍스트 ref 갱신, 상태 반영, 메시지 표시와 연출 연결

이 경계는 코드 검수 시 컨트롤러가 도메인 판단을 과도하게 직접 수행하는지 확인하는 기준으로 사용한다.

### 11.6 Context + Action Layer가 아직 독립 모듈이 아님

`lastDiscussedCocktailId`, `lastRecommendedCocktailId`, `lastServedCocktailId`, `lastOrderCandidateCocktailId`는 현재 컨트롤러 내부 ref로 관리된다. 이 덕분에 “그걸로 주세요” 같은 생략 주문과 직전 칵테일 이야기 질문을 어느 정도 처리할 수 있지만, 아직 독립된 Conversation Context나 Action Layer로 분리된 상태는 아니다.

다음 구조 작업에서는 의도 분류 결과가 바로 응답 문자열로 가지 않고 `order`, `serve`, `recommend`, `continueStory` 같은 행동 객체로 이어져야 한다. 그래야 `모히토` → `그걸로 주세요` → 실제 주문, `그 이야기 더 들려줘요` → 직전 칵테일 `talkingPoints` 같은 흐름을 테스트 가능한 단위로 고정할 수 있다.

## 12. 외부 기획자에게 요청할 기획안 범위

외부 AI에게 구현이 아니라 다음 기획안을 요청하는 것이 적합하다.

현재는 확장이 아니라 수렴 단계다. 외부 AI에게 WebLLM, 새 추천 알고리즘, 새 캐릭터, 추가 이벤트 시스템 기획을 요청하지 않는다.

### 12.1 우선 요청할 것

1. 대표 사용자 입력 30~50개의 의도 분류 기대값
2. `story-query / lore-query / cocktail-info-query / character-query`별 응답 출처 기준
3. `모히토` → `그걸로 주세요` 같은 생략 주문 시나리오 목록
4. `reaction / recommend / explanation` 블록별 대사 샘플
5. intent별 문단 구조 설계
6. 카루아 말투 기준 재정리
7. 금지 문장 패턴 목록
8. 시에스타와 카루아의 말투 차이

### 12.2 요청하지 않는 편이 좋은 것

외부 AI에게 바로 코드 구현을 맡기는 것은 비추천이다.

이유:

- 추천 엔진과 대사 계층의 책임 분리가 중요하다.
- `persona.ts` 보존 같은 로컬 맥락이 있다.
- JSON과 TypeScript 프리셋이 아직 전환 중이다.
- 무작정 대사를 늘리면 품질 검수가 어려워진다.

## 13. 외부 AI에게 줄 수 있는 과제 예시

아래 문장을 그대로 외부 AI에게 전달해도 된다.

```text
Re:Station이라는 가상의 바 프로젝트가 있다.
주 캐릭터 카루아는 대학생 바텐더 알바생이며, 존댓말을 기본으로 하되 반말/혼잣말/능청을 섞는다.
상담가처럼 위로하거나 해결책을 주지 않고, 농담·비유·딴소리로 분위기를 살짝 비튼다.
카루아는 감정을 분석하지 않는다. 문제를 해결하지 않는다. 관찰한 사실을 가볍게 말하고 한 잔을 권한다.

보조 캐릭터 시에스타는 현자가 아니다. 삶의 정답을 말하지 않는다.
시에스타의 말은 철학이 아니라 한번 망해본 사람의 생존 경험에서 나온 것처럼 들려야 한다.

현재 대사는 JSON/프리셋으로 정리하려고 한다.
문장을 조립하는 방식이 아니라 문단 블록을 조립하려고 한다.
기본 구조는 [reaction] [recommend] [explanation]이다.

상태(state), 의도(intent), 요청(request), 화자(speaker)에 따라 사용할 블록 풀이 달라진다.
예: speaker=karua, intent=recommend, state=tired, request=light

기획해줄 것:
1. 대표 입력을 story-query / lore-query / cocktail-info-query / character-query / recommendation / general로 분류하는 기준
2. "모히토" → "그걸로 주세요"처럼 맥락이 이어지는 입력 시나리오
3. intent 목록별 문단 블록 구조
4. tired/sad/happy/recommend/refusal/goodbye 대표 블록 샘플
5. 카루아 말투 금지 규칙과 좋은 예시
6. 같은 상황에서 시에스타 버전은 어떻게 달라져야 하는지

주의:
- 술이 감정 문제의 해결책처럼 보이면 안 된다.
- 직접 위로, 상담, 치료자 말투는 피한다.
- 추천 결과는 이미 시스템이 정한다고 가정하고, 대사는 표현만 담당한다.
- 입력 의도와 응답 출처 안정화가 말투 개선보다 우선이다.
```

## 14. 추천 후속 작업 순서

현재 `mission_control/TASK_BOARD.md`와 `HANDOVER.md`에는 다음 구조 로드맵이 기록되어 있다.

1. `Phase 1` IntentClassifier 통합 마무리: 추천/대화/이야기/캐릭터/안전 의도 분류 안정화
2. `Phase 1.5` Context + Action Layer: `모히토` → `그걸로 주세요` → 실제 주문처럼 이어지는 흐름 구현
3. `Phase 2` Response Pipeline: 응답 선택, 템플릿, 데이터 삽입, 표정 선택 분리
4. `Phase 3` DialogueService 분리: `useRestationController`에서 대화 판단 로직 분리
5. `Phase 4` Conversation Context 완성: `lastDiscussed`, `lastRecommended`, `lastServed`, `lastOrderCandidate` 정리
6. `Phase 5` Action Layer: `order`, `serve`, `recommend`, `continueStory` 같은 행동 실행 계층 구현
7. `Phase 6` Slot Filling 추천 FSM: 질문 순서 강제보다 사용자가 말한 취향 슬롯을 자유롭게 채움
8. `Phase 7` Dialogue Quality: fallback 감소, bar/character/story 전용 응답 강화
9. `Phase 8` Talking Points 확장: lore/talking_points 풍부화
10. `Phase 9` Character Layer: 카루아 말투, 농담, 반존대, 표정 FSM 반영

* **FLOW-002 (XYZ/Farewell 머신)** 작업은 완료되었습니다.
* 기존 `DLG-807~809`, `SPR-001~005`, WebLLM RST-601~606은 위 구조 수렴과 충돌하지 않는 순서로 재검토한다.
* 현재 임시 판단 기준은 `mission_control/CURRENT_LOGIC_FOCUS.md`에 별도로 정리되어 있습니다. 이 문서는 시에스타를 제거하기 위한 문서가 아니라, 카루아 단독 추천·제조·서빙 루프를 먼저 안정화하기 위한 단기 기준입니다.

외부 기획안은 지금 단계에서는 말투 샘플보다 입력 의도, 응답 출처, 컨텍스트 이어받기 기준에 연결되는 것이 가장 좋다.

## 15. 현재 검증 상태

마지막 확인 기준:

| 검증 | 상태 |
|---|---|
| 타입체크 | 통과: `npm.cmd run check` |
| 린트 | 통과: `npm.cmd run lint` |
| 빌드 | 통과: `npm.cmd run build` |
| 전체 테스트 | 통과: `npm.cmd test` 기준 18개 파일, 218개 테스트 |
| 메인 JS | 빌드 기준 약 443.70 kB, gzip 약 130.74 kB |

마지막 확인 시점 기준으로 알려진 Vitest 실패는 없다. 코드 리뷰와 검수 시에는 입력 라우팅, 컨텍스트 이어받기, `talkingPoints` 응답 출처, 세션 마감 정책을 중점 확인한다.

## 16. 기획안 평가 기준

외부 AI가 가져온 기획안은 아래 기준으로 평가하면 된다.

| 기준 | 질문 |
|---|---|
| 캐릭터성 | 카루아가 상담가가 아니라 카루아처럼 말하는가 |
| 안전성 | 술을 감정 해결책처럼 말하지 않는가 |
| 구조성 | 문단 블록으로 재사용 가능한가 |
| 분리성 | 추천 판단과 대사 표현을 섞지 않는가 |
| 확장성 | 카루아/시에스타/상태/의도별로 확장 가능한가 |
| 구현 가능성 | 현재 JSON/프리셋 구조에 옮기기 쉬운가 |
| 검수 가능성 | 금지 문장과 좋은 예시가 명확한가 |
