# WebLLM 의미 보조 계약

> 최종 갱신일: 2026-07-02

## 역할

WebLLM은 대사를 생성하지 않는다. JSON·FSM·Rule Engine이 대사와 행동을 결정하고, WebLLM은 다음 구조화 의미 후보만 비동기로 제안한다.

- topic
- conversation stance
- ResponsePlan block 후보
- 현재 세션 태그
- 선택적 rapport 힌트
- confidence

WebLLM이 없거나 느리거나 실패해도 JSON 대화 결과는 완전히 동일해야 한다.

## 실행 흐름

```text
WebLLM 없음
사용자 입력 → JSON/FSM → ResponsePlan → 대사

WebLLM 사용
사용자 입력 ───────────────→ JSON/FSM → ResponsePlan → 대사
          └→ 비동기 의미 분석 → 검증된 세션 태그 → 이후 ResponsePlan 선택 보조
```

현재 의미 분석은 fire-and-forget으로 실행한다. 사용자의 현재 응답은 분석 완료를 기다리지 않는다. Phase 10 ResponsePlan 이관 전에는 세션 태그를 실제 대사 선택에 사용하지 않는다.

## 설정

```env
VITE_WEB_LLM_PRELOAD_ENABLED=true
VITE_WEB_LLM_SEMANTIC_ENABLED=false
```

- PRELOAD는 기본 ON이지만 모델 준비는 브라우저 idle 시점과 capability 검사 뒤에 시작한다.
- SEMANTIC은 기본 OFF다. ON일 때도 최종 문장은 생성하지 않는다.
- WebGPU·secure context·장치 조건을 통과하지 못하면 조용히 JSON 전용으로 동작한다.

## 구조화 출력

허용 예시:

```json
{
  "topic": "work",
  "stance": "observant",
  "responseBlocks": ["reaction", "metaphor"],
  "rapportHint": "neutral",
  "sessionTags": ["burnout", "work"],
  "confidence": 0.82
}
```

모든 필드는 코드에 정의된 허용 목록으로 검증한다. 알 수 없는 topic·tag·block은 버리고, 자유문장·마크다운·잘못된 JSON·범위를 벗어난 confidence는 전체 결과를 폐기한다.

## 세션 태그

세션 태그는 메모리에만 존재한다. 저장소, 도감, 추천 상태, 사용자 프로필에 기록하지 않는다. 새 입장, 밤 초기화, 퇴장 완료 시 모두 삭제한다.

현재 허용 태그:

- burnout
- music
- work
- travel
- nostalgia
- energetic
- quiet

## 비차단·복구 원칙

- 분석 중 새 요청은 대기하지 않고 WebLLM 분석만 건너뛴다.
- 제한 시간을 넘으면 결과를 버리고 해당 세션의 WebLLM을 비활성화한다.
- safety·추천·주문·farewell·lore·recipe 경로는 분석 대상이 아니다.
- RecommendationResult, Action, SessionState, ConversationContext는 WebLLM 결과에 의존하지 않는다.
- JSON/FSM이 언제나 최종 권한을 가진다.

## 향후 연결

Phase 10에서 ResponsePlan DB가 준비된 뒤, 검증된 `responseBlocks`와 세션 태그를 계획 선택의 낮은 우선순위 힌트로만 사용할 수 있다. 힌트가 없거나 충돌하면 기존 규칙 선택을 유지한다.
