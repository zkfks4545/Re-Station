# Phase 9~10 진입 전 검수와 이관 준비

> 작성일: 2026-07-02  
> 상태: Phase 9 진행 중, Phase 10 계약 준비 완료·데이터 이관 미착수

## 결론

Phase 9의 기반 계층은 동작하지만 전체 대사 품질 검수가 끝나지 않았으므로 완료 처리하지 않는다. Phase 10은 ResponsePlan 타입·선택·검증 계약까지 준비됐으며, 기존 DB를 한 번에 교체하지 않고 어댑터와 카테고리 배치 단위로 진행한다.

## Phase 9 검수 결과

완료된 기반:

- `persona.ts`를 직접 참조하는 Character Profile
- 금지·권장 표현, 문장 수, 반존대, 능청, 추천 어조 검증
- `Response Pipeline → Character Layer → BartenderResponse` 연결
- 응답 텍스트·표정·추천 결과를 바꾸지 않는 회귀
- 실제 `PARAGRAPH_PRESETS` 원본을 직접 검사하는 카루아 말투 테스트
- WebLLM 금지 route가 reaction 표식으로 우회되지 않는 차단 계약

Phase 9 완료 전 남은 조건:

- `dialogues.json` 전체 55개 카테고리·436개 문장을 출처별로 재검수
- `response-templates.ts`, 추천·웰컴·배웅·이야기 포매터의 상담원형 fallback 정리
- 권장 말투 검증의 오탐·누락 대표 입력 세트 확장
- Character 메타데이터를 관찰용으로 어디까지 보존할지 결정
- WebLLM timeout 뒤 실제 엔진 작업 종료 보장과 준비 중 다운로드 취소 문제 해결

## Phase 10 이관 대상 인벤토리

| 출처 | 현재 규모 | Phase 10 처리 원칙 |
|---|---:|---|
| `dialogues.json` | 55개 카테고리, 436개 문장 | 짧은 `fallbackText`를 유지하며 ResponsePlan 블록으로 배치 이관 |
| `keyword-rules.json` | 19개 규칙, 19개 category 참조 | 판단 패턴은 유지하고 완성 대사는 계획 ID 또는 fallback으로 축소 |
| `text-presets.ts` 문장 프리셋 | 7개 | 추천 질문 동작을 보존한 채 계획 참조로 점진 전환 |
| `text-presets.ts` 문단 프리셋 | 4개 | `speaker/intent/state/request/blocks/fallbackText` 계약으로 이관 |
| `response-templates.ts` | intent·mood·taste·rude fallback | 데이터 삽입 Draft와 완성 대사 책임 분리 |

## 추가된 Phase 10 선행 계약

`response-plan.ts`는 다음 필드를 고정한다.

```text
id
speaker
intent
state?
request?
blocks
fallbackText
expression?
```

- 가장 구체적인 `state/request` 계획을 우선 선택한다.
- 구체 계획이 없으면 동일 화자·intent의 기본 계획만 사용한다.
- 다른 화자나 intent의 첫 항목으로 암묵적으로 떨어지지 않는다.
- `fallbackText`와 하나 이상의 비어 있지 않은 block을 필수로 검증한다.
- 기존 런타임은 ResponsePlan 이관 중에도 항상 JSON·규칙 fallback으로 동작해야 한다.

## 권장 이관 순서

1. ResponsePlan 어댑터를 기존 `pickDialogue()` 앞에 선택적으로 둔다.
2. `general-chat`, `mood-*`, `bar-intro`, `character-query`를 첫 배치로 이관한다.
3. 이전 JSON 출력과 intent·expression·fallback 동등성 테스트를 추가한다.
4. 추천·주문·안전·farewell은 일반 대화 배치가 안정된 뒤 옮긴다.
5. 출처 사용이 0이 된 완성 대사만 마지막에 제거한다.

## 금지

- `dialogues.json` 전체를 한 번에 삭제하거나 변환하지 않는다.
- ResponsePlan이 추천 결과, Action, SessionState, ConversationContext를 결정하지 않는다.
- 안전 응답과 사실 데이터는 말투 이관 과정에서 의미를 바꾸지 않는다.
- WebLLM을 Phase 10 데이터 이관의 필수 실행 조건으로 만들지 않는다.
