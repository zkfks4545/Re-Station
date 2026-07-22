# 프로젝트 현재 상태 (축약)

> 최종 갱신일: 2026-07-22 (결정론적 상호작용 파이프라인 방향 반영)

## 상태 요약
| 항목 | 상태 |
|---|---|
| 목표 | Re:Station 카루아 중심 MVP + 시에스타 만담 |
| 단계 | PIPE-801~805·PIPE-806-A/B 완료, 다음 PIPE-806-C PreferenceEvidence 적용 |
| 기술 | React+Vite+프론트엔드 단독, 내부 결정론적 대화·추천 엔진, **Hidden Relationship State** 탑재 (JSON 기반) |
| 빌드/check | 통과 (메인 JS 554.61 kB, gzip 165.58 kB, WebLLM 청크 없음) |
| 테스트 | **Vitest 902개 전체 통과** |
| 세션/출처 테스트 | farewell-replies.test.ts + session-flow.test.ts + Phase 11 route/source 계약 통과 |

## 완료된 기반 (06-30 기준)
| 완료 항목 | 커밋 |
|---|---|
| Phase 1 IntentClassifier 통합 | [`36374a4`] |
| Phase 1.5 Context + Action Layer | [`0404c58`] |
| Phase 2 Response Pipeline 완료 (템플릿·데이터 삽입·표정 선택 분리, 추천/스토리/캐릭터 공통 경유) | [`4003932`][`27e8298`][`024c692`] + 완료 |
| Phase 3 선행 DialogueSessionState 정리 (웰컴 플래그·종료 종류·safetyLocked Hard Stop) | 완료 |
| Phase 3 DialogueService 분리 (분류·차단·Action·Context 이벤트·응답·턴 검증) | 완료 |
| Phase 4 Conversation Context 완성 (단일 reducer·참조 우선순위·세션 수명·서빙 완료 전이) | 완료 |
| Phase 5 Action Layer 완성 (공통 executor·serve/respond 효과·서빙 계획) | 완료 |
| Reaction Layer 추가 (5개 반응 타입·반응 우선·another-request 기존 추천 Action 연결) | 완료 |
| Phase 6 Slot Filling 개선 (자유 순서 입력·기입 슬롯 재질문 방지·복합 답변 신호 병합) | 완료 |
| Conversation Flow 보강 (story/lore/info 선행 반응 + 후속 연결 문장) | 완료 |
| P0.5 Conversation Expansion (추천 질문 중 잡담·지식·세계관 중단/복귀, 질문 보존, 취향 추출, 추천 거부 후 재진입) | 완료 |
| Talking Points/Lore 1차 확장 (클래식 10종·포인트 10개·참조 20개) | 완료 |
| Reaction/Conversation Flow 통합 회귀 (negative 재추천 제외·another 새 추천·lore 비반복·반응 우선) | 완료 |
| Phase 7 Dialogue Quality 완료 (전용 character/story 풀·누락 fallback 5종 보강·27개 출처 계약) | 완료 |
| Phase 8 Talking Points 완료 (대표 클래식 20종 확장·공개 30/49종 structured lore) | [`완료`] |
| Phase 9 진입 전 경계 보완 (Action 기준 closed 차단·콘텐츠 우선순위·Reaction intent 보호·실제 feedback 제외) | [`완료`] |
| Phase 9 Character Layer 기반 (persona 참조 프로필·금지/권장 검증·응답 메타데이터·Response Pipeline 연결) | [`완료`] |
| Phase 9 전체 대사 감사 + 금지 패턴 위반 3건 수정 + 회귀 테스트 7건 보강 | [`완료`] |
| Phase 9 Hidden RapportState (숨은 정수 축 0~10·초기값 4·distant/normal/warm/close·개발용 Debug UI) | [`완료`] |
| CocktailCard 버튼 "다시 추천받기" → "주문하기"·"이야기하기" 교체 | 완료 |
| Phase 10 ResponsePlan 타입·선택·검증·fallback 계약 | [`완료`] |
| Phase 10 ResponsePlanLine expression 필수 계약 보강 | [`완료`] |
| Phase 10 이중 읽기 어댑터 + 카테고리 배치 이관 | 완료 (14개 카테고리·108개 문장 완료, 중간검수 보완 통과) |
| Phase 10 Recommendation Formatter | 4/4 완료: randomPick + exact + nearest fallback 본문 + acknowledgement/lead-in (plan 19개·template line 101개) |
| Phase 10 Welcome Formatter | 완료: welcome-drink 본문 + welcome feedback (formatter plan 27개·template line 109개) |
| Phase 10 Farewell Formatter | 완료: standard farewell entry + welcome XYZ clarification + regular XYZ body + welcome-farewell XYZ body + farewell conversation/block/return-home (formatter plan 38개·template line 120개) |
| Phase 11 Dialogue Source Normalization | 완료: ResponsePlan-backed legacy category 삭제, required legacy fallback 의도적 유지, keyword-rule/response-template/story-query/welcome-drink/farewell-replies 표현 소유권 정리, ResponsePlan dialogue/fallbackText Character QA 포함 |
| WebLLM 의미 보조 (Worker·Semantic Snapshot·허용 목록 검증·세션 태그·비차단 실행·관측 API·격리 계약 테스트, 최종 대사 생성 없음) | Phase 12 범위 완료 |
| 정보 요청 최우선 라우팅 + 칵테일별 설명 공개 이력 | 완료 |
| 시크릿 메뉴 격리·암구호 주문 + 칵테일 DB/이야깃거리 확장 | 완료 |
| 공통 패턴·셰이크 참조·switch 응답 헬퍼 정리 | [`a73342f`][`c82cbc6`][`4f6c90d`] |
| 명시적 lore/person/media 참조가 대명사보다 우선 | [`abe0606`] |
| lore 주문 → 제조·서빙까지 실행 | [`0404c58`] |
| XYZ 세션 종료 (도수한계→Farewell Phase) | [`16d322a`] |
| REF-SESSION-001/002 리팩토링 | [`69175c5`] |
| 데스크톱/모바일 수동 검증 완료 | [`de40d39`] |

## 현재 구현 vs 목표 차이
| 영역 | 현재 | 목표 |
|---|---|---|
| 캐릭터 | 카루아 표정·연출과 캐릭터 취향 질문 24개 fixture, `ask-character-preference + kahlua + drink/general` 전용 ResponsePlan 완료. 시에스타 런타임 플래그는 OFF | 현재 상태 질문 → 가게·시에스타 질문 → 사용자 되묻기 순으로 제한 확장 |
| 대화 | DialogueService + Conversation Context + 전체 ResponsePlan/Character QA 완료 | 유지. FLOW-003은 별도 승인 전 PROPOSED |
| 입력·결정 구조 | `DialogueService`가 Understand·DialogueMove를 생성하고 control 및 topic·speech·entity 계획을 controller가 호환 gate 후 소비 | PreferenceEvidence, Conversation Expansion 순으로 점진 소비 |
| 추천 | 43+2종, 4축, dialogueFlow, 평문재료 + 비소비 `PreferenceEvidence` 원장·legacy projection | 평가 contribution과 문맥 기반 질문 점수로 점진 전환 |
| 외부 의미 보조 | 공급자 중립 `SemanticAssistPort`, 엄격 proposal validator, fake/no-op만 존재. 실제 API 없음 | 실제 API는 PIPE-808 승인 전까지 미연결 |
| 테스트 | 캐릭터 취향 질문 24개·조사 결합 포함 데이터·서비스·라우팅·세션·UI 등 67 files / 902 tests | 후속 소비 단계별 Replay gate 추가 |
| 번들 | 메인 JS 554.61 kB, gzip 165.58 kB. Understand·Plan runtime 포함, WebLLM 청크 없음 | 500 kB 경고는 후속 기능 단위 분할 시 재평가 |

## 승인된 후속 로드맵 (2026-07-22)

### 결정론적 상호작용 파이프라인

`M0 기준선 → M1 WebLLM 제거 → M2 Replay → M3 InputUnderstanding·SemanticAssist 계약 → M4 Evaluate·Select·DialogueMove·PreferenceEvidence shadow → M5 FSM 점진 적용 → M6 질문 평가·추천 근거 통합 → M7 선택적 API → M8 조건부 ResponseFragment`

- 추천, 잡담, 스토리, 세션, 캐릭터 이벤트가 `Input → Understand → Evaluate → Select → Plan → Present` 단계를 공유한다.
- 공통 단계와 불변식만 공유하고 칵테일·질문·스토리·이벤트 후보 타입과 평가 규칙은 도메인별로 유지한다.
- Replay와 shadow diff를 실제 소비 전환보다 먼저 둔다.
- 현재 FSM 상태는 입력 문맥으로 읽지만 상태 변경은 Plan이 만든 transition에만 허용한다.
- Present는 기존 ResponsePlan, Sprite, Audio 계약을 재사용한다. ResponseFragment는 반복 문제가 측정될 때까지 연기한다.
- 상세 범위와 완료 조건은 `TASK_BOARD.md`, 불변식과 API 금지 경계는 DEC-029가 소유한다.
- PIPE-801 기준 커밋은 `ad058ed`다. 69 files / 856 tests, check, lint, build와 Conversation Expansion·Continuity 2 files / 20 tests가 통과했다.
- PIPE-802 비교 기준 번들은 main 553.16 kB(gzip 166.01 kB), WebLLM worker 6,029.70 kB, lib 5,895.35 kB다.
- PIPE-802 구현 커밋은 `0b29a0e`다. WebLLM 전용 7 test files를 제거한 뒤 62 files / 823 tests, check, lint, build와 대표 20 tests가 통과했다. main은 543.44 kB(gzip 162.32 kB)이며 worker/lib 청크는 없다.
- PIPE-803 구현 커밋은 `d5d086c`다. 정규화 Replay snapshot과 severity diff runner를 추가하고 smalltalk→character, 추천 중 safety, farewell 추천 차단 corpus를 실제 `DialogueService`로 재생한다. 63 files / 827 tests, check, lint, build가 통과했다.
- PIPE-804 구현 커밋은 `daae94c`다. `TurnInput`, 근거 span 기반 다중 신호 `InputUnderstanding`, 낮은 confidence 호출 자격, 공급자 중립 `SemanticAssistPort`와 엄격 validator·fake/no-op를 shadow로 추가했다. 64 files / 843 tests, check, lint, build가 통과했고 런타임 소비자는 없다.
- PIPE-805 구현 커밋은 `a6129f7`이다. 칵테일·질문·대화 legacy 결과를 감싸는 domain evaluation, hard constraint 우선의 결정적 selection, `DialogueMove` transition plan, 강도·범위·근거 기반 `PreferenceEvidence` 원장과 기존 상태 projection을 shadow로 추가했다. 65 files / 859 tests, check, lint, build가 통과했고 기존 추천·FSM 소비는 없다.
- PIPE-806-A 구현 커밋은 `f691adf`다. `DialogueService`가 Understand·DialogueMove를 생성하고 controller는 legacy route와 safety·추천 취소 transition이 일치할 때만 계획을 소비한다. 불일치 시 기존 transition으로 fallback한다. 65 files / 861 tests, check, lint, build가 통과했다.
- PIPE-806-B 구현 커밋은 `507abfc`다. controller가 검증된 topic transition과 SpeechAct를 소비하고 칵테일 entity를 세션 subject에 전달한다. Replay는 primaryTopic·speechAct·entityId를 비교하며 65 files / 864 tests, check, lint, build가 통과했다.
- PIPE-806-B.1 세션 소유권 수정 커밋은 `ea3527c`다. story에서 `추천받기` 선택 시 첫 질문과 함께 recommendation active session으로 원자 전환하며, sessionId·questionId가 다른 오래된 선택과 story action을 거부한다. 65 files / 868 tests, check, lint, build가 통과했다.
- PIPE-806-B.2 캐릭터 취향 응답 커밋은 `a02abe8`이다. 24개 질문 fixture를 `ask-character-preference + character:kahlua + drink/general`로 이해하고 두 고정 ResponsePlan으로 응답한다. 조사 `을/를`, `으로/로` 결합도 공통 preset에서 보정했다. 67 files / 902 tests, check, lint, build가 통과했다.

### Dialogue 과거 완료 기록

`Phase 11 완료 → Character QA 병행 → Phase 12 Semantic Layer Stabilization + WebLLM 실측 → Phase 13 Semantic Snapshot 활용 여부 결정 → Phase 14 ResponsePlan 보조 선택 → Phase 15 최종 Dialogue QA`

- Character QA는 Phase 12~14와 병행한다. 최종 전수 확정은 Phase 15가 소유한다.
- WebLLM 실제 브라우저 측정은 Phase 12 종료 조건으로 완료했다. 실측 환경에서 호환 GPU를 확보하지 못해 준비가 실패했으며, 세션 비활성화와 기존 JSON/FSM 흐름 유지가 확인됐다.
- Phase 13은 기능 구현이 아니라 활용 여부를 결정하는 gate다. 현재는 활용을 보류하며, Phase 14는 착수하지 않고 기존 규칙 기반 선택을 유지한다.
- Phase 15는 전체 사용자 노출 대사 출처와 시에스타 만담·Action fallback까지 프로필 기반 자동 감사에 포함해 완료했다.

### Presentation

`SPR-001 완료 → SPR-002 PNG 제작·검수 완료 → SPR-003 Sprite Animation 완료 → SPR-004 Siesta → SPR-005 Event Sync`

- 기존 에셋 제작·정리 가이드는 SPR-002의 완료 조건으로 흡수한다. 별도 단계로 중복 관리하지 않는다.

### Audio

`Step 1 BGM DONE → Step 2 SFX REVIEW → Step 3 Cue REVIEW → Step 4 Audio UX REVIEW`

- Step 1에서 BGM 재생·볼륨·음소거·저장과 기본 UI는 완료했다.
- Step 2는 `useSfxManager`와 shake/serve 음원, Step 3은 제조·서빙·초기화·퇴장·오류 cue 연결, Step 4는 기존 음악 탭의 SFX 볼륨·음소거·저장을 구현했다.
- Audio 전용 런타임·저장·실패 복구·UI 회귀 8개와 음원 HTTP 계약은 통과했다. 브라우저 제어 런타임 연결 실패로 실제 클릭·청취 검수만 남아 Step 2~4는 `REVIEW`다.

## 현재 우선순위

P0 대화 연속성 뒤 P0.5 Conversation Expansion을 추가해 추천 중 대화 중단·복귀 계약을 닫았다. P1~P5의 기존 완료 상태는 유지한다.

1. **P0 — 대화 연속성 (DONE)**: FSM/ContinuationResolver 연결, 추천 문맥·PendingQuestion·SessionTopic 전이, 실제 플레이 로그 기반 Conversation QA 완료
2. **P0.5 — Conversation Expansion (DONE)**: 새 모드 없이 RecommendationState, ConversationTopic, SuspendedQuestion, ExtractedPreferences를 함께 유지. 잡담·지식·세계관 응답 뒤 기존 질문 복귀, 추천 거부 후 일반 대화와 재진입 보장
3. **P1 — 제품 계약 (DONE)**: 핵심 E2E, 추천 카드 정보 책임, 카루아 사용자 노출 명칭, 구현과 제품 계약 대조 완료
4. **P2 — 사용성 (DONE)**: 375 px 모바일 viewport에서 메뉴 다이얼로그의 ESC 닫기·트리거 포커스 복귀·Tab 순환, 400 px 가상 키보드 높이에서 입력·전송 버튼 노출, Enter 제출을 실측
5. **P3 — 구조 정리 (DONE)**: Controller 모델·요청·관계성·presentation·welcome/farewell·상호작용 대기열·실행 dispatcher·서빙 결정, dialogue/recommendation/session ResponsePlan data와 DB 공개 진입점 분리 및 회귀 검수 완료
6. **P4 — 성능 (DONE)**: 카루아 이미지 전체 선로딩 제거, 기본 OFF WebLLM 준비 경로 지연 로딩, production Network ON/OFF 격리 검증 완료. 메인 JS 553.16 kB 경고는 향후 기능 단위 분할 시 재검토
7. **P5 — 문서 동기화 (DONE)**: README, CURRENT_STATE, TASK_BOARD, WORK_LOG의 상태·테스트 수·번들 수치를 2026-07-22 기준으로 동기화
8. **Phase 15 — 최종 캐릭터 QA (DONE)**: 상담가·AI 도우미·고객센터형 표현을 바텐더 화법으로 교체하고, 단일 캐릭터 프로필 기반 전체 발화 회귀를 검증

`SPR-003`은 구조화 cue와 자동·에셋 계약으로 DONE이다. 시에스타 데이터는 삭제되지 않았지만 `SIESTA_EVENTS_ENABLED = false`라 실제 플레이에는 나오지 않는다. 재활성화 판단은 `SIESTA.md`의 빈도·통합 회귀·입력 정책 게이트를 따른다. `AUD-001` 실제 브라우저 QA는 연결 가능한 브라우저가 생길 때 종료한다. `SPR-004`는 시에스타 기준 디자인과 에셋 승인 전까지 PROPOSED이며, `SPR-005`, `FLOW-003`도 승인·환경 조건 전까지 착수하지 않는다. WebLLM RST-602~606은 DEC-029로 취소·대체됐다.

P0 종료 기준은 실제 다중 턴 로그에서 `Intent → Topic → PendingQuestion → Route → ResponsePlan → Expression → SessionAffect`와 다음 snapshot을 검증하는 회귀 테스트로 충족했다.

---

### WebLLM 실험 종료 결과

| 역할 | 담당 |
|---|---|
| intent·Action·안전·추천·세션 판단 | 기존 JSON/FSM/Rule Engine |
| 대사 블록·농담·비유·마무리 | ResponsePlan DB |
| topic·stance·block·세션 태그 후보 | WebLLM 구조화 의미 분석 |
| 허용 목록·confidence 검증 | Semantic Validator |
| 최종 대사 조립 | Rule Engine |

위 표는 제거 전 과거 구조다. PIPE-802에서 App·controller 연결, hook/component, `src/lib/webllm`, 환경 변수, 패키지 의존성을 제거했다. 과거 측정과 실패 복구 결과만 실험 기록으로 보존한다. 후속 외부 의미 보조는 PIPE-804의 제한적 `SemanticAssistPort` 계약을 사용하며 의미 후보와 원문 evidence span만 제안할 수 있다.

### Phase 12 종료 결과: WebLLM 실측

- 실제 Chrome에서 `VITE_WEB_LLM_PRELOAD_ENABLED=true`, `VITE_WEB_LLM_SEMANTIC_ENABLED=true`로 prepare를 실행했다.
- WebGPU API·16 GB memory·16 CPU는 감지됐지만 호환 GPU를 확보하지 못해 cold prepare가 약 375 ms에 `preparation-failed`로 종료되고 세션이 비활성화됐다. 모델 다운로드는 시작되지 않았다.
- warm prepare는 `session-disabled`로 즉시 생략됐다. 실제 GPU 환경의 warm 재사용·모델 다운로드 측정은 지원 장비가 생길 때 재실행한다.
- timeout·세션 비활성화·ON/OFF 출력, Recommendation, Action, FSM 격리 계약은 WebLLM 24개 단위·계약 테스트로 확인했다. 현재 환경에서는 GPU 준비 실패가 선행되어 실제 generation timeout은 재현되지 않았다.
- **Phase 13 결정: 활용 보류.** ResponsePlan 선택에는 연결하지 않으며 Phase 14는 착수하지 않는다.

## 주요 이슈
| 이슈 | 상태 | 해결 커밋 |
|---|---|---|
| ISSUE-001 한국어 인코딩 오인 | 해결됨 | [`d5a0ea5`] |
| ISSUE-002 Cocktail/CocktailRecord 이중화 | 해결됨 | [`dcbbda5`] |
| ISSUE-003 App.tsx 집중 | 해결됨 | [`9c37666`] |
| ISSUE-004 자동 테스트 부족 | 해결됨 | [`de40d39`] |
| ISSUE-005 JS 번들 593kB | 해결됨 | [`dcbbda5`] |
| ISSUE-006 OpenAI/Ollama 잔재 | 해결됨 | [`dcbbda5`] |
| ISSUE-007 WebLLM 안정성 미검증 | 해결: 실험 종료 후 PIPE-802에서 실행 경로·의존성·빌드 청크 제거 | `0b29a0e` |
| ISSUE-008 카루아 규칙 계약 | 해결됨 | [`bc23714`] |
| ISSUE-009 안전 fallback/빈 응답 | 해결됨 | [`2ad13e4`] |
| ISSUE-010 추천 UI 잔존 | 해결됨 | [`2ad13e4`] |
| ISSUE-011 미등록 칵테일 오분류 | 해결됨 | [`2aecaf0`] |
| ISSUE-012 시에스타 일방적 발화 | 해결됨 | [`2aecaf0`] |
| ISSUE-013 대명사 오해 | 해결됨 | [`0404c58`] |
| ISSUE-014 정보 요청의 직전 칵테일 재주문 오인 | 해결됨 | 완료 |
| ISSUE-015 safety 응답 문구와 테스트 계약 불일치 | 해결됨 | 완료 |

## 향후 방침
- RapportState는 숨은 상태이며 추천 결과·FSM·Action·SessionState·ResponsePlan 선택에 연결하지 않음
- WebLLM 실행 경로는 제거하고 과거 실험 기록만 보존
- 외부 API는 의미 후보와 evidence span만 제안하며 상태·추천·사실·행동·최종 표현 결정 금지
- 칵테일 확장 = IBA 우선, 관리자 검증 큐 (DEC-020)
- 대사 풀 = 입력 경로 선택, FSM=말투·리듬, affectState=표정
- Present는 ResponsePlan + Sprite + Audio 조합을 사용하며 도메인 판단을 변경하지 않음
- 공통DB 필요 시 BaaS 검토, 유저간 상호작용 불필요

## 스프라이트 에셋 구조 (SPR-006)
- `assets/characters/karua/static/` (정적PNG)
- `assets/characters/karua/animations/shaker/` (셰이킹)
- `sprites.ts` = 코드 진입점
- 칵테일 확정→`preparing`→셰이킹 또는 서빙 컷→추천대사+카드
- 새 에셋: `{character}/static/`(PNG), `animations/{action}/`(프레임), `sprites.ts`(import)
- 표정=`Expression` 1:1 매핑, 누락=`idle` fallback

### SPR-001 캐릭터 스프라이트 슬롯 계약 완료

- 카루아 기준 디자인은 현재 런타임의 `static/Kaura.png`으로 고정했다.
- 모든 `Expression`은 `sprites.ts`의 이미지·fallback 맵을 통해 표시한다. 새 `sympathy/surprised/disappointed/annoyed` PNG는 같은 이름 슬롯에 연결했고, `upset.png`는 safety 경계용 `stern` 슬롯에 연결했다. `talk`만 `idle` fallback이다.
- 정적 표정 PNG는 `SPR-002`, 구조화된 카루아 제조·서빙 cue는 `SPR-003`에서 완료했다. 다음 프레젠테이션 범위는 `SPR-004~005` 시에스타 화면 연출이다.
