# Re:Station 통합 작업 보드

## 상태 정의

| 상태 | 의미 |
|---|---|
| TODO | 착수 전 |
| DOING | 수행 중 |
| REVIEW | 구현 완료 후 검증 중 |
| BLOCKED | 외부 조건으로 진행 불가 |
| DONE | 완료 조건과 검증 충족 |
| DEFERRED | MVP 이후로 연기 |
| PROPOSED | 논의 중이며 범위와 완료 조건 승인 전 |

## 전체 일정 요약

1인 숙련 개발자 기준이며 캐릭터 일러스트와 최종 대사 원고 제작 시간은 제외한다.
단계별 예상은 각 작업의 개별 견적을 합산한 값이며, 완료 작업의 실제 소요 시간은 별도로 집계하지 않는다.

| 단계 | 목표 | 예상 |
|---|---|---:|
| 0 | 방향성과 기술 계약 확정 | 완료 |
| 1 | 한국어 및 브랜드 기준선 정리 | 완료 |
| 2 | 데이터 모델과 추천 계약 통합 | 완료 |
| 3 | 애플리케이션 로직 분리 | 완료 |
| 4 | 카루아 규칙 기반 MVP 완성, 입력 경로 기반 대사 트리거, 시에스타 이벤트 | RST-401/RST-402/RST-404/RST-405/RST-407/RST-408 완료 |
| 5 | 추천 UX와 화면 개편 | 4~7일, RST-501/RST-503 완료 |
| 6 | WebLLM 의미 보조 계층 | RST-601/Phase 12 기반 완료, Phase 13 활용 보류 결정에 따라 RST-602~606·Phase 14 연기 |
| 7 | 테스트와 성능 개선 | RST-701/RST-702 완료 |
| 전체 합계 | WebLLM 작업을 포함한 과거 원계획 | **51~79일** |
| 남은 합계 | 승인된 MVP 범위 기준 잔여 계획 | **0일** |
| 논의 후보 | MVP 이후 PROPOSED/DEFERRED 범위 | 별도 승인 후 산정 |

## 상위 프로그램

### RST-000: Re:Station 전면 리팩토링

| 항목 | 내용 |
|---|---|
| 상태 | DONE (WebLLM 및 운영 확장은 별도 PROPOSED/DEFERRED) |
| 목적 | 기존 추천 프로토타입을 카루아 중심 대화형 추천 MVP로 전면 개편 |
| MVP 범위 | 단일 데이터 계약, 추천 근거 구조화, 입력 경로 기반 대사 트리거, `App.tsx` 분리, 캐릭터·이벤트 계층, 추천 UX, 테스트와 성능 |
| 후속 범위 | WebLLM 표현 계층, JSON 중심 대화 계약 확장, 관리자 검증 큐, IBA 우선 검색 파이프라인 |
| 핵심 경계 | 이름·별칭 검색 우선, 추천 결정은 DB와 규칙 엔진 담당, 대사 소재는 입력 경로가 결정, WebLLM은 표현만 담당, 시에스타는 저빈도 만담 이벤트 |
| 완료 조건 | 충족. 단계 1~7의 WebLLM 제외 MVP 작업 완료, `PROJECT_VISION.md`의 MVP 성공 기준 통과, RST-411 기능 경계 보완 및 RST-412 문서 정합성 정리 완료 |
| 남은 결정 | WebLLM RST-602~606 재개 여부 |

## 완료 작업

| 작업 ID | 작업명 | 상태 | 완료 조건 |
|---|---|---|---|---|
| BASE-001 | 추천 후보군 안정화 | DONE | 후보군 진행 버그 해결 |
| BASE-002 | 도감 영구 저장 | DONE | 새로고침 후 해제 상태 유지 |
| BASE-003 | 린트 오류 해결 | DONE | 린트 통과 |
| BASE-004 | 표정 상태 연결 | DONE | 대화 상태에 따른 표정 변경 |
| PLAN-001 | Re:Station 카루아 MVP 계약 확정 | DONE | 비전, 범위, 역할 분리, WebLLM 방향 문서화 |
| PLAN-002 | 시에스타·카루아 대화 설계 계약 정리 | DONE | 발화 알고리즘, 금지 패턴, 관계성, 검수 기준 문서화 |
| PLAN-003 | 검색 우선순위 및 WebLLM 체감 속도 계약 | DONE | 이름 검색 우선, 규칙 첫 반응, 스트리밍, 캐시, 시간 예산 문서화 |
| PLAN-004 | 시에스타 만담 이벤트 계약 | DONE | 저빈도 이벤트 역할, 발생 금지 구간, 대화권 반환 원칙 확정 |
| PLAN-005 | 시에스타 난입 및 업무 복귀 장면 문법 | DONE | 난입-만담-업무 복귀-쿨다운 상태 흐름 확정 |
| DOC-001 | 전면 리팩토링 계획 및 문서 상태 동기화 | DONE | 상위 프로그램, 완료 작업, 일정, 테스트 수, 구조 위험, 폐기 ID 정리 |
| DOC-003 | 외부 구조 보고서와 작성 가이드 | DONE | `EXTERNAL_STRUCTURE_REPORT.md` 작성 이력과 `EXTERNAL_STRUCTURE_REPORT_GUIDE.md` 갱신 기준을 기록하고, `README.md`에서 필독 파일과 선택적 수정·검토 파일을 구분 |
| RST-101 | 한국어 문자열 손상 조사 | DONE | 전수 조사 결과 손상 없음 확인 |
| RST-102 | Re:Station 브랜드 교체 | DONE | 사용자 표시 문구와 저장 키 마이그레이션 완료 |
| RST-201 | 칵테일 단일 데이터 모델 설계 | DONE | 단일 `CocktailData` 계약 적용 |
| RST-202 | 데이터 마이그레이션 및 검색 통합 | DONE | 추천, 검색, 카드, 도감이 단일 모델 사용 |
| RST-301 | `App.tsx` 전용 훅 분리 | DONE | `App.tsx`는 화면 조정만 담당 |
| RST-302 | 타이머, 로딩, 오류 상태 통합 | DONE | 퇴장과 초기화 후 지연 응답 없음, 상태 표현 일관성 확보 |
| RST-401 | 카루아 규칙 응답 엔진 | DONE | WebLLM 없이 카루아 규칙 기반 대화 흐름 제공 |
| RST-404 | 상세 카루아 계약 적합성 감사 | DONE | 대표 상황 평가 세트 통과, 실패 대사와 안전 경계 보강 |
| RST-406 | 자연스러운 런타임 응대 적용 | DONE | 캐릭터 말투와 기계적·콜센터식 표현 미적용, 자연스러운 존댓말, 프롬프트·예문 보존 |
| RST-402 | 추천 상태 기반 적응형 JSON 질문 | DONE | 일반적으로 2~3개 질문, 단일 후보만 조기 종료, 정확 일치 실패 후 추가 조건 수집, 자유 입력과 번호 답변 지원 |
| RST-501 | 선택 질문 버튼과 선택 필터 | DONE | JSON 선택지, 자유 입력, 잘 모르겠어요, 맡기기 즉시 추천, 추천 질문 취소 연결 |
| RST-503 | Re:Station 시각 개편과 모바일 접근성 | DONE | 기존 따뜻한 분위기 유지 + 보라 언더톤/네온으로 신비로움 추가. 모바일 핵심 흐름 완료, 키보드와 포커스 사용 가능 |
| DATA-001 | IBA 공식 레시피 기반 클래식 확장 | DONE | 클래식 10종 추가, 공식 출처·분류 기록, 추천·검색·도감 단일 컬렉션 반영 |
| DATA-002 | 추천 후보군 25종 확장 | DONE | IBA 클래식 8종 추가, 총 25종 확보, 짧은 베이스명 부분 일치 오탐 수정 |
| DATA-003 | 전체 선택 조합 결과 보장 | DONE | IBA 클래식 6종 추가, 총 31종 확보, 현재 120개 전체 선택 조합에 정확 또는 같은 베이스 최근접 결과 제공 |
| DATA-004 | 칵테일 DB 문체·표기 통일 | DONE | 한국어·ml 중심 레시피, 수량 없는 재료 목록, 한 문장 중립 설명문과 DB 우선 표시 계약 적용 |
| RST-502 | 추천 카드 계약 적용 | DONE | 카드에는 기존 상세 정보와 중립 설명을 표시하고 카루아식 추천 멘트와 추천 이유는 대화창에 표시 |
| RST-702 | 데이터 지연 로딩과 번들 최적화 | DONE | 레시피/BGM 부가 패널을 lazy chunk로 분리하고 빌드 크기와 검증 결과 기록 |
| RST-407 | 입력 경로 기반 대사 트리거 | DONE | 추천 결정에 `route`·`routeTags`·`dialogueState`·`affectState`를 저장하고, 직접 주문·감정/무드·취향·재료/베이스·랜덤 경로별 추천 문구와 표정 매핑, 최근 대사 라인 제외를 적용 |
| RST-701 | 단위 및 흐름 테스트 | DONE | Vitest 74개, 추천 UI 렌더링 계약, 클릭 흐름, 모바일 배치, 무알코올, 제외 재료, 후보 소진 리셋 수동 검증 완료 |
| RST-405 | 시에스타 만담 이벤트 엔진 | DONE | 세션당 최대 2회, 6턴 쿨다운, 추천 진행 중·안전·퇴장·초기화 비방해, 일반 대화 3턴 후 시에스타-카루아-시에스타 시퀀스 수동 검증 완료 |
| RST-408 | 입력 경로별 대사 풀 확장 | DONE | `routeTags`·`dialogueState`·`affectState` 조건 기반 추천 첫 문장 선택, 도수·제외 재료·피곤/걱정/축하·직접 주문 문구 우선순위, 최근 라인 제외 회귀 테스트 완료 |
| RST-409 | 시에스타 대사 풀 확장 및 다양성 개선 | DONE | 4개→7개 브랜치, 12개→22개 대사 세트, 키 기반 중복 방지, `celebration`/`sweet`/`sad` 브랜치 추가. Vitest 97개 통과 |
| RST-410 | MVP 마감 검수 및 안전 응답 개선 | DONE | MV 성공 기준 8개 항목 검수 완료, `safety` 경로 조기 반환 추가, 위기 상담 번호 안내 구현 |
| RST-411 | 기능 검수 및 안전·직접 주문 경계 보완 | DONE | 안전 응답 본문 상수화와 119/112/1393 안내, `DialogueTurn.responseGoal` intent 매핑 수정, 추천 질문 중 직접 칵테일 주문 시 설문 상태 종료. Vitest 110개 통과 |
| RST-412 | mission_control 문서 정합성 정리 | DONE | 현재 테스트 수 110개, 메인 JS 321.75 kB, RST-411 이후 다음 작업 후보와 검증 기준을 현재 문서에 반영 |
| RST-413 | RST-000 상위 프로그램 상태 정리 | DONE | RST-000을 MVP 범위 DONE으로 전환하고, WebLLM·데이터 운영·JSON 계약 확장은 MVP 이후 PROPOSED/DEFERRED로 분리 |
| DLG-801 | JSON 중심 `DialogueTurn` 계약과 대화 템플릿 계층 | DONE | `DialogueTurn` 런타임 스키마 검증 강화, 기본 복구 템플릿 적용, 안전·퇴장·취소·미등록 칵테일 상태 변경 전 계약 검증. Vitest 113개 통과 |
| DATA-801 | 관리자 검증 큐와 미확정 칵테일 처리 | DONE | unknown/signature/conflict 큐 항목, open/approved/rejected/archived 상태, 승인 기준, 승격 준비 후보, 승인 전 추천 금지 경계 구현. Vitest 118개 통과 |
| DATA-802 | IBA 우선 검색과 레시피 기반 설명 보강 파이프라인 | DONE | IBA 공식 후보는 정식 레코드로 정규화하고, 비공식 시그니처·정보 부족·출처 충돌 후보는 관리자 검증 큐로 이관. Vitest 123개 통과 |

## 단계 1: 한국어 및 브랜드 기준선 정리

### RST-101: 한국어 문자열 손상 조사

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1일 (조사만) |
| 목적 | UI, 키워드, 대화, 데이터 문자열의 인코딩 손상 여부 확인 |
| 완료 조건 | 전수 조사 완료, 손상 여부 기록 |
| 조사 결과 | **손상 없음.** 38개 소스 파일 전수 확인, 모든 한국어 UTF-8 정상. 기존 "손상" 의심은 PowerShell 디코딩 표시 문제였음 |
| 수정 금지 범위 | 확인되지 않은 칵테일 사실을 추측으로 추가 |

### RST-102: BarBot에서 Re:Station으로 브랜드 교체

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1일 |
| 목적 | 제품 표시 이름과 카루아 초기 환영 메시지를 MVP 방향에 맞춤 |
| 완료 조건 | 화면, 문서 제목, HTML 제목, 사용자 표시 문구에서 BarBot 제거 |
| 변경 파일 | `index.html`, `App.tsx`, `Sidebar.tsx`, `index.css`, `persona.ts`, `guest-session-store.ts`, `cocktail-unlocks.ts` |

## 단계 2: 데이터 모델과 추천 계약 통합

### RST-201: 칵테일 단일 데이터 모델 설계

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 |
| 목적 | `Cocktail`과 `CocktailRecord`를 대체할 단일 계약 정의 |
| 필수 필드 | 이름, 설명, 재료, 맛 프로필, 향, 도수감, 무알코올 여부, 기분 태그, 상황 태그 |
| 완료 조건 | 타입, 데이터 검증 기준, 추천과 UI 사용 계약 확정 |

### RST-202: 데이터 마이그레이션 및 검색 통합

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 3~5일 |
| 목적 | 이중 데이터와 변환 계층 제거, 중복 검색 통합 |
| 완료 조건 | 추천, 검색, 카드, 레시피가 단일 모델 사용 |

### RST-203: 추천 입력과 근거 모델 확장

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 |
| 목적 | 기분, 상황, 맛, 무알코올, 제외 재료, 질문 이력과 추천 이유를 구조화 |
| 완료 조건 | JSON 질문과 규칙 기반 자유 입력 해석이 함께 사용할 추천 상태 및 데이터 기반 근거 객체 반환 |
| 변경 파일 | `types/recommendation.ts`, `lib/recommendation/state.ts`, `state.test.ts`, `useRecommendationSession.ts` |

## 단계 3: 애플리케이션 로직 분리

### RST-301: `App.tsx` 전용 훅 분리

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 3~4일 |
| 대상 | 대화, 추천, 도감, 장면 상태 |
| 완료 조건 | `App.tsx`는 화면 조정만 담당 |
| 변경 파일 | `App.tsx`, `useRestationController.ts`, `useRecommendationSession.ts` |

### RST-302: 타이머, 로딩, 오류 상태 통합

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1~2일 |
| 완료 조건 | 퇴장과 초기화 후 지연 응답 없음, 상태 표현 일관성 확보 |
| 변경 파일 | `useRestationController.ts`, `timer-registry.ts`, `timer-registry.test.ts`, `App.tsx` |

## 단계 4: 카루아 규칙 기반 MVP

### RST-401: 카루아 캐릭터 계약과 규칙 응답 엔진

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 3~4일 |
| 목적 | WebLLM 없이도 카루아다운 전체 대화 흐름 제공 |
| 완료 조건 | 반존대, 짧은 응답, 농담 중심 환기, 상담 방지 규칙 검증 |
| 변경 파일 | `keywords.ts`, `conversation.ts`, `recommendation/question-engine.ts`, `App.tsx` |

### RST-404: 상세 캐릭터 계약 적합성 감사 및 보강

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~4일 |
| 목적 | 완료된 RST-401 대사를 상세 카루아 설계 계약 기준으로 재검수하고 흔들리는 대사를 보강 |
| 기준 문서 | `CHARACTER_DESIGN.md` |
| 범위 | 농담 우선, 반존대, 의미 비해설, 안전 확인, 설교 및 직접 위로 금지 |
| 완료 조건 | 대표 상황 평가 세트 통과, 실패 대사 수정, 금지 패턴 검사 기록 |
| 감사 결과 | 직접 위로·정답형 감정 대사 수정, 강한 음주 요청 완화, 안전 의도 최우선 처리, 캐릭터 계약 회귀 테스트 추가 |

### RST-405: 시에스타 만담 이벤트 엔진

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 3~5일 |
| 목적 | 카루아 중심 흐름을 유지하면서 시에스타가 잠깐 등장하는 관계 만담 제공 |
| 범위 | 이벤트 발생 조건, 쿨다운, 예고 없는 난입, 카루아/손님 대상 선택, 2~4발화 시퀀스, 업무 복귀 퇴장, 카루아에게 대화권 반환 |
| 금지 | 추천 질문, 안전 확인, 퇴장, 초기화 중 이벤트 발생 |
| 완료 조건 | 이벤트 빈도 제한, 모든 이벤트가 난입-만담-업무복귀 구조 충족, 핵심 흐름 비방해, 두 캐릭터 말투 구분, 규칙 엔진 복구 가능 |
| 진행 | 순수 이벤트 엔진과 쿨다운/세션 빈도 제한을 추가하고, `useRestationController`에서 본 답변 뒤 만담 시퀀스를 예약한다. 추천 진행 중·안전·퇴장·추천 취소에서는 이벤트가 발생하지 않으며, 추천 완료 직후에는 짧은 축하 만담을 허용한다. |
| 검증 | `npm.cmd run check`, `npm.cmd test` 80개, `npm.cmd run lint`, `npm.cmd run build` 통과. Chrome DevTools Protocol 수동 검증으로 일반 대화 3턴 후 시에스타 2회·카루아 1회·업무복귀 발화 표시, 추천 질문·안전·추천 취소·퇴장·초기화 구간 비발생 확인. |
| 변경 파일 | `src/lib/banter/siesta-event.ts`, `src/lib/banter/siesta-event.test.ts`, `src/hooks/useRestationController.ts`, `src/components/bar/DialogueBox.tsx`, `src/components/bar/recommendation-ui.test.tsx` |

### RST-407: 입력 경로 기반 대사 트리거

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 |
| 목적 | 칵테일 ID가 아니라 사용자가 추천 결과에 도달한 입력 경로를 기준으로 대화 소재와 대사 풀을 선택한다. |
| 범위 | `directCocktailOrder`, `anecdoteOrPersonOrder`, `moodOrder`, `tastePreferenceOrder`, `ingredientOrBaseOrder`, `recommendationInference`, `randomPick` 같은 경로 태그 정의, 추천 결정에 경로 맥락 저장, FSM 상태별 대사 풀·말투·발화 리듬·애니메이션 클립 분리, 감정 상태별 표정 스프라이트 매핑, 최근 N개 대사 제외, 템플릿 변수 치환 |
| 기존 구조와 결합 | 추천 엔진은 기존처럼 칵테일과 근거를 확정한다. 대사 트리거 계층은 확정된 `RecommendationDecision`과 입력 경로 태그를 받아 대사 풀만 선택하며 추천 결과를 변경하지 않는다. |
| 구현 후보 | MVP에서는 TypeScript 규칙 엔진과 작은 대사 풀로 구현하고, 대사량이 늘어나면 Ink 스크립트의 `shuffle`/`cycle` 및 템플릿 변수 치환으로 이전한다. |
| 완료 조건 | 같은 칵테일이라도 직접 주문, 취향 추론, 재료·베이스 언급, 감정·무드 주문에서 서로 다른 대사 풀을 사용한다. `route`는 대화 소재를, `dialogueState`는 말투·리듬·애니메이션을, `affectState`는 표정 스프라이트와 세부 어조를 결정한다. 최근 사용 대사는 제외되며, WebLLM 없이도 기본 대사 풀과 기본 스프라이트로 핵심 흐름이 완료된다. |
| 변경 파일 | `src/types/recommendation.ts`, `src/lib/recommendation/state.ts`, `src/lib/recommendation/response.ts`, `src/hooks/useRecommendationSession.ts`, `src/lib/recommendation/state.test.ts`, `src/lib/recommendation/response.test.ts` |

### RST-408: 입력 경로별 대사 풀 확장

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1~2일 |
| 목적 | RST-407의 입력 경로·태그·상태 계약을 실제 대사 선택 우선순위에 더 넓게 반영 |
| 범위 | 감정 상태별 무드 대사, 도수·선택 답변·제외 재료·선호 재료 태그 대사, 직접 주문 serving 대사, 맡기기/추론 대사, 최근 라인 제외 |
| 완료 조건 | 같은 route 안에서도 `routeTags`, `dialogueState`, `affectState`가 더 구체적인 문구를 우선 선택하고, 최근 사용 라인은 다음 후보로 넘어간다. 제외 재료만 있는 요청도 재료/베이스 경로로 분류된다. |
| 검증 | `npm.cmd test` 85개, `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build` 통과 |
| 변경 파일 | `src/lib/recommendation/response.ts`, `src/lib/recommendation/response.test.ts`, `src/lib/recommendation/state.ts`, `src/lib/recommendation/state.test.ts` |

### RST-402: 기분, 상황, 취향 추출 및 추가 질문

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 |
| 범위 | 맛과 풍미·도수·탄산·베이스 4축 JSON 질문을 사용하고, 맛 질문을 우선하되 현재 추천 상태에 따라 다음 질문을 선택 |
| 완료 조건 | 직전 답변 반응, 질문 반복 방지, 자유 입력과 선택 답변 지원, 일반적으로 2~3문항 진행, 실제 후보 1개 또는 맡기기만 조기 종료, 정확 일치 실패 시 남은 조건 추가 수집, 각 질문에서 모든 칵테일이 최소 한 일반 선택지에 대응하고 모든 일반 선택지가 실제 후보를 가짐 |
| 변경 파일 | `src/data/recommendation-questions.json`, `src/lib/recommendation/question-engine.ts`, `src/lib/recommendation/question-engine.test.ts`, `src/lib/recommendation/state.ts`, `src/hooks/useRecommendationSession.ts`, `src/types/recommendation.ts` |

### RST-403: 다시 추천받기와 추천 제외 처리

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1~2일 |
| 완료 조건 | 이전 결과를 가능한 범위에서 제외하고 재추천 |
| 변경 파일 | `src/hooks/useRecommendationSession.ts`, `src/hooks/useRestationController.ts`, `src/App.tsx`, `src/components/bar/CocktailCard.tsx`, `src/lib/recommendation/question-engine.ts`, `mission_control/*` |

## 단계 5: 추천 UX와 화면 개편

### RST-501: 선택 질문 버튼과 선택 필터

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 |
| 범위 | JSON 질문 선택지 버튼, 자유 입력, 잘 모르겠어요, 설문 중 카루아에게 맡기기·아무거나 즉시 추천, 설문 밖 아무거나 랜덤 추천, 추천 질문 취소, 대사 내 반복 조작 안내 제거 |
| 변경 파일 | `src/App.tsx`, `src/components/bar/ChatInput.tsx`, `src/hooks/useRecommendationSession.ts`, `src/hooks/useRestationController.ts`, `src/index.css`, `src/lib/recommendation/question-engine.ts` |

### RST-502: 추천 카드 계약 적용

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 1~2일 |
| 카드 표시 | 이름, 이미지, 분위기 요약, DB 기반 중립 설명, 베이스, 재료, 잔, 분류, 맛 프로필 |
| 대화 표시 | 구조화 추천 이유를 반영한 카루아식 추천 멘트 |

### RST-503: Re:Station 시각 개편과 모바일 접근성

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 (실제: 1일) |
| 방향 | 기존 다크브라운/골드 "따뜻한 바" 분위기 유지. 그림자와 그라데이션 끝에 미묘한 보라 언더톤 추가. 드라마틱한 명암비와 은은한 네온 포인트로 신비로움을 더함. Karua 스프라이트 라이팅 조정. 결정 ID: DEC-014 |
| 완료 조건 | 모바일 핵심 흐름 완료, 키보드와 포커스 사용 가능. 기존 따뜻한 분위기 유지 + 신비로운 느낌 추가 확인 |
| 변경 파일 | `src/index.css`, `App.tsx`, `components/entrance/BarExterior.tsx`, `components/bar/BarInterior.tsx`, `components/bar/CocktailCard.tsx`, `components/bar/ChatInput.tsx`, `components/bar/DialogueBox.tsx`, `mission_control/` 관련 문서 일괄 갱신 |

## 단계 6: WebLLM 의미 보조 계층 (실험 기반 재개)

DEC-027에 따라 WebLLM은 구조화 의미 분석만 담당한다. JSON·DB·규칙 로직이 최종 대사를 만들며, WebLLM은 허용 목록 안의 topic·stance·응답 블록 후보·세션 태그·rapport 힌트만 제안한다. 상태·추천 판단과 실제 대사 생성 책임은 포함하지 않는다.

### RST-601: WebLLM Worker 기반 구축

| 항목 | 내용 |
|---|---|
| 상태 | DONE (Phase 12 승인 범위) |
| 예상 | 3~4일 |
| 구현 결과 | `@mlc-ai/web-llm` Web Worker, capability 검사, 싱글턴 준비, 기능 플래그, 동적 import, 수동 unload 기반을 추가했다. 실제 대화 출력은 미연결 |
| 완료 조건 | 충족. capability 검사·중복 준비 방지·비차단 Worker·기본 OFF·실패 시 세션 비활성화와 JSON/FSM 복구를 계약 테스트와 Phase 12 실측으로 확인 |
| 후속 경계 | 지원 GPU에서의 모델 다운로드·warm 재사용·속도 비교는 RST-602이며 현재 DEFERRED |

### RST-602: Qwen 및 Gemma 후보 실행 검증

| 항목 | 내용 |
|---|---|
| 상태 | DEFERRED |
| 예상 | 2~4일 |
| 완료 조건 | 실제 WebLLM 지원 모델, 다운로드 크기, 메모리, 속도 기록 |

### RST-603: 카루아 한국어 평가 세트와 모델 선정

| 항목 | 내용 |
|---|---|
| 상태 | DEFERRED |
| 예상 | 3~5일 |
| 평가 | `CHARACTER_DESIGN.md` 기반 한국어 자연스러움, 반존대, 농담 우선, 의미 비해설, 안전 경계, 짧은 응답, 추천 불변 |
| 완료 조건 | 후보별 결과와 최종 기본 모델 결정 기록 |

### RST-604: WebLLM 대화 및 추천 설명 연결

| 항목 | 내용 |
|---|---|
| 상태 | DEFERRED |
| 예상 | 2~3일 |
| 완료 조건 | JSON·규칙 로직이 확정한 원본 답안의 말투만 변환하며 의미·사실·추천 상태를 변경하지 않음 |

### RST-605: 모델 다운로드 UI와 복구 경로

| 항목 | 내용 |
|---|---|
| 상태 | DEFERRED |
| 예상 | 2~3일 |
| 완료 조건 | 진행률, 취소, WebGPU 미지원, 오류, 규칙 응답 복구 처리 |

### RST-606: WebLLM 체감 지연 최소화

| 항목 | 내용 |
|---|---|
| 상태 | DEFERRED |
| 예상 | 3~5일 |
| 목적 | 실제 생성 시간이 남아 있어도 사용자가 기다린다고 느끼는 시간을 최소화 |
| 구현 | 즉시 규칙 첫 반응, Worker 스트리밍, 추천 카드 선표시, 세션 모델/KV 캐시 유지, 짧은 출력 제한, 시간 예산 및 취소 |
| 측정 | 첫 시각 반응, 첫 토큰, 전체 생성 시간, 토큰/초, 취소 및 복구 비율 |
| 완료 조건 | 첫 시각 반응 100ms 이내, 준비된 모델 첫 토큰 800ms 이내 목표, 시간 초과 시 규칙 응답으로 즉시 복구 |

## 단계 7: 테스트와 성능

### RST-701: 단위 및 흐름 테스트

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 4~6일 |
| 범위 | 추천, 검색, 저장, 재추천, 무알코올, 제외 재료. WebLLM 복구 테스트는 재개 시 추가 |
| 진행 | 공통 입력 라우터 충돌 테스트, localStorage 차단·손상 데이터·이전 키 마이그레이션 저장 경계 테스트 완료. 활성 추천 중 텍스트 취소 경로와 안전 우선순위 회귀 테스트를 추가했다. 재추천 후보군에서 이미 추천한 칵테일 ID를 제외하고 전체 소진 시 리셋 신호를 주는 순수 경계를 분리해 테스트했다. 추천 카드, 다시 추천받기 버튼, 선택지, 잘 모르겠어요, 추천 질문 취소, 비활성 처리 렌더링 계약 테스트를 추가했다. alcohol preference(high/low/medium) 추출, 빈 신호, 도수 필터, 복합 신호 추천 이유, answerLatestQuestion, isRecommendationIntent, pickFromPool, formatQuestion null acknowledgement, selectRecommendationOpening fallback 등 엣지 케이스 순수 함수 테스트를 추가했다. 제외 재료가 재료 목록뿐 아니라 `base_spirit`에도 적용되도록 보강했다. 브라우저 수동 검증으로 선택지 클릭, 잘 모르겠어요, 추천 취소, 추천 카드, 다시 추천받기, 퇴장, 모바일 줄바꿈/스크롤, 무알코올 오류, 제외 재료, 모든 후보 소진 리셋 안내를 확인했다. Vitest 74개 통과 |

### RST-702: 데이터 지연 로딩과 번들 최적화

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 예상 | 2~3일 (실제: 0.5일) |
| 완료 조건 | 현재 번들 데이터와 부가 패널의 로딩 비용을 측정하고 필요한 항목만 지연 로딩하며 초기 번들 경고를 해결하거나 유지 근거 기록 |
| 결과 | `RecipeInfoTab`과 `BarMusicTab`을 `React.lazy` 기반 별도 chunk로 분리했다. 빌드 결과 메인 JS는 306.04 kB에서 302.22 kB로 감소했고, `RecipeInfoTab` 3.32 kB, `BarMusicTab` 2.28 kB chunk가 생성됐다. 칵테일 DB 31.57 kB와 추천 질문 JSON 5.71 kB는 초기 추천 흐름에 필요하므로 유지한다. |

## MVP 이후 연기

| 작업 | 상태 |
|---|---|
| DLG-801 JSON 중심 `DialogueTurn` 계약과 대화 템플릿 계층 | DONE |
| DATA-801 관리자 검증 큐와 미확정 칵테일 처리 | DONE |
| DATA-802 IBA 우선 검색과 레시피 기반 설명 보강 파이프라인 | DONE |
| RST-414 추천 의도 라우팅과 시에스타 만담 구조 보강 | DONE |
| DLG-802 추천 질문 DialogueFlow JSON 계약 | DONE |
| DLG-803 Re:Station 기본 설정과 예외상황 응답 보강 | DONE |
| WLC-001 1회성 웰컴드링크 버튼과 환영 추천 흐름 | DONE |
| RST-415 평문 재료 요청 추천 제약 보정 | DONE |
| RST-416 감정 상태와 대사 바리에이션 런타임 연결 보강 | DONE |
| DLG-804 일반 대화 입력 연결성 보정 | DONE |
| DLG-805 추천 질문과 추천 응답 문단 프리셋 전환 | DONE |
| DLG-806 키워드 규칙 JSON 분리와 persona 보존 | DONE |
| DLG-807 카루아 말투 계약 재검수 및 금지 패턴 대사 정리 | DONE |
| DLG-808 `dialogues.json` 카테고리 대사 풀 정상화 및 문단 프리셋 이관 | DONE (Phase 11 범위) |
| DLG-809 화자·상태·요청별 문단 프리셋 계약 확장 | DONE (Phase 11 범위) |
| SPR-001 캐릭터 스프라이트 슬롯 계약 | DONE |
| SPR-002 카루아 표정 PNG 제작·연결 | DONE |
| SPR-003 카루아 Sprite Animation | PROPOSED |
| SPR-004 시에스타 Sprite 표시 | PROPOSED |
| SPR-005 시에스타 Event Sync | PROPOSED |
| AUD-001 Audio SFX·Cue·UX 최종 QA | REVIEW |
| FLOW-001 환상주점 세션 흐름 사양 | DONE |
| FLOW-002 XYZ와 Farewell Phase 상태 머신 설계 | DONE |
| FLOW-003 선택지 이벤트와 자유입력 복귀 정책 구현 | PROPOSED |
| 시에스타 상시 대화 및 캐릭터 선택 | DEFERRED |
| 시에스타 추천 설명 | DEFERRED |
| 복잡한 웰컴드링크 랜덤 이벤트와 별도 연출 | DEFERRED |
| Restination 서사 전개 | DEFERRED |
| 바텐더 시뮬레이터와 타이쿤 | DEFERRED |
| 제휴 바 기능 고도화 | DEFERRED |

### 제안 작업 상세

#### DLG-804: 일반 대화 입력 연결성 보정

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 이전 대화에서 언급한 칵테일이나 오래된 컨텍스트가 현재 사용자 입력을 덮어써 응답이 어색하게 이어지는 문제를 줄임 |
| 구현 결과 | 현재 입력에 칵테일명이 직접 포함될 때만 칵테일 언급 응답을 우선한다. fallback 응답 생성 시 현재 사용자 입력을 포함한 메시지 배열을 전달해 방금 입력과 답변이 이어지게 했다. |
| 검증 | `engine.test.ts`에 이전 칵테일 언급이 현재 피곤 입력을 덮어쓰지 않는 회귀 테스트를 추가했다. 최종 Vitest 154개, lint, build 통과 |

#### DLG-805: 추천 질문과 추천 응답 문단 프리셋 전환

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | JSON에 완성 대사를 계속 누적하지 않고, 프리셋과 슬롯을 조합해 질문·추천 대사를 관리 |
| 구현 결과 | `text-presets.ts`에 문장 프리셋과 문단 프리셋을 추가했다. 추천 질문 JSON은 `promptPreset`, `leadInPreset`, `continuationPreset`, `acknowledgementPreset`을 참조한다. 정확 매칭 추천 응답은 `[reaction] + [recommend] + [explanation]` 3블록 구조로 렌더링한다. |
| 현재 범위 | `karua`와 `siesta`의 `recommend + tired + light` 예시와 기본 추천 프리셋만 우선 구현했다. 전체 intent와 전체 대사 풀 이관은 DLG-808/DLG-809로 분리한다. |
| 검증 | `question-engine.test.ts`, `response.test.ts`, 최종 Vitest 154개, lint, build 통과 |

#### DLG-806: 키워드 규칙 JSON 분리와 persona 보존

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | `keywords.ts`에 직접 들어 있던 키워드 규칙과 폴백 대사를 JSON 데이터로 분리하되, 사용자가 직접 다듬은 `persona.ts`는 보존 |
| 구현 결과 | `src/data/keyword-rules.json`을 추가하고 `keywords.ts`는 JSON을 읽어 `KeywordRule[]`로 컴파일한다. `patterns`, `expression`, `response`, `dialogueCategory` 구조를 사용한다. `dialogueCategory`가 있으면 기존 `dialogues.json` 대사 풀이 우선이고 `response`는 폴백이다. |
| 주의 | `persona.ts`를 JSON 어댑터로 바꾸는 시도는 취소했다. 말투 계약은 현재 `persona.ts`의 상수 문자열을 기준으로 한다. |
| 검증 | 최종 Vitest 154개, lint, build 통과 |

#### DLG-807: 카루아 말투 계약 재검수 및 금지 패턴 대사 정리

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | `CONVERGENCE_PRINCIPLES.md`와 현재 `persona.ts`를 기준으로 실제 런타임 대사들이 상담가식 문장, 직접 위로, 과한 공손함으로 흐르지 않는지 재검수 |
| 범위 | `dialogues.json`, `conversation.ts`, 추천 질문 프리셋, 추천 응답 문단 프리셋, 안전·예외상황 문구 |
| 완료 조건 | 금지 문장 패턴 목록을 코드/테스트 또는 문서 기준으로 정리하고, 대표 입력 세트에서 카루아 말투와 안전 경계가 동시에 유지됨. 새 대사는 "관찰에서 출발하는가", "상담원도 할 수 있는 말인가" 검수 질문을 통과해야 한다. |
| 주의 | persona 자체를 JSON으로 옮기지 않는다. 사용자가 말투를 다시 손보기 전까지는 현재 `persona.ts`와 `CONVERGENCE_PRINCIPLES.md`를 기준 파일로 둔다. |
| 완료 결과 | `persona.ts`를 직접 참조하는 `CharacterStyleProfile`과 설정형 금지/권장 패턴, 문장 수·반존대·능청·추천 어조 검증기를 추가했다. `assembleResponse` 뒤에서 문구·표정은 보존하고 Character 메타데이터를 생성한다. 전체 대사 525개 문자열을 감사해 금지 패턴 위반 3건을 수정하고 회귀 테스트를 보강했다. |

#### DLG-808: `dialogues.json` 카테고리 대사 풀 정상화 및 문단 프리셋 이관

| 항목 | 내용 |
|---|---|
| 상태 | DONE (Phase 11 범위) |
| 목적 | 기존 카테고리형 대사 풀을 점검하고, 필요한 항목은 문장 단위가 아니라 문단 블록 또는 카테고리별 프리셋 구조로 정리 |
| 범위 | `greeting`, `mood-tired`, `mood-sad`, `mood-happy`, `cocktail-request`, `taste-*`, `rude-*`, `real-world-info`, `water-request`, `overdrunk`, `ingredient-constraint` |
| 완료 조건 | 각 카테고리가 최소한의 자연스러운 한국어 라인과 표정 계약을 갖고, 키워드 JSON의 `dialogueCategory`와 누락 없이 연결됨. 대사 출처와 사용 경로를 추적할 수 있어야 한다. |
| 주의 | JSON에는 긴 완성 대사를 무작정 늘리지 않는다. 반복 가능한 반응/추천/설명 블록 또는 짧은 카테고리 응답 풀로 나눈다. 정리 우선순위는 `persona.ts` → `dialogues.json` → `keyword-rules.json` → `text-presets.ts` → `conversation.ts` → `response.ts`다. |
| 완료 결과 | keyword-rule 참조 카테고리는 ResponsePlan 단독 렌더링 가능 상태가 되었고, ResponsePlan-backed JSON fallback-only 카테고리는 삭제했다. `fallback-required` legacy JSON 카테고리는 안전망으로 의도적으로 유지한다. |

#### DLG-809: 화자·상태·요청별 문단 프리셋 계약 확장

| 항목 | 내용 |
|---|---|
| 상태 | DONE (Phase 11 범위) |
| 목적 | 카루아와 시에스타가 같은 의미 상태를 받아도 서로 다른 말투와 문단 구성을 쓰도록 프리셋 계약을 확장 |
| 범위 | `greeting`, `welcome_drink`, `ask_preference`, `recommend`, `explain`, `small_talk`, `joke`, `comfort`, `refusal`, `goodbye` 의도와 `state/request` 조합 |
| 완료 조건 | `speaker + intent + state + request`로 프리셋을 선택하고, 각 프리셋이 `[reaction]`, `[recommend]`, `[explanation]` 또는 intent에 맞는 2~3블록 구조를 명시함. 추천 카드보다 캐릭터 반응이 먼저 보이는 출력 순서를 전제로 한다. |
| 주의 | 칵테일 추천 결과는 여전히 추천 엔진이 결정한다. 프리셋은 말투와 문단 조합만 담당한다. 문장을 조립하지 않고 문단 블록을 조립한다. |
| 완료 결과 | keyword-rule, response-template, story-query, welcome-drink, farewell-replies 경로의 표현 소유권을 ResponsePlan 중심으로 정리하고, ResponsePlan dialogue와 `fallbackText`를 Character QA 범위에 포함했다. Interaction Timeline, Rapport, WebLLM 런타임 통합은 후속 범위로 분리한다. |

#### FLOW-001: 환상주점 세션 흐름 사양

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 추천 로직 이후의 사용자 경험과 세션 종료 구조를 상위 설계 계약으로 추가 |
| 결과 | `SESSION_FLOW_SPEC.md`를 추가하고, `DEC-023`에 닫힌 세션 흐름과 XYZ 종료 장치를 기록했다. |
| 핵심 계약 | 자유입력은 열어 두되 진행은 `입장 → 웰컴드링크 → 대화 → 취향 파악 → 추천 → 주문 → 후일담 → XYZ → 배웅 → 귀가` 흐름으로 복귀한다. |
| 금지 | 무한 챗봇 상태, 호감도 시스템, Happy/Bad/True End, 공략 루트, 연애 루트 |
| 검증 | 문서 작업만 수행했다. 코드 변경 없음 |

#### FLOW-002: XYZ와 Farewell Phase 상태 머신 설계

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 추천 이후 세션을 주문, 후일담, XYZ, Farewell Phase, 귀가로 닫는 상태 머신을 설계 |
| 범위 | `ordered`, `aftertalk`, `xyz`, `farewell`, `returnHome` 같은 세션 단계, XYZ 발동 조건, Farewell Phase 2~3턴 제한, 추가 주문·추천 금지 라우팅 |
| 완료 조건 | XYZ 발동 조건과 상태 전이가 타입/문서/테스트 기준으로 정의되고, XYZ 이후 신규 추천과 신규 주문이 차단되며 레시피·후기·가벼운 잡담은 허용된다. |
| 주의 | XYZ는 벌칙이나 엔딩 분기가 아니라 오늘의 마지막 드링크다. 사용자는 평가받지 않는다. |
| 구현 결과 | `src/lib/session/session-flow.ts`에 세션 단계와 도수 한계 기반 XYZ 마감 서빙 정책을 추가하고 `useRestationController`에 연결했다. 웰컴드링크는 누적 도수 계산에서 제외한다. 일반 주문/추천으로 칵테일을 서브한 뒤 누적 도수 별점이 10 이상에 도달하면 XYZ를 마지막 잔으로 이어서 서빙하고, 그 뒤 Farewell Phase로 이행한다. 이 구간에서는 신규 주문·추천과 다시 추천받기를 차단하되 기존 칵테일 정보 대화는 허용하며, 명시적 퇴장 입력으로 귀가한다. |
| 검증 | `session-flow.test.ts` 기준 서브 이후 도수 한계 XYZ 후속 서빙 테스트 통과 |

#### AUD-001: Audio SFX·Cue·UX 최종 QA

| 항목 | 내용 |
|---|---|
| 상태 | REVIEW |
| 목적 | 이미 구현된 Audio Step 2~4를 전용 회귀와 실제 브라우저 검수로 종료 판정 |
| 구현 확인 | `useSfxManager`의 shake loop·serve one-shot·볼륨·음소거·저장, `useRestationPresentation`의 제조 cue, `useRestationController`의 서빙·초기화·퇴장·오류 중단, `BarMusicTab`의 SFX UI가 연결됨 |
| 자동 검증 | 중복 shake 방지, serve one-shot 정리, volume clamp·저장 복구, mute/stopAll, Audio API reject 시 무중단, reset/exit/safety의 stop 계약을 테스트 |
| 수동 검증 | 실제 Chrome에서 shake 시작/종료, serve 1회, 음소거·볼륨 복원, autoplay/파일 실패 시 대화·서빙 유지, 모바일 음악 탭 조작을 확인 |
| 완료 조건 | 자동·수동 검증 결과를 기록하고 Audio Step 2~4를 DONE으로 전환. 실패가 있으면 이 범위 안에서만 보정 |

#### FLOW-003: 선택지 이벤트와 자유입력 복귀 정책 구현

| 항목 | 내용 |
|---|---|
| 상태 | PROPOSED |
| 목적 | 자유입력은 허용하되 무한 잡담으로 흐르지 않도록 짧은 반응 후 칵테일·추천 대화로 복귀시키고, 중요 정보 수집 구간에서는 선택지 이벤트로 흐름을 통제 |
| 범위 | 자유입력 응답 구조, 선택지 이벤트 목적과 UI, 취향 분류·의도 파악·추천 정확도 향상·흐름 통제, 선택지 중에도 안전 입력 우선 |
| 완료 조건 | 일반 자유입력이 `짧은 반응 → 칵테일 관련 복귀` 구조를 지키고, 선택지 이벤트는 필요한 구간에서만 자유입력을 제한하며 접근성과 취소/우회 경계를 갖는다. |
| 주의 | 선택지는 게임식 공략 선택지가 아니라 추천 정확도와 흐름 통제를 위한 바 대화 장치다. |

#### RST-414: 추천 의도 라우팅과 시에스타 만담 구조 보강

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 자연어 추천 요청을 미등록 칵테일 문의로 오분류하지 않고, 시에스타 만담이 자기 말만 하고 사라지는 이벤트처럼 보이지 않도록 대화권 반환 구조를 보강 |
| 구현 결과 | 알려진 칵테일명 탐지 이후 추천 의도를 미등록 칵테일 추출보다 먼저 판정한다. `다음잔은 추천을 받을래`는 추천 흐름으로 들어간다. 시에스타 이벤트는 `시에스타 → 카루아 → 시에스타 퇴장 → 카루아 대화권 반환` 4발화 구조로 바뀌었다. |
| 만담 개편 방식 | 기존 3발화 구조는 마지막 인상이 시에스타의 퇴장으로 끝나서, 사용자가 보기에는 시에스타가 제 할 말만 하고 사라지는 이벤트처럼 남았다. 모든 브랜치를 4발화로 바꿔 시에스타가 직전 맥락을 짧게 받아치고, 카루아가 농담이나 반응으로 관계성을 보여준 뒤, 시에스타가 업무 복귀를 말하고, 마지막에 카루아가 손님에게 다시 대화권을 돌려준다. |
| 대사 원칙 | 시에스타는 인사나 설명으로 등장하지 않고 직전 대화에 대한 관찰·보충·주의를 짧게 던진다. 카루아는 시에스타를 과하게 해설하거나 존경하지 않고 가볍게 받아친다. 시에스타의 마지막 말은 재고, 잔, 바닥, 주방, 배달 확인 같은 업무 복귀여야 하며, 최종 발화는 카루아가 손님 대화를 이어받아야 한다. |
| 검증 | `npm.cmd test -- siesta-event.test.ts input-router.test.ts --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint` 통과. 현재 Vitest 125개 통과 |

#### SPR-001: 캐릭터 스프라이트 슬롯 계약

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 카루아와 시에스타가 어떤 표정·상태 이미지를 가져야 하는지 코드 계약과 파일명으로 먼저 고정 |
| 구현 결과 | `assets/characters/karua/sprites.ts`가 모든 `Expression`을 `Record<Expression, image>`로 고정한다. 기준 디자인은 현재 런타임의 `static/Kaura.png`이며, `smirk`·`thinking`·`embarrassed`는 전용 PNG를 사용한다. `talk/surprised/sympathy/annoyed/stern`은 `idle`, `disappointed`는 `embarrassed` fallback을 명시한다. 시에스타는 대사 화자 라벨만 있고 화면 스프라이트는 다음 범위다. |
| 카루아 최소 슬롯 | `idle`, `talk`, `thinking`, `smirk`, `sympathy`, `surprised` |
| 시에스타 최소 슬롯 | `idle`, `talk`, `smirk`, `concern`, `exit` |
| 가이드 | 에셋 파일명은 표정 타입과 1:1로 맞춘다. 예: `karua/idle.png`, `karua/talk.png`, `siesta/idle.png`. 코드에서는 문자열 분기 대신 `Record<Expression, image>` 매핑을 사용한다. |
| 순서 의존성 | 반드시 먼저 수행한다. `SPR-002~005`는 모두 이 슬롯명과 fallback 규칙을 참조한다. 실제 그림이 없어도 placeholder나 기존 `character.png` fallback으로 계약을 먼저 고정할 수 있다. |
| 디자인 기준 | 새 카루아 정적 PNG는 `Kaura.png`의 디자인·캔버스 기준을 따른다. `character.png`, `character0.png`는 새 슬롯 기준으로 사용하지 않는다. 시에스타의 키·위치·상대 크기는 `SPR-003`에서 결정한다. |
| 표시 기준 | 데스크톱은 높이 180~360px·최대 폭 80vw/360px, 모바일은 120~240px, 480px 이하는 100~180px으로 고정한다. `object-fit: contain`과 bottom-center 정렬로 표정 전환이 레이아웃을 바꾸지 않는다. |
| 검증 | `sprites.test.ts`가 모든 `Expression`의 이미지와 fallback 슬롯 존재를 확인한다. |
| 완료 조건 | 완료: 타입, fallback 규칙, 모바일/데스크톱 표시 기준을 문서와 코드·테스트에 고정했다. |

#### WLC-001: 1회성 웰컴드링크 버튼과 환영 추천 흐름

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 사용자가 말을 꺼내기 전에도 바다운 첫 상호작용을 시작할 수 있도록, 방문당 1회 제공되는 웰컴드링크 버튼을 추가 |
| 범위 | 하단 `나가기` 옆 버튼, 방문당 1회 상태, 접근성 좋은 클래식 후보 선택, 카루아 환영 대사, 칵테일 카드 표시, 도감 해제, 사용 후 숨김 |
| 구현 결과 | `selectWelcomeDrink`가 도수와 단맛이 과하지 않은 클래식 후보를 고른다. `WelcomeDrinkButton`은 `welcomeDrinkAvailable`일 때만 표시되며, 클릭 시 일반 추천 설문 없이 웰컴드링크 대사와 카드가 표시된다. 이후 `WELCOME_DRINK_FEEDBACK_QUESTION`으로 괜찮았는지 1문항만 확인한다. |
| 경계 | 추천 질문 진행 중, 칵테일 카드 표시 중, 처리/타이핑 중에는 사용할 수 없다. 일반 재추천 제외 목록에는 넣지 않는다. |
| 검증 | `npm.cmd test -- welcome-drink.test.ts recommendation-ui.test.tsx --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` 통과. 현재 Vitest 141개 통과, 메인 JS 336.80 kB |

#### RST-415: 평문 재료 요청 추천 제약 보정

| 항목 | 내용 |
|---|---|
| 목적 | “라임즙만 들어간 걸로” 같은 평문 요청이 단순 산미 취향으로만 처리되어 실제 재료 조건을 놓치는 문제를 방지 |
| 구현 결과 | `extractRecommendationSignals`가 라임즙·라임 주스·레몬즙·민트·소다수 등 일반 재료를 `preferredIngredients`로 추출한다. 라임즙/레몬즙은 주스 재료명으로 정규화하고, 더 구체적인 주스 표현이 있으면 일반 라임/레몬 신호를 중복 적용하지 않는다. |
| 추천 경계 | 기주 선호는 완전일치로만 처리해 `진`이 `진저 비어`에 매칭되지 않게 했다. 일반 재료 선호는 `라임`이 `라임 주스`에 걸리도록 포함 매칭한다. 부재료만 알려진 경우에는 베이스 기주 질문을 계속 물어본다. |
| 품질 보정 | 최종 후보 선택 시 맛 점수가 거의 같으면 재료 수가 적은 칵테일을 우선해 라임 주스 요청에서 다이키리 같은 단순한 클래식이 앞선다. |
| 검증 | `npm.cmd test -- state.test.ts question-engine.test.ts --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` 통과. 현재 Vitest 145개 통과, 메인 JS 337.52 kB |

#### RST-416: 감정 상태와 대사 바리에이션 런타임 연결 보강

| 항목 | 내용 |
|---|---|
| 목적 | 추가된 감정/표정과 대사 바리에이션이 실제 사용자 입력에서 누락되거나 DialogueTurn 검증에서 막히지 않도록 연결 |
| 계약 보강 | `DialogueTurn` 검증 허용 표정에 `annoyed`, `stern`, `disappointed`, `embarrassed`를 추가했다. 일반 대화 표정을 `affectState`로 역매핑해 감정 상태와 UI 표정이 어긋나지 않게 했다. |
| 대사 보강 | 피곤·지침 계열 입력은 `mood-tired` 대사 풀로 들어간다. 불만족/무례 입력은 확장 표정으로 반환되고, 추천 오프닝에는 `awkward/warm` 전용 문구를 추가했다. |
| 정리 | `dialogue-loader.ts`의 `any` 캐스팅을 `DialoguesData` 타입 캐스팅으로 교체했다. |
| 검증 | `npm.cmd test -- dialogue-turn.test.ts engine.test.ts response.test.ts --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` 통과. 현재 Vitest 151개 통과, 메인 JS 390.53 kB |

#### DLG-803: Re:Station 기본 설정과 예외상황 응답 보강

| 항목 | 내용 |
|---|---|
| 상태 | DONE (미성년자/무알코올 전용 응답은 Phase 3 정책으로 폐기) |
| 목적 | 일반 대화에서도 Re:Station이 가상의 바라는 기본 설정이 드러나고, 사용자가 실제 매장 정보나 안전·운영 경계에 가까운 말을 했을 때 자연스럽게 한계를 안내 |
| 범위 | 바 소개, 시에스타/사장 안내, 물 요청, 과음, 알레르기/제외 재료, 예약·영업시간·주소·결제·화장실 같은 실제 매장 정보 요청 |
| 구현 결과 | `keywordRules`와 `generateResponse` 의도 분기에 기본 설정과 예외상황 응답 풀을 추가했다. 키워드 규칙이 먼저 처리하고, 키워드를 우회한 유사 표현은 `conversation.ts` fallback에서 처리한다. |
| 안전 경계 | 과음은 일반 경계 응답으로 처리한다. safety-alert만 `safetyLocked` Hard Stop으로 세션을 종료한다. 실제 매장 안내는 제공하지 않고 가상의 바 대화와 추천 범위로 돌린다. |
| 검증 | `npm.cmd test -- engine.test.ts --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint` 통과. 현재 Vitest 133개 통과 |

#### DLG-802: 추천 질문 DialogueFlow JSON 계약

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 추천 진행이 질문만 기계적으로 반복되는 흐름이 아니라, 이전 답변을 받아 다음 주제로 자연스럽게 넘어가도록 JSON에 최소 대화 흐름 힌트를 보관 |
| 범위 | `RecommendationQuestion.dialogueFlow`에 `leadIn`, `continuation`, `goal` 추가. 질문 문구 자체와 선택지 신호는 유지하되, 질문 앞 연결문을 질문별로 다르게 렌더링 |
| JSON 원칙 | 대사 전문이나 캐릭터 원고를 저장하지 않는다. JSON에는 질문의 대화 목적, 처음 물을 때의 연결문, 이전 답변 뒤 이어갈 때의 연결문만 둔다. |
| 구현 결과 | `formatQuestion`이 고정 `한 가지만 더 여쭤볼게요.` 대신 `dialogueFlow.leadIn` 또는 `dialogueFlow.continuation`을 사용한다. 모든 추천 질문은 flow 계약을 가진다. |
| 검증 | `npm.cmd test -- question-engine.test.ts --run`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint` 통과. 현재 Vitest 127개 통과 |

#### SPR-002: 카루아 표정 PNG 제작·연결

| 항목 | 내용 |
|---|---|
| 상태 | DONE (2026-07-15) |
| 목적 | 고정된 표현 슬롯에 실제 표정 PNG를 제작·연결하고, 에셋 제작 규칙을 함께 완료 |
| 현재 연결 | `sympathy`, `surprised`, `disappointed`, `annoyed`는 동명 PNG를 사용한다. `upset.png`는 현재 `Expression` 타입에 없는 이름이므로 safety 경계의 `stern` 슬롯으로 명시 연결했다. `talk`은 별도 PNG를 만들지 않고 `idle`을 의도적으로 공유한다. |
| 범위 | `BartenderSprite.tsx` 이미지 매핑, 기존 `Expression`별 fallback, CSS 크기와 위치 안정화, 표정 변경 시 레이아웃 흔들림 방지 |
| 가이드 | 기존 `character.png`와 `character0.png`는 스타일이 다르므로 먼저 기준 카루아 디자인을 결정한다. 결정 전에는 현재 `character.png`를 fallback으로 유지한다. |
| 구현 메모 | `Expression` 타입을 그대로 사용하되 이미지 import를 맵으로 분리한다. 누락된 표정은 `idle` 또는 현재 `character.png`로 fallback한다. CSS filter는 실제 표정 이미지가 준비되면 보조 효과 수준으로 줄인다. |
| 검증 기준 | `idle/talk/thinking/smirk/sympathy/surprised` 전부 렌더링 가능해야 한다. 표정 전환 시 `restation-stage`, 채팅 dock, 추천 카드 위치가 흔들리지 않아야 한다. |
| 완료 조건 | 모든 `Expression` 값이 실제 이미지 또는 명시적 fallback으로 표시되고, 에셋 폴더·명명 규칙·기준 이미지가 정리되며 기존 대화·추천 흐름에서 표정 전환이 깨지지 않음. `sprites.test.ts` 통과와 production preview의 데스크톱·모바일 화면 검수를 완료했다. |

#### SPR-003: 카루아 Sprite Animation

| 항목 | 내용 |
|---|---|
| 상태 | PROPOSED |
| 목적 | PNG 표정 전환과 제조·서빙 연출을 같은 스프라이트 상태 계약으로 정리 |
| 범위 | 기존 셰이킹·서빙 컷, 정적 표정 전환, 필요 시 짧은 전환 효과를 `BartenderSprite`와 구조화된 presentation cue로 정리 |
| 경계 | 대화 텍스트로 화면 상태를 추론하지 않는다. 대화의 `expression`과 제조/서빙 cue만 소비하며, 추천·Action·세션 판단은 변경하지 않는다. |
| 완료 조건 | 표정·셰이킹·서빙 상태가 모바일/데스크톱에서 레이아웃을 흔들지 않고, 각 상태 전환을 테스트하거나 수동 검증한다. |

#### SPR-004: 시에스타 Sprite 표시

| 항목 | 내용 |
|---|---|
| 상태 | PROPOSED |
| 목적 | 허용된 시에스타 만담 이벤트에서만 시에스타 스프라이트를 무대에 짧게 표시 |
| 범위 | `SiestaSprite` 또는 공통 `CharacterSprite`, 무대 오른쪽/후면 배치, 등장·퇴장 CSS 상태, 모바일 겹침 방지 |
| 경계 | 시에스타는 기본 화면에 보이지 않으며, 추천 진행·안전·퇴장·추천 취소에서는 표시하지 않는다. |
| 완료 조건 | 데스크톱·모바일에서 채팅 영역과 추천 카드를 가리지 않고, 이벤트가 없을 때 DOM 또는 표시 상태가 비활성임을 검증한다. |

#### SPR-005: 시에스타 Event Sync

| 항목 | 내용 |
|---|---|
| 상태 | PROPOSED |
| 목적 | `createSiestaEvent` 결과의 speaker·stage direction을 시에스타와 카루아 스프라이트 상태에 동기화 |
| 범위 | `SiestaEventResult`의 구조화된 `spriteCue` 또는 `stageDirection`, 활성 화자·표정, 퇴장 타이밍, 카루아 대화권 반환 |
| 경계 | 대사 텍스트를 화면 상태 판단에 사용하지 않는다. 이벤트 엔진이 구조화된 cue를 반환하고 UI는 cue만 소비한다. |
| 완료 조건 | 시에스타 발화 중에는 시에스타가 활성, 마지막 카루아 반환 발화 뒤 시에스타가 비활성화되며 보호 경로에서는 cue가 생성되지 않음을 테스트한다. |

#### DLG-801: JSON 중심 대화 계약

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | LLM 사용 여부와 관계없이 대화의 의미, 상태 변경, 다음 행동을 검증 가능한 JSON으로 관리 |
| 범위 | `intent`, `entities`, `route`, `routeTags`, `statePatch`, `action`, `responseGoal`, `facts`, `forbidden`, `confidence` 최소 계약과 스키마 검증, 규칙 엔진 복구 경로 |
| JSON 통제 | 대사 전문을 JSON에 저장하지 않고 입력 경로 태그, 공통 의미 계약과 소수 기본 템플릿만 유지. 전체 대화 대신 상태 요약만 WebLLM에 전달 |
| 역할 경계 | 검색 API는 사실 수집, 코드는 상태·행동 결정과 대사 풀 선택, WebLLM은 구조화 의미 후보만 제안 |
| 완료 조건 | 규칙 엔진과 선택적 LLM이 동일 계약을 사용하고, 잘못된 JSON은 상태를 변경하지 않으며, WebLLM 없이 기본 템플릿만으로 핵심 흐름을 완료 |
| 구현 결과 | `validateDialogueTurn`이 intent/action/route/routeTags/statePatch/expression enum, confidence 범위, 필수 문자열과 배열을 검증한다. `buildDialogueTurn`은 응답이 비어도 action별 기본 템플릿으로 복구하며, 안전·퇴장·추천 취소·미등록 칵테일 흐름은 상태 변경 전에 계약 검증을 통과해야 한다. |

#### DATA-801: 관리자 검증 큐와 미확정 칵테일 처리

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 자동 검색으로 확정하지 못한 정보 부족 칵테일, 출처 충돌 항목, IBA에 없는 시그니처·변형 후보를 정식 DB가 아니라 관리자 검증 큐로 분리 |
| 범위 | 큐 항목 종류(`unknownCocktail`, `signatureCandidate`, `conflictingSearchResult`), 원문 이름, 요청 문맥, 검색 시도 기록, 실패 사유, 후보 레시피, 관리자 상태(`open/approved/rejected/archived`) |
| 운영 모델 | 유저 간 상호작용은 만들지 않는다. 일반 사용자는 미확정 항목 요청만 제출하고, 관리자만 큐 조회·수정·승인·반려·승격을 수행한다. |
| 런타임 응대 | 이름만 있고 정보가 부족한 항목은 DB에 바로 추가하지 않는다. 사용자는 흥미롭게 받아들이되 확인된 메뉴가 아니므로 추천 후보로 쓰지 않는다고 안내한다. |
| 완료 조건 | 관리자 승인 전 항목은 검색·추천 후보로 사용되지 않으며, 승인 시에만 정식 칵테일 데이터로 승격되고 반려·보류 상태가 추적됨 |
| 구현 결과 | 큐 상태를 `open/approved/rejected/archived`로 확장하고, `unknownCocktail`, `signatureCandidate`, `conflictingSearchResult` 등록 함수를 분리했다. 미확정·출처 충돌 항목은 승인할 수 없고, 레시피와 재료가 있는 시그니처 후보만 승인 후 승격 준비 후보로 노출된다. 큐 복사본은 내부 상태를 변형하지 않는다. |

#### DATA-802: IBA 우선 검색과 레시피 기반 설명 보강 파이프라인

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 칵테일 추가 시 IBA 공식 레시피를 최우선 검색하고, IBA에 없는 변형·시그니처는 확인된 레시피를 기준으로 맛 설명만 보강 |
| 범위 | IBA 공식 출처 우선순위, 외부 검색 실패·충돌 처리, 레시피 후보 정규화, 설명문 생성 규칙, 관리자 검증 큐 이관, 정식 승격 |
| DB/백엔드 | MVP에서는 JSON을 유지한다. 공통 DB가 필요해지는 시점에는 `official` 칵테일 DB와 관리자 검증 큐만 제공하는 BaaS 또는 얇은 백엔드를 우선 검토하며, 소셜 기능·사용자 간 데이터 공유·개인 히스토리 서버 저장은 범위에서 제외한다. |
| 역할 경계 | 검색/API는 출처와 레시피 후보 수집, 코드는 스키마·출처·중복 검증과 승격 판단, AI 또는 프로그램 생성은 재료·조주법 기반 맛·향·질감 설명과 태그 후보 생성만 담당 |
| 금지 | 출처 없는 역사·유래·창작자·공식성·유명세 생성, IBA 비공식 항목에 "클래식", "정통", "공식" 같은 권위 표현 사용, 관리자 승인 전 추천 후보 반영 |
| 완료 조건 | IBA 공식 항목은 출처와 함께 추가 가능하고, 비공식 변형·시그니처는 레시피 기반 설명만 보강되며, 검색 실패·정보 부족·출처 충돌 항목은 관리자 검증 큐로 이동함 |
| 구현 결과 | `processRecipeCandidate`가 검색 결과 후보를 IBA 공식 레코드, 시그니처 검증 큐, 정보 부족 큐, 출처 충돌 큐로 분류한다. IBA URL과 공식 분류가 모두 유효한 후보만 정식 `CocktailRecord`로 정규화하며, 비공식 후보는 권위 표현 없이 관리자 검증 큐로 보낸다. |

## 폐기 또는 대체된 과거 작업 ID

| 작업 ID | 처리 |
|---|---|
| BAR-001~BAR-004 | `MC-001` 초기 조사에서 임시 제안된 ID. 상세 정의 없이 현재 `RST-*` 단계 계획으로 대체되어 별도 작업으로 추적하지 않음 |

## 향후 구조 리팩토링 로드맵

> 2026-06-26 기록. 아래 항목은 현재 구현을 당장 뒤집는 지시가 아니라, 다음 대화/추천 구조 수렴을 위한 작업 대기열이다. 추천 엔진의 결과 결정 책임과 대사 표현 책임 분리는 유지한다.

| Phase | 작업명 | 상태 | 목적 | 메모 |
|---|---|---|---|---|
| Phase 1 | IntentClassifier 통합 | 완료 | 입력을 추천/대화/이야기/캐릭터/안전 등으로 안정적으로 분류 | 통합 결과가 흐름 제어용 `route`와 응답 의미용 `intent`를 함께 제공하며, 컨트롤러와 응답 엔진이 같은 결과를 재사용 |
| Phase 1.5 | Context + Action Layer | 완료 | `모히토` → `그걸로 주세요` → 실제 주문처럼 이어지는 흐름 구현 | 순수 Conversation Context와 DialogueAction 해석기를 추가하고 생략 주문·후속 이야기·정보 질문을 실제 대상 칵테일에 연결. 명시적 lore/person/media 주문은 `loreBasedOrder` 행동으로 주문 후보 저장과 제조·서빙까지 실행. Phase 4~5에서 갱신 정책과 전체 실행 계층을 확장 |
| Phase 2 | Response Pipeline | 완료 | 응답 선택, 템플릿, 데이터 삽입, 표정 선택을 분리 | `ResponseDraft`와 `assembleResponse` 계약 추가. 템플릿은 최종 표정 대신 tone을 제공하고 추천 결과, 이야기 응답, 캐릭터 응답이 같은 조립 파이프라인을 통과 |
| Phase 2.5 | DialogueSessionState 정리 | 완료 | Phase 3 전에 컨트롤러의 세션 상태와 종료 흐름을 단일 계약으로 고정 | `phase/mode/dialogue/welcomeDrink/order/farewell/safetyLocked` 통합. safety-alert는 추천·주문·웰컴·farewell을 중단하고 세션을 강제 종료. 미성년자/무알코올 전용 정책은 제외 |
| Phase 3 | DialogueService 분리 | 완료 | `useRestationController`에서 대화 로직을 떼어내기 | 서비스가 컨텍스트 구성·분류·세션 차단·Action·Context 이벤트·응답·턴 검증을 담당. 텍스트/사이드바 주문 계약 통합, 서빙 후 conversation 복귀, safetyLocked 흡수 상태. 390 tests pass |
| Phase 4 | Conversation Context 완성 | 완료 | 대화 중 참조 가능한 컨텍스트 정리 | 단일 context reducer로 통합하고 컨트롤러의 `lastServedCocktail` 객체 상태 제거. 필드 전이·참조 우선순위·reset 수명·서빙 완료 시점 기록을 테스트로 고정. 396 tests pass |
| Phase 5 | Action Layer | 완료 | `order`, `serve`, `recommend`, `continueStory` 같은 행동 실행 | 공통 executor가 추천·주문 포트와 serve/respond 효과를 반환하고 텍스트·사이드바 경로가 동일 계약 사용. `serving-plan.ts`로 도수·XYZ·farewell·다음 phase 계산 분리. 컨트롤러는 UI 효과만 적용. 404 tests pass |
| Phase 5.5 | Reaction Layer | 완료 | 사용자 평가·동의·혼란에 먼저 반응하고 필요한 경우에만 기존 행동으로 연결 | 5개 반응 타입을 얇은 계층으로 분리. 단순 반응은 `respond`, `another-request`는 기존 `recommend` Action 사용. negative 재추천 제외·another 새 추천·lore 비반복·반응 우선 통합 회귀까지 고정. 430 tests pass |
| Phase 6 | Slot Filling 추천 FSM | 완료 | 질문 순서 강제 대신 사용자가 말한 취향 슬롯을 자유롭게 채움 | taste/base/strength/fizz를 자유 순서로 저장하고 복합 답변의 선택지·자유입력 신호를 병합. 알려진 topic은 재질문하지 않으며 기존 FSM·최대 질문 수·추천 엔진 유지. 421 tests pass |
| Phase 7 | Dialogue Quality | 완료 | fallback 줄이기, bar/character/story 전용 응답 강화 | story/lore/info 선행 반응, character/story 전용 풀, 누락된 random/unknown/cancel 풀 보강. 템플릿 참조 27개가 모두 유효한 JSON 대사 풀을 갖는 출처 계약 고정. Intent·사실 선택·공개 이력 유지. 434 tests pass |
| Phase 8 | Talking Points 확장 | 완료 | lore/talking_points를 더 풍부하게 만들기 | 대표 클래식 20종에 talking point 20개와 lore reference 40개 누적 추가. 공개 structured lore 30/49종 확보. 실제 인물·작품·역사·문화 연결과 완곡한 출처 표현을 테스트로 고정. 나머지는 점진적 콘텐츠 확장으로 분리. 435 tests pass |
| Phase 8.5 | Phase 9 진입 전 기능 경계 보완 | 완료 | Reaction·정보 응답·추천 차단 경계를 Character Layer 전에 안정화 | 최종 Action 기준 closed 차단, story/lore/info 사실 우선순위 분리, 정상 intent의 Reaction 덮어쓰기 방지, feedback 대상의 실제 추천 제외 상태 연결. Phase 9/말투 변경 없음. 457 tests pass |
| Phase 9 | Character Layer + 전체 대사 감사 + RapportState | 완료 | 카루아 말투, 농담, 반존대, 표정 FSM 반영, 전체 525개 대사 검수, 숨은 관계성 단일 축 | Character Profile·검증기·메타데이터·Response Pipeline + 3건 금지 패턴 수정. RapportState v3.0.0은 숨은 정수 축 0~10(초기값 4)이며 추천·FSM·Action·SessionState·ResponsePlan 선택에 미연결 |
| Phase 10 | ResponsePlan DB 리팩토링 | 완료 | 완성 대사 DB를 의미·표현 블록 중심 ResponsePlan DB로 전환 | 대화 14개 카테고리·108개 문장 + Recommendation Formatter 4/4 + Welcome Formatter 완료 + Farewell Formatter 완료(standard farewell entry + welcome XYZ clarification + regular XYZ body + welcome-farewell XYZ body + farewell conversation/block/return-home). formatter plan 38개·template line 120개, 필수 expression·제한 slot·legacy formatter fallback 고정. 697 tests pass |
| Phase 11 | 대사 출처 정상화 | DONE | 결정 로직과 표현 로직을 분리하고 중복 대사 출처 제거 | ResponsePlan-backed legacy dialogue category를 삭제하고 required legacy fallback은 의도적으로 유지한다. keyword-rule, response-template, story-query, welcome-drink, farewell-replies 표현 소유권과 Character QA 범위를 정리했다. Interaction Timeline, Rapport, WebLLM 런타임 통합은 후속 범위다. |
| Phase 12 | WebLLM 의미 보조 | DONE | 자유대사 생성 없이 topic·stance·block·세션 태그를 구조화 제안 | 실제 Chrome에서 WebGPU 호환 GPU 미확보로 cold prepare가 약 375 ms에 실패·세션 비활성화됨. 격리·timeout 계약 테스트 통과 |
| Phase 13 | Semantic Snapshot 활용 여부 검토 | DONE — 보류 | Phase 12 측정과 품질 기준을 근거로 Snapshot 활용 여부를 결정 | 현 환경의 준비 실패와 가치 대비 비용을 근거로 보류. 기존 규칙 기반 선택 유지, Action·Session 변경 금지 |
| Phase 14 | ResponsePlan 보조 선택 | DEFERRED | 승인된 Snapshot hint로 기존 ResponsePlan 블록 조합을 보조 선택 | Phase 13 보류에 따라 착수하지 않음. 자유문장·사실·재료·효과 생성 금지 |
| Phase 15 | 최종 캐릭터 QA | DONE | 전체 응답 경로의 카루아 말투와 캐릭터 일관성 확정 | 프로필 기반 말투 회귀를 전체 ResponsePlan·JSON·formatter·시에스타 카루아 대사·Action fallback으로 확대. 상담가·AI 도우미·고객센터형 표현 교체, 시에스타 런타임 활성 상태 유지. 826 tests pass |

### 현재 실행 우선순위와 Conversation QA gate (2026-07-13)

| 우선순위 | 범위 | 완료 조건 |
|---|---|---|
| P0 — DONE | 대화 연속성 FSM, ContinuationResolver, 추천 문맥, PendingQuestion, SessionTopic | 실제 플레이 로그를 턴 배열로 실행해 Intent, Topic, PendingQuestion, Route, ResponsePlan, Expression, SessionAffect와 다음 snapshot을 모두 검증 |
| P1 — DONE | 제품 계약, 핵심 E2E, 추천 카드 계약, 카루아 명칭 | 기능 안정화 뒤 대표 사용자 흐름과 문서 계약이 일치하고 명칭·정보 책임이 단일화됨 |
| P2 — DONE | 접근성, 모바일 UX, 모달, 전송 버튼 | 375 px 모바일에서 메뉴 dialog의 ESC 닫기·트리거 포커스 복귀·Tab 순환, 400 px 가상 키보드 높이에서 입력·전송 버튼 노출, Enter 전송을 실측 |
| P3 — DONE | Controller, ResponsePlan data, DB 진입점 | 동작 계약을 유지하면서 책임 경계를 분리하고 전체 회귀 통과 |
| P4 — DONE | 이미지, 번들, lazy loading | 카루아 전체 이미지 선로딩 제거와 기본 OFF WebLLM 준비 경로 지연 로딩 적용. production Network에서 OFF는 카루아 현재 표정 1장만, ON은 WebLLM 청크 요청을 확인 |
| P5 — DONE | README와 mission_control 동기화 | README, CURRENT_STATE, TASK_BOARD, WORK_LOG의 상태·테스트 수·번들 수치를 2026-07-14 기준으로 갱신 |

#### P0 Conversation QA 완료 계약

> 상태: **DONE (2026-07-13)** — `conversation-continuity.test.ts`가 실제 다중 턴 로그와 전이 경계를 검증하며 전체 테스트·타입 검사·린트를 통과했다.

Conversation QA는 단위 함수들의 존재가 아니라 실제 사용자 대화가 다음 순서로 이어지는지를 검증한다.

```text
Input
→ Intent
→ SessionTopic
→ PendingQuestion
→ Route
→ ResponsePlan
→ Expression
→ SessionAffect
→ next context snapshot
```

필수 대표 로그:

```text
여긴 뭐하는 곳이에요
당신은?
추천받기
잘 모르겠어요
베이스가 뭐예요
카루아에게 맡기기
```

추가 완료 조건:

- `ContinuationResolver`가 직전 topic·subject가 있을 때만 짧은 후속 입력을 복구한다.
- 활성 추천 질문에서 도움말·반복·건너뛰기·위임 입력이 일반 잡담 route로 새지 않는다.
- 질문 도움말 뒤에는 동일 `PendingQuestion`이 유지되고, 건너뛰기에는 다음 질문 또는 추천으로 전이한다.
- 위임·추천 완료·추천 취소·safety·farewell에서는 더 이상 유효하지 않은 `PendingQuestion`이 제거된다.
- `SessionTopic`과 cocktail subject가 후속 이야기·정보 요청 동안 유지되고 명시적 새 대상에서 교체된다.
- ResponsePlan 변경이 Intent, Route, 추천 결과, 세션 전이를 바꾸지 않는다는 회귀를 고정한다.
- 실패 출력은 턴 번호와 각 단계의 기대값·실제값을 보여 문맥이 끊긴 경계를 바로 찾을 수 있어야 한다.

#### P1 제품 계약 완료 결과

> 상태: **DONE (2026-07-13)** — 규칙 기반 핵심 E2E, 추천 카드 정보 책임, 카루아 명칭 계약을 코드와 회귀 테스트로 고정했다.

- 핵심 E2E는 추천 진입, 1~3개 질문, DB 기반 결과, 카드 표시, 이전 결과 제외 재추천, 서빙, XYZ, 배웅 단계의 추가 주문 차단과 safety hard stop을 함께 검증한다.
- 추천 카드는 이름, 분위기, 중립 설명, 베이스, 재료, 잔, 분류, 맛 프로필만 표시한다.
- 상세 레시피는 사이드바 책임으로 유지하고 추천 이유, 농담, 카루아용 이야깃거리는 대화 계층에 남긴다.
- 사용자에게 표시하는 캐릭터 이름은 `카루아`로 통일한다. 사용자가 `칼루아`로 입력한 경우에만 위임 의도의 호환 별칭으로 허용한다.

#### P2 사용성 구현 및 검수 결과

> 상태: **DONE (2026-07-14)** — 코드·렌더링 계약·전체 자동 회귀와 production preview의 모바일·키보드 실측을 모두 통과했다.

구현 완료:

- 채팅 입력에 명시적인 `전송` submit 버튼과 빈 입력·처리 중 disabled 상태를 추가했다.
- 추천 카드 모달에 dialog 이름/설명, ESC 닫기, 포커스 진입·트랩·복원, 배경 클릭 닫기, 본문 스크롤을 적용했다.
- 모바일 사이드바에 닫기 버튼, ESC, 포커스 트랩, 닫힌 상태 `inert`, tab/tabpanel 연결을 적용했다.
- 모바일 입력을 16px로 유지하고 44px 터치 영역, 동적 viewport, safe-area, 작은 화면 세로 배치, reduced-motion을 적용했다.
- 대화 영역은 polite live log로, 입장 버튼과 메뉴 버튼은 명확한 접근 가능한 이름으로 노출한다.
- 타이핑 중인 부분 문자열은 접근성 트리에서 숨기고 완성된 메시지만 live log의 추가 항목으로 노출해 스크린리더 반복 낭독을 막는다.

수동 검수 기록과 추가 출시 전 시각 sweep 후보:

- P2 gate는 375 px·가상 키보드 검수로 종료했다. 320 px와 768 px 전체 화면 sweep은 출시 후보 검수에서 추가할 수 있다.
- 375 px viewport에서 메뉴 dialog의 Tab 순환, ESC 닫기, 원래 메뉴 트리거 포커스 복귀를 확인했다.
- 400 px 가상 키보드 높이에서 입력과 전송 버튼이 화면 안에 남는 것을 확인했다.
- 입력값이 있는 상태에서 Enter 제출 뒤 입력값 초기화와 전송 버튼 비활성화를 확인했다. CocktailCard의 dialog·ESC·focus trap은 UI 회귀 테스트로 검증한다.

#### P3 구조 정리 완료 결과

> 상태: **DONE (2026-07-13)** — Controller 보조 책임, ResponsePlan 도메인 데이터, DB 진입점을 물리 분리하고 전체 Conversation QA·정적 검사·빌드를 통과했다.

- `useRestationController`에서 공개 상태/상호작용 계약과 타이밍·rapport 매핑을 `restation-controller-model.ts`로 분리했다.
- DialogueService 요청 snapshot 조립을 `restation-dialogue-request.ts`, 관계성 상태 수명을 `useRapportSession.ts`로 분리했다.
- 중복 제거와 FIFO·예약 상태를 가진 상호작용 대기열을 `restation-interaction-queue.ts`로 분리하고 계약 테스트를 추가했다.
- 대기열 타입별 실행 분기를 `restation-interaction-runner.ts`의 순수 dispatcher로 분리하고 payload·거부 결과 전달 계약을 고정했다.
- 타이핑 완료·제조 지연·후속 메시지·칵테일 공개 상태를 `useRestationPresentation.ts`로 이동했다.
- 웰컴드링크 실행과 대기열 진입을 `useRestationWelcomeDrink.ts`, XYZ·표준 배웅 진입을 `useRestationFarewell.ts`로 이동하고 hospitality 계약 테스트를 추가했다.
- 중복되던 서빙 계획·farewell entry·다음 phase 결정을 `restation-serving-decision.ts`로 분리하고 일반/XYZ 전이 계약을 고정했다.
- `response-plan-data.ts`는 일반 대화 raw plan 저장소로 한정하고, 런타임 소비자는 `response-plan-catalog.ts`의 안정적인 catalog와 도메인별 partition을 사용한다.
- welcome/farewell raw plan 11개를 `response-plan-data-session.ts`로 물리 분리하고 기존 ID·조립 순서를 유지했다.
- 추천 질문·추천 응답·추천 취소 raw plan을 `response-plan-data-recommendation.ts`로 물리 분리하고 일반 대화 파일에서 추천 ID를 제거했다.
- catalog가 `recommend`, `ask_preference`, 추천 취소 plan을 recommendation 도메인으로 분류하도록 의미 계약을 보정했다.
- 칵테일 데이터 소비자는 `lib/cocktails/index.ts` 단일 공개 진입점을 사용하며 `database.ts` 직접 참조는 저장소 내부로 제한했다.
- 새 경계마다 요청 매핑, ResponsePlan ID 보존·단일 partition, DB 객체 동일성 계약 테스트를 추가했다.

최종 검수에서 `database.ts` 외부 직접 import와 raw ResponsePlan 우회 소비가 없음을 확인했다. `useRestationController.ts`는 입출력 상태를 조정하는 최상위 오케스트레이터로 남고, 분리된 도메인·presentation 모듈의 결정을 연결한다.

### Phase 9~15 후속 계획 계약

#### Phase 9: Character Layer

- 카루아 금지·권장 표현 회귀 테스트를 추가하고 확장한다.
- `persona.ts`를 대체하지 않고 구조화된 말투 검증의 기준으로 참조한다.
- 기존 Response Pipeline 뒤에 표현 검증 계층을 둔다.
- Character Layer는 말하는 방식만 담당하며 추천 결과, 행동, intent, 세션 상태를 변경하지 않는다.

#### Phase 10: ResponsePlan DB 리팩토링

- `text-presets.ts`와 `dialogues.json`을 완성 대사 저장소에서 ResponsePlan 저장소로 전환한다.
- ResponsePlan은 `intent`, `speaker`, `state`, `request`, `block` 기준으로 조회할 수 있어야 한다.
- 모든 `ResponsePlanLine`은 `text`와 `expression`을 직접 소유하며 문자열 line은 허용하지 않는다.
- WebLLM 미지원·미준비·실패 시 사용할 `fallbackText`를 반드시 보존한다.
- Phase 10 완료 후에도 현재 규칙 기반 런타임만으로 전체 핵심 흐름이 동작해야 한다.
- ResponsePlan 우선, 미이관 legacy fallback, JSON 제거 독립성을 슬라이스마다 검증한다.
- 추천 결과·Action·SessionState·ConversationContext·story/lore 사실 선택은 ResponsePlan이 결정하지 않는다.
- 기존 대사 출처는 사용 경로가 0임을 확인하기 전까지 일괄 삭제하지 않는다.
- 첫 배치는 `general-chat`, `mood-*`, `bar-intro`, `character-query`로 고정한다.
- 추천·웰컴·배웅·이야기 포매터와 주문·안전·farewell은 첫 배치 안정화 이후의 후속 배치로 이관한다.

#### Phase 11: 대사 출처 정상화

정규화 대상:

- `keyword-rules.json`
- `response-templates.ts`
- `story-query.ts`
- `welcome-drink.ts`
- `farewell-replies.ts`

목표:

- 의사결정·사실 선택과 최종 표현 책임을 명확히 분리한다.
- 동일 의미의 완성 대사가 여러 출처에 중복 저장되지 않게 한다.
- 모든 대사를 카루아 금지·권장 말투 계약으로 다시 검수한다.

#### Phase 12: WebLLM 의미 보조

- WebLLM은 topic·stance·ResponsePlan block 후보·세션 태그·rapport 힌트를 구조화 JSON으로만 제안한다.
- 최종 문장을 생성하지 않으며 추천 결과, 칵테일 ID, 추천 이유, Action, 세션 상태를 변경할 수 없다.
- 분석 오류, 시간 초과, 검증 실패는 무시하고 JSON/FSM 흐름을 그대로 사용한다.
- Phase 12에서는 WebLLM 결과를 현재 사용자에게 보이는 출력, ResponsePlan 선택, Recommendation, Action, FSM에 연결하지 않는다.
- 개발 모드 관측은 `window.__RESTATION_WEBLLM__.snapshot()`으로 enabled, prepared, sessionTags, lastResult, lastFailure, statistics를 확인한다.
- Phase 12 실측 결과: 실제 브라우저에서 prepare를 시도했으나 호환 GPU를 확보하지 못해 약 375 ms에 실패하고 세션이 비활성화됐다. 모델 다운로드는 시작되지 않았고 JSON/FSM 흐름은 유지됐다.
- 지원 GPU에서의 prepare 성공, warm 재사용, 모델 다운로드 크기·속도 비교는 RST-602로 분리해 DEFERRED다. timeout·ON/OFF 격리·Recommendation/Action/FSM 불변은 자동 계약 테스트로 확인했다.

#### Phase 13: Semantic Snapshot 활용 여부 검토

- Phase 12 실측값, timeout·복구 결과, 의미 태그 품질을 근거로 Snapshot을 Phase 14에 연결할지 결정한다.
- 이 단계에서는 현재 사용자 출력이나 ResponsePlan 선택을 변경하지 않는다.
- 보류하면 이후 단계 없이 기존 JSON·규칙 선택을 유지한다.

#### Phase 14: ResponsePlan 보조 선택

- 승인된 세션 태그와 block 후보만 이후 턴의 ResponsePlan 선택 힌트로 사용한다.
- 힌트가 없거나 규칙과 충돌하면 기존 JSON 선택을 유지하고, WebLLM 분석 때문에 현재 응답을 기다리게 하지 않는다.
- 내부 칵테일 DB를 단일 사실 출처로 유지하며, lore·재료·효과·레시피·최종 문장 생성은 금지한다.

#### Phase 15: 최종 캐릭터 QA

> 상태: **DONE (2026-07-20)** — 전체 자동 회귀 63 files / 826 tests, 타입 검사, 린트, production build 통과.

- 금지 표현 정의를 `KARUA_FORBIDDEN_EXPRESSIONS` 단일 계약으로 통합하고, 말투 회귀가 같은 프로필을 직접 사용하도록 정리했다.
- `dialogues.json`, `keyword-rules.json`, ResponsePlan, formatter, preset, welcome/farewell/story/recommendation뿐 아니라 시에스타 이벤트의 카루아 대사와 Action fallback도 자동 감사한다.
- “도와드릴게요”, “충분히 이해해요”, “최선을 다하고”, “제가 더 잘 이해”처럼 상담가·AI 도우미·고객센터로 들리는 표현을 관찰·선택·잔 중심의 바텐더 화법으로 교체했다.
- 선택권을 허용하는 문맥의 “괜찮아요”가 포괄적 감정 안심으로 오탐되지 않도록 단독 응답만 차단한다.
- 시에스타 이벤트는 이미 런타임에 활성화되어 있어 재활성화하지 않았다. 안전·퇴장·추천 진행 중 차단과 대화권 반환 계약을 유지하면서 카루아 발화 전수만 최종 감사 범위에 포함했다.

## 2026-06-23 추가 기록: SPR-006 카루아 에셋 구조와 제조 애니메이션

| 항목 | 내용 |
|---|---|
| 상태 | DONE |
| 목적 | 정적 스프라이트와 프레임 애니메이션을 같은 캐릭터 에셋 체계 아래에서 관리하고, 칵테일 결과 표시 전에 제조 애니메이션을 출력한다. |
| 완료 내용 | `character.png`, `character0.png`를 `bar_tend/src/assets/characters/karua/static/`으로 이동했다. 셰이킹 프레임 팩을 `bar_tend/src/assets/characters/karua/animations/shaker/`로 이동했다. `sprites.ts`를 추가해 정적 스프라이트와 셰이킹 프레임 배열을 코드 계약으로 묶었다. |
| 런타임 계약 | `useRestationController`는 칵테일 확정 후 `preparing` 상태를 거쳐 `BartenderSprite`에 `isPreparingCocktail`을 전달한다. 제조 애니메이션이 끝난 뒤 추천 대사와 칵테일 카드가 표시된다. |
| 검증 | `npm.cmd run check`, `npm.cmd run build` 통과 |

### 향후 스프라이트·이미지 에셋 추가 공정

1. 캐릭터별 에셋은 `bar_tend/src/assets/characters/{character}/` 아래에 둔다.
2. 움직이지 않는 PNG는 `static/`에 둔다. 예: `karua/static/idle.png`, `karua/static/talk.png`.
3. 프레임 애니메이션은 `animations/{action}/`에 둔다. 예: `karua/animations/shaker/karua_shake_01.png`.
4. 각 캐릭터 폴더에는 `sprites.ts`를 두고 정적 이미지 맵과 애니메이션 프레임 배열만 export한다. 컴포넌트가 개별 PNG 경로를 직접 많이 import하지 않게 한다.
5. 표정 스프라이트는 `Expression`과 1:1 매핑을 우선한다. 준비되지 않은 표정은 `idle` fallback을 명시하고, 암묵적 문자열 조합으로 경로를 만들지 않는다.
6. 애니메이션 팩에는 가능하면 metadata JSON을 함께 둔다. 최소 항목은 `frame_count`, `frame_width`, `frame_height`, `fps` 또는 프레임 간격, `loop` 구간이다.
7. 새 에셋 추가 후 `npm.cmd run check`와 `npm.cmd run build`로 import 경로와 번들 포함 여부를 확인한다.
8. 화면 검수 기준은 데스크톱과 모바일에서 stage, chat dock, cocktail card, sidebar/menu를 가리지 않는 것이다.
