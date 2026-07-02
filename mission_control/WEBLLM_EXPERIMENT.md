# WebLLM 실험 연결 계약

> 최종 갱신일: 2026-07-02

## 현재 상태

WebLLM은 최종 대화 기능이 아니라 실험 인프라로만 다시 연결되어 있다. JSON·DB·규칙 기반 대화가 여전히 유일한 기본 응답 시스템이다.

모델 준비와 응답 생성은 서로 독립적으로 관리한다. 모델 준비는 기본 활성화하고 응답 생성만 기본값을 `false`로 둔다.

```env
VITE_WEB_LLM_PRELOAD_ENABLED=true
VITE_WEB_LLM_RESPONSE_ENABLED=false
```

- `PRELOAD`: 접속 직후 capability 검사를 통과하면 Web Worker에서 모델 준비를 시작한다. 별도 설정이 없을 때도 활성화된다.
- `RESPONSE`: 이미 준비된 모델의 실험 생성 API 호출을 허용한다.
- `RESPONSE=false`이면 어떤 경우에도 생성 API를 호출하지 않는다.
- 현재 실험 생성 API는 실제 `DialogueService`와 메시지 출력 경로에 연결하지 않았다.

## 안전한 준비 경계

- WebGPU, Chromium 계열 브라우저, secure context를 확인한다.
- 확인 가능한 경우 `deviceMemory` 4GB 이상, 논리 CPU 4개 이상을 요구한다.
- 싱글턴 로더와 단일 준비 Promise로 중복 초기화·다운로드를 막는다.
- 첫 렌더가 끝난 직후 capability 검사를 거쳐 준비를 시작한다.
- 준비 실패 또는 capability 실패 시 해당 세션에서 비활성화하고 자동 재시도하지 않는다.
- 모델과 라이브러리는 동적 import 및 Web Worker로 분리해 초기 대화 번들을 막지 않는다.

기본 후보 모델은 `Qwen2.5-0.5B-Instruct-q4f16_1-MLC`이다. 저자원 후보이지만 모델 데이터가 약 945MB이므로 사용자 네트워크·저장공간·GPU 자원을 사용한다. capability 조건에 맞지 않으면 다운로드를 시작하지 않는다.

## 실험 생성 경계

허용 후보:

- `general-chat`
- 가벼운 잡담
- 단순 반응

금지 경로:

- safety-alert와 알코올 안전 안내
- 추천 결정과 칵테일 선택
- 주문, 시크릿 메뉴, XYZ, farewell
- SessionState, Action, ConversationContext 변경
- lore, recipe, ingredients, talkingPoints, 칵테일 사실 생성

규칙 기반 응답을 항상 먼저 만들고, WebLLM 결과가 시간·형식·말투 검증을 모두 통과할 때만 실험 결과로 반환한다. 빈 응답, 1~3문장 초과, 비한국어, 마크다운, 목록, 프롬프트 노출, 상담가·AI 도우미형 표현은 즉시 폐기하고 규칙 응답으로 복구한다.

생성 제한은 temperature `0.35`, 최대 `96`토큰, 최근 대화 최대 4개, 제한 시간 4초다. 동시 생성은 하나만 허용하며 새 요청은 이전 요청을 취소한다. 취소·시간 초과·stale 결과는 화면에 반영하지 않는다.

## 개발 환경 디버그 API

개발 빌드에서만 `window.__RESTATION_WEBLLM__`을 제공한다.

- `status()` 현재 상태와 메타데이터
- `prepare()` 수동 준비
- `unload()` 모델 해제
- `disable()` 현재 세션 비활성화
- `test(input)` RESPONSE 플래그가 허용된 경우 실험 생성

프로덕션 UI에는 상태나 제어 버튼을 표시하지 않는다.

## 후속 작업

현재 구현은 기반 시설만 포함한다. Character Layer 및 실제 대화 출력과의 결합, 모델 품질 평가, 다운로드 동의 UI는 별도 승인 후 진행한다.
