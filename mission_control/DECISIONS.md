# 의사결정 기록 (축약)

## 결정 목록

| 결정 ID | 날짜 | 상태 | 결정 내용 | 커밋 |
|---|---|---|---|---|
| DEC-001 | 06-11 | 승인 | `mission_control/` 작업 운영 기준 | `8b99390` |
| DEC-002 | 06-11 | 승인 | 카루아 중심 MVP, 시에스타 만담 이벤트 | `c83fa4b` |
| DEC-003 | 06-11 | 승인 | 추천 결과·근거 = DB·규칙 엔진 결정 | `bc23714` |
| DEC-004 | 06-11 | 대체 | WebLLM = Web Worker, 백엔드 없음 | DEC-029로 대체 |
| DEC-005 | 06-11 | 대체 | WebLLM 말투 포장 품질 기준 모델 평가 | DEC-029로 대체 |
| DEC-006 | 06-11 | 대체 | WebLLM 실패 시 확정 원본 답안 유지 | DEC-029로 대체 |
| DEC-007 | 06-11 | 승인 | 시에스타 상시대화·캐릭터선택·게임 = MVP 이후 | `c83fa4b` |
| DEC-008 | 06-11 | 승인 | `CHARACTER_DESIGN.md` 단일 기준 | `c83fa4b` |
| DEC-009 | 06-11 | 승인 | 단일 `CocktailData` 컬렉션 | `dcbbda5` |
| DEC-010 | 06-11 | 승인 | 이름 검색 → 취향 추천보다 우선 | `dcbbda5` |
| DEC-011 | 06-11 | 대체 | WebLLM 말투 포장 + 지연 비용만 검증 | DEC-029로 대체 |
| DEC-012 | 06-11 | 승인 | 시에스타 = 저빈도 만담 이벤트 | `c83fa4b` |
| DEC-013 | 06-12 | 대체 | DEC-015로 폐기 | `aa790b2` |
| DEC-015 | 06-13 | 대체 | WebLLM = 확정 답안 말투 포장 전용, 잠정 보류 | DEC-029로 대체 |
| DEC-016 | 06-13 | 승인 | IBA 공식 레시피 URL+분류 기록 | `9393bf9` |
| DEC-017 | 06-13 | 승인 | 추천 카드=중립문구, 대화창에만 카루아 멘트 | `003a5cd` |
| DEC-018 | 06-13 | 승인 | 추천 4축(맛·도수·탄산·베이스), 롱숏 제외 | `c30ca49` |
| DEC-019 | 06-14 | 승인 | 런타임=존댓말 응대, 프롬프트 예문은 보존 | `003a5cd` |
| DEC-020 | 06-16 | 승인 | IBA 우선, 관리자 검증 큐 | `9393bf9` |
| DEC-021 | 06-16 | 승인 | 입력 경로 기반 대사 트리거 | `b652d22` |
| DEC-022 | 06-22 | 승인 | DLG-807~809 전 신규기능 보류, 대사 수렴 우선 | `a8b42c1` |
| DEC-023 | 06-23 | 승인 | 닫힌 세션(웰컴→추천→XYZ→Farewell→귀가) | `ced5870` |
| DEC-024 | 06-24 | 승인 | 표시용 맛 스테이터스 감칠맛 제거 | `8c94c3b` |
| DEC-025 | 07-02 | 대체 | WebLLM 실험 인프라 재연결, 준비·응답 기본 OFF, JSON 대화 우선 | DEC-029로 대체 |
| DEC-026 | 07-02 | 대체 | WebLLM 준비 기본 ON, 접속 직후 자동 다운로드 | DEC-027로 대체 |
| DEC-027 | 07-02 | 대체 | WebLLM은 자유대사 생성 금지, 구조화 의미 분석과 세션 태그 제안만 담당 | DEC-029로 대체 |
| DEC-028 | 07-22 | 승인 | 추천 중 대화 확장은 새 모드가 아니라 추천 상태·대화 주제·중단 질문·추출 취향의 동시 유지로 구현 | 현재 작업 |
| DEC-029 | 07-22 | 승인 | 전체 상호작용을 Input → Understand → Evaluate → Select → Plan → Present로 통일하고 WebLLM 중심 계획을 폐기 | 현재 작업 |
| DISC-001 | 06-13 | 논의중 | JSON 대화 계약 (DLG-801/DATA-801/802 완료) | `eef6fd6` |

---

## DEC-029: 결정론적 상호작용 파이프라인

Re:Station의 추천, 잡담, 스토리, 세션, 캐릭터 이벤트를 다음 단일 패턴으로 통일한다.

```text
Input
→ Understand
→ Evaluate
→ Select
→ Plan
→ Present
```

- **Input**: 사용자 문장뿐 아니라 세션·캐릭터·시스템 이벤트와 현재 읽기 전용 문맥을 포함한다.
- **Understand**: `InputUnderstanding`이 `PrimaryTopic`, `SpeechAct`, `PreferenceSignal`, `Entity`, `ControlIntent`, 턴 단위 `ConversationStateCue`를 근거와 confidence와 함께 구조화한다.
- **Evaluate**: 칵테일, 다음 질문, 스토리 fact, 대화 전략, 캐릭터 이벤트 후보를 도메인별 순수 평가기로 평가한다. 공통 단계는 공유하지만 모든 도메인을 하나의 범용 후보 타입이나 평가기로 합치지 않는다.
- **Select**: 하드 제약과 우선순위를 적용해 최종 후보를 결정적으로 선택하고 평가 근거를 보존한다.
- **Plan**: 선택 결과를 `DialogueMove`와 FSM transition으로 변환한다. 상태 변경은 이 단계가 만든 transition을 reducer가 적용할 때만 발생한다.
- **Present**: `ResponsePlan`이 이미 결정된 사실과 행동을 문장·표정으로 표현하고 Sprite·Audio cue를 구성한다. 추천, 상태, 사실을 다시 결정하지 않는다.

단계 불변식:

1. Understand, Evaluate, Select는 상태를 변경하지 않는다.
2. Plan만 상태 transition을 만든다.
3. Present는 결정된 결과를 표현하며 도메인 판단을 변경하지 않는다.
4. 안전과 `ControlIntent`는 모든 일반 후보보다 우선한다.
5. 동일 입력과 상태는 동일 평가·선택·계획을 만든다. 의도적 변이는 주입된 seed나 Present 내부 정책으로 제한한다.
6. 후보 점수와 추천 이유는 같은 평가 contribution에서 파생한다.
7. FSM 현재 상태는 Input 문맥으로 읽되 FSM 변경은 Plan 전까지 금지한다.

WebLLM 중심 계획은 폐기한다. 현재 WebLLM 코드는 단계적으로 기본 번들·실행 경로에서 제거하며 과거 실험 기록만 보존한다. 외부 API는 미등록 은유·복합 발화·암시적 취향을 `SemanticCandidate`와 원문 evidence span으로 제안하는 선택적 보조 수단만 허용한다. API는 `ControlIntent`, FSM, 추천 결과, 후보 점수, 세계관·캐릭터 사실, `DialogueMove`, `ResponsePlan`, 최종 문장·표정·행동을 생성하거나 변경할 수 없다. 실패·시간 초과·검증 실패 시 상태를 바꾸지 않고 내부 확인 질문이나 기존 ResponsePlan으로 복구한다.

마이그레이션은 전면 교체하지 않는다. 현재 P0.5를 기준선으로 보존하고 WebLLM 제거, Replay, InputUnderstanding shadow, Evaluate/Select, DialogueMove·FSM, 도메인별 점진 적용, 제한적 API 순서로 진행한다. `ResponseFragment`는 문장 증가와 반복 문제가 확인될 때까지 도입하지 않는다.

DEC-004~006, DEC-011, DEC-015, DEC-025~027의 활성 WebLLM 방향을 이 결정으로 대체한다. DEC-028의 추천 중 대화 중단·복귀 계약은 유지한다.

---

## DEC-028: 추천 중 대화 중단과 복귀

추천 질문 중 잡담·칵테일 지식·세계관·캐릭터·감정/일상 질문이 들어와도 별도 대화 모드를 만들지 않는다. RecommendationState와 기존 PendingQuestion을 보존하고, 현재 ConversationTopic, SuspendedQuestion, ExtractedPreferences를 함께 유지한다. 주제 응답 뒤 저장된 질문으로 복귀한다. 추천 거부는 FSM을 종료하되 일반 대화와 이후 새 추천 진입은 허용한다. safety와 farewell 우선순위는 바꾸지 않는다.

---

## DEC-027: WebLLM 의미 보조 전용

WebLLM의 자유문장 생성 역할을 폐기한다. WebLLM은 topic, stance, ResponsePlan block 후보, 세션 태그, rapport 힌트와 confidence만 JSON으로 제안한다. JSON/FSM/Rule Engine이 최종 대사와 행동을 결정하며 현재 응답은 WebLLM을 기다리지 않는다. 세션 태그는 영구 저장하지 않고 입장 초기화·퇴장·밤 초기화 때 삭제한다. 모델 준비는 접속 직후가 아니라 브라우저 유휴 시간에만 예약한다. 허용 목록 검증에 실패한 자유문장, 알 수 없는 태그, 잘못된 JSON은 폐기하고 기존 규칙 기반 흐름을 유지한다.

---

## DEC-026: WebLLM 접속 직후 자동 준비

DEC-025의 준비 기본값만 대체했던 결정이다. PRELOAD 기본 ON은 유지하되 접속 직후 준비 방식은 DEC-027의 브라우저 유휴 시간 준비로 대체되었다. 자유 문장 응답 생성 개념 역시 DEC-027의 구조화 의미 분석으로 대체되었다.

---

## DEC-025: WebLLM 실험 인프라 재연결

WebLLM을 최종 대화 기능이 아닌 실험 인프라로 다시 연결한다. 모델 준비와 응답 생성은 별도 기능 플래그이며 둘 다 기본값은 OFF다. JSON·DB·규칙 응답이 항상 먼저 생성되고 WebLLM 실패·취소·시간 초과·검증 실패 시 그대로 최종 응답이 된다. 현재는 실제 DialogueService 출력에 WebLLM을 연결하지 않는다.

---

## DEC-024: 표시용 맛 스테이터스 간소화
카드 표시용 맛 스테이터스에서 감칠맛 제거. 내부 `savory` 필드는 데이터 호환용으로 유지. 향미·바디감·스파이스는 별도 계약 전까지 보류.

## DEC-023: 닫힌 세션 흐름과 XYZ 종료 장치
환상주점은 AI 챗봇·연애 미연시가 아님. 자유입력 허용하나 진행은 웰컴→추천→XYZ→Farewell→귀가로 닫힘. 호감도 시스템·엔딩 루트 금지. 세션 분위기(trust/familiarity/playfulness/tension)는 말투 조절용. XYZ는 마지막 드링크이자 추가주문 종료 선언. Farewell Phase에서 2~3턴 대화 후 귀가.

## DEC-022: 1차 수렴 기간과 신규 기능 보류
DLG-807~809 전까지 신규 기능 확장보다 대사·캐릭터 일관성 수렴 우선. 카루아=상담가 아님, 관찰→가볍게 말함→한잔 권함. 시에스타=현자 아님, 생존 경험에서 말함. 대사 단위=문단 블록 조립.

## DEC-021: 입력 경로 기반 대사 트리거
대화 소재는 칵테일ID가 아닌 입력 경로가 결정. 3축 분리: route(소재), dialogueState(말투·리듬·애니메이션), affectState(표정·어조). 반복 방지(최근N개 제외, 상태별 풀 분리, shuffle/cycle).

## DEC-020: 칵테일 데이터 확장과 관리자 검증 큐
IBA 공식 최우선. 변형·시그니처는 확인된 레시피+맛 설명만 보강. 정보부족/검색실패/출처충돌 → 관리자 검증 큐. 권위 표현 출처 없이 생성 금지. 공통DB 필요 시 BaaS 우선.

## DEC-019: 자연스러운 런타임 응대와 프롬프트 보존
모든 발화 = 자연스러운 존댓말. persona.ts/prompts.ts/CHARACTER_DESIGN.md 예문은 보존.

## DISC-001: JSON 중심 대화 계약
입력 의미 → `DialogueTurn` JSON(intent/entities/statePatch/action/responseGoal/facts/forbidden/confidence). JSON에 대사전문 저장 금지. DLG-801/DATA-801/DATA-802 완료.

## DEC-018: 추천 질문 축 간소화
5축→4축(맛·도수·탄산·베이스). 단맛+산미 통합. 롱숏 제외. 120조합(정확70+최근접50).

## DEC-017: 추천 카드와 카루아 대화 문구 분리
카드=DB 기반 중립문구. 카루아 멘트·추천이유=대화창 전용.

## DEC-016: IBA 공식 레시피 기반 데이터 확장
IBA 재료·수치 기준 레시피 기록. 추천용 맛값은 내부 추정값으로 별도 관리.

## DEC-015: WebLLM 말투 포장 전용 및 잠정 보류
규칙 엔진=내용·판단 확정. WebLLM=확정 답안의 말투 변환만 허용. 입력해석·상태갱신·추천결정 금지.

## DEC-013: 단계적 대화형 추천 질문 (DEC-015로 대체)
JSON 질문→규칙 상태 반영. WebLLM 도입 전후 동일 계약 유지.

## DEC-012: 시에스타 만담 이벤트
카루아 주캐. 시에스타=불쑥 난입→2~4발화 만담→업무복귀. 추천흐름·안전·퇴장 중 금지.

## DEC-010: 이름 검색 우선
입력에 칵테일명 있으면 취향탐색보다 우선. 재료·향 표현은 취향 추천으로.

## DEC-011: OpenAI/Ollama→WebLLM 전환
Web Worker 기반. 규칙 즉시반응→WebLLM 백그라운드 스트리밍. 첫토큰 800ms 목표.

## DEC-009: 단일 CocktailData 컬렉션
정규화DB+표시정보 결합. 추천·검색·카드·도감 동일 객체. `toLegacyCocktail()` 제거.

## DEC-008: 캐릭터 대화 설계 계약
규칙엔진·프롬프트·대사원고·평가세트 = CHARACTER_DESIGN.md 기준.

## DEC-007: MVP 이후 항목
시에스타 상시대화·캐릭터선택·웰컴드링크·게임 = MVP 이후 연기.

## DEC-004~006: WebLLM 프론트엔드 단독
백엔드 불필요. Qwen/Gemma 평가 후 선택. 실패 시 규칙 엔진 복구.

## DEC-003: 추천과 생성형 대화 분리
추천=DB·규칙 결정. WebLLM=표현만.

## DEC-002: 카루아 중심 MVP
카루아 주도. 시에스타=저빈도 만담.
