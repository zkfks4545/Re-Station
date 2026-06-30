# 작업 이력 (축약)

## 2026-06-30 / Codex / 정보 요청 최우선 라우팅과 점진적 칵테일 설명 [470a7c0]
- 내용: 안전·퇴장 예외 뒤 정보 요청을 시크릿 암구호, 정확한 칵테일명 주문, 직전 주문 재주문보다 먼저 판정하도록 입력 우선순위를 정리. `설명`, `자세히`, `이야기`, `일화`, `유래`, `스토리`, `레시피`, `재료`, `맛`, `오마주`, `왜`, `어떻게`, `알려줘`, `더 말해줘` 계열은 언급된 칵테일 또는 직전 칵테일의 후속 정보 요청으로 연결
- 설명 이력: `ConversationContextState.disclosedFactKeysByCocktailId`와 `fact-disclosed` 이벤트를 추가해 칵테일별로 이미 출력한 팩트를 기록. `story-query.ts`는 아직 공개하지 않은 `talkingPoints → description → recipe → tasting → trivia`를 우선해 한 번에 1~2문장만 출력하고, 소진 뒤 자연스러운 종료 문구를 반환
- 서빙 연결: 추천·웰컴드링크·직접 주문·사이드바 주문에서 이미 사용한 이야깃거리를 공개 이력에 기록해 후속 설명에서 같은 내용을 반복하지 않음
- Final Drink: 신규 주문·추천만 차단하고 이미 주문한 칵테일의 설명·이야기·유래·레시피·재료·맛·오마주 질문은 계속 허용. 자동 턴 수 종료를 제거하고 명시적 퇴장 입력으로 귀가
- 수정: `bar_tend/src/lib/dialogue/input-router.ts`, `conversation-context.ts`, `story-query.ts`, `bar_tend/src/hooks/useRestationController.ts` 및 관련 테스트
- 검증: 관련 6개 파일 146/146 tests pass, check/lint/build 통과. 전체 381개 중 379개 통과, 기존 safety 응답 문구 계약 2개(`1393`, `다칠 위험`) 실패

## 2026-06-30 / Codex / 시크릿 메뉴·칵테일 DB·주문 이야기 연결 확장 [470a7c0]
- 내용: Long Island Iced Tea, Corpse Reviver No. 2, Zombie, Death in the Afternoon, Last Word, Vesper, White Russian 등 칵테일 데이터와 레시피·맛·이야깃거리 보강. `PUKEY Goddess Shot`, `Glitch Rain`을 일반 목록·추천·랜덤에서 제외되는 시크릿 메뉴로 분리
- 주문 규칙: 정확한 칵테일명은 기본 주문으로 처리하고, 시크릿 암구호는 직전 주문 컨텍스트보다 우선해 해당 메뉴의 일반 제조·서빙 흐름으로 연결. 서빙 대사는 `story` 전체가 아니라 선택된 1~2문장만 사용
- 응답 정렬: 추천 결과, 웰컴드링크, 레시피 사이드바 직접 주문이 공통 `talkingPoints` 선택 규칙을 사용하도록 정리
- 수정: `bar_tend/src/data/cocktail-db.json`, `bar_tend/src/lib/cocktails/database.ts`, `secret-menu.ts`, 추천 응답·웰컴·사이드바·컨트롤러 및 관련 타입·테스트
- 검증: 현재 통합 검증 결과는 위 2026-06-30 항목과 동일

## 2026-06-29 / Codex / Phase 3 선행 DialogueSessionState + Safety Hard Stop 정리
- 내용: 분산된 대화/추천/웰컴/주문/farewell 상태를 `DialogueSessionState` reducer로 통합. 웰컴 피드백은 `served/resolved`에서 파생. safety-alert는 진행 중 작업을 즉시 중단하고 `safetyLocked`로 세션을 종료하며 XYZ/farewell을 실행하지 않음. 미성년자/무알코올 전용 intent·추천 제약·응답·대체 종료 제거
- 검증: lint/check/build 통과, 323/323 tests pass, 메인 JS 450.28 kB (gzip 132.74 kB)

## 2026-06-29 / Codex / Phase 2 Response Pipeline 완료
- 내용: `ResponseDraft`/`assembleResponse` 공통 계약 추가, 템플릿의 expression을 tone으로 분리, 칵테일 데이터 삽입 포매터 이동, 추천·스토리·캐릭터·사이드바 주문 응답을 공통 조립 파이프라인으로 통합
- 검증: lint/check/build 통과, 316/316 tests pass, 메인 JS 450.46 kB (gzip 132.75 kB)

## 2026-06-29 / Claude / kf 중복 제거 + SHAKE_REFERENCE 통일 + switch 패턴 헬퍼 추출 + 테스트 292→313 [a73342f][c82cbc6][4f6c90d]
- 내용: `pattern-utils.ts` 공유 모듈(kf + SHAKE_REFERENCE) 추출; 미사용 export(detectCocktailInfoQuery, detectOrderVerb, DialogueAction) 제거; MOOD_KEYWORD_MAP 데이터화 + detectUserMood map 전환; intent classifier mood 키워드 동기화; SHAKE_REFERENCE 3파일 중복 제거; pickStoryFallback() / resolveFromSubTemplate() 헬퍼로 switch mood/taste/rude 패턴 통일
- 검증: tsc clean, 313/313 tests pass

## 2026-06-29 / DOC-007 / mission_control 파일 축약 + 커밋 해시 보충 [0cce97c]
- 내용: WORK_LOG.md/DECISIONS.md/HANDOVER.md/CURRENT_STATE.md/REFACTORING_LOG.md 5개 파일 축약
- 변경: 각 작업 항목에 `[hash]` 추가, 누락 Phase 1.5~2 항목 기록, 결정표·이슈표에 커밋 컬럼 추가
- 검증: lint/build 통과, git diff --stat 800+/2294-
- 참고: 이 규칙에 따라 커밋 직후 해시를 본 항목에 기록함

## 2026-06-29 / Phase 2 Step 3 / 칵테일 의도 템플릿 시스템 흡수 [024c692]
- 내용: cocktail-aware intent를 template system으로 흡수 (Phase 2 Step 3)
- 검증: lint/build/test 통과

## 2026-06-29 / Phase 2 Step 2 / conversation.ts에 응답 템플릿 맵 적용 [27e8298]
- 내용: use response template map in conversation.ts (Phase 2 Step 2)
- 검증: lint/build/test 통과

## 2026-06-29 / Phase 2 Step 1 / 의도 응답 템플릿 데이터 계층 [4003932]
- 내용: add intent response template data layer (Phase 2 Step 1)
- 검증: lint/build/test 통과

## 2026-06-29 / Phase 1.5 / Action Layer + Conversation Context 통합 [0404c58]
- 내용: integrate action layer and conversation context — 생략 주문/후속 이야기 연결, 명시적 lore/person/media 우선
- 검증: lint/build/test 통과

## 2026-06-26 / 구조보고서 최신화 [ba51121]
- 내용: EXTERNAL_STRUCTURE_REPORT.md 최신화
- 검증: 문서 작업

## 2026-06-26 / lore 및 바 응답 보강 [54ea548]
- 내용: strengthen lore and bar responses
- 검증: lint/build/test 통과

## 2026-06-26 / 대화 액션 컨텍스트 추적 [abe0606]
- 내용: track conversation action context
- 검증: lint/build/test 통과

## 2026-06-26 / 의도 라우팅 컨텍스트 확장 [0e13d0f]
- 내용: expand intent routing context
- 검증: lint/build/test 통과

## 2026-06-26 / 대화 아키텍처 로드맵 기록 [c5ea7aa]
- 내용: docs: record dialogue architecture roadmap
- 검증: 문서 작업

## 2026-06-26 / 좋아 키워드 구분 [4eda0a0]
- 내용: 좋아 키워드 구분 (like/alcohol preference vs cocktail praise)
- 검증: lint/build/test 통과

## 2026-06-26 / 단일화된 IntentClassifier [36374a4]
- 내용: 단일화된 IntentClassifier로 의도 판정 책임 통합, 이중 분류 제거
- 검증: lint/build/test 통과

## 2026-06-26 / XYZ 작별 핸드오프 정책 문서화 [ed2e1a9]
- 내용: docs: update XYZ farewell handoff policy
- 검증: 문서 작업

## 2026-06-26 / 웰컴드링크 접근성 상태 유지 [85d402e]
- 내용: fix: keep welcome drink button accessibility state
- 검증: lint/build/test 통과

## 2026-06-26 / 바 잡담 대화 경로 추가 [bf5a773]
- 내용: feat: add bar small talk dialogue routes
- 검증: lint/build/test 통과

## 2026-06-26 / 레시피 칵테일 데이터 컨텍스트로 주문 [165ab36]
- 내용: fix: order recipe cocktails with data context
- 검증: lint/build/test 통과

## 2026-06-26 / 웰컴드링크 이야깃거리 정렬 [16ca384]
- 내용: fix: align welcome drink talking points
- 검증: lint/build/test 통과

## 2026-06-26 / 스토리 질문을 lore 출처로 라우팅 [de7d303]
- 내용: feat: route story queries to lore sources
- 검증: lint/build/test 통과

## 2026-06-26 / 대화/추천 모드 분리 [382b1c2]
- 내용: feat: split conversation and recommendation modes
- 검증: lint/build/test 통과

## 2026-06-25 / FLOW-004 / 서브 이후 도수 10 도달 시 XYZ 마감 서빙 [16d322a][666d207]
- 내용: 일반 주문/추천 서브 후 누적 도수 ≥ 10이면 XYZ를 마지막 잔으로 서빙하고 Farewell Phase로 이행
- 변경: `shouldServeXyzAfterAlcoholLimit` 추가, XYZ 후 `farewell` 전환, 신규 주문·추천 차단
- 검증: session-flow.test.ts + farewell-replies.test.ts 통과, check 통과

## 2026-06-25 / DOC-006 / 구조 보고서의 작업 로그성 표현 제거 [94f247a]
- 내용: EXTERNAL_STRUCTURE_REPORT.md에서 작업로그성 표현 제거 (REFACTORING_LOG.md 항목 제거, 섹션 11.5 변경)
- 검증: 문서 정리, 코드 변경 없음

## 2026-06-25 / DOC-005 / 외부 구조 보고서에 세션 리팩토링 상태 반영 [94f247a]
- 내용: 구조 보고서에 REF-SESSION-001~002와 Vitest 168/171(3실패) 반영
- 검증: 문서 변경, check/lint/build 통과

## 2026-06-25 / REF-SESSION-001~002 / 세션 컨트롤러 책임 축소 [69175c5][16d322a]
- 내용: 세션 종료 응답 생성(`farewell-replies.ts`)과 주문 종료 단계 판정(`isOrderingClosedPhase`)을 컨트롤러 밖 도메인 모듈로 분리
- 검증: farewell-replies.test.ts + session-flow.test.ts 통과, check/lint/build 통과

## 2026-06-25 / 구조보고서 [94f247a]
- 내용: STRUCTURE_REPORT 업데이트
- 검증: 문서 작업

## 2026-06-25 / 최적화 리팩토링 [c6cd2b7]
- 내용: refactorying for Optimization
- 검증: lint/build/test 통과

## 2026-06-25 / 웰컴드링크/XYZ 문구 개선 [55757a8]
- 내용: refine welcome drink and texts
- 검증: lint/build/test 통과

## 2026-06-25 / XYZ 응답 개선 [666d207]
- 내용: Refine welcome drink and XYZ replies
- 검증: lint/build/test 통과

## 2026-06-25 / 세션 흐름 및 코드 사이드바 복원 [23d641e]
- 내용: Restore session flow and codex sidebar behavior
- 검증: lint/build/test 통과

## 2026-06-24 / 구조보고서 최신화 (2) [4e48afb]
- 내용: STRUCTURE_REPORT newest
- 검증: 문서 작업

## 2026-06-24 / 저장 [f5e67a1]
- 내용: 2026-06-24 save (중간 저장분)
- 검증: lint/build 통과

## 2026-06-24 / 타자기 대화·스프라이트 필터·사이드바 상세/주문 [1c2eeb4]
- 내용: typewriter dialogue, sprite filter unification, sidebar detail/order
- 검증: lint/build/test 통과

## 2026-06-24 / 남은 staged 변경사항 커밋 [8c94c3b]
- 내용: commit remaining staged changes (dialogue renderer, session flow, mission_control)
- 검증: lint/build/test 통과

## 2026-06-24 / DOC-004 / 외부 기획용 구조 보고서 최신화 [4e48afb]
- 내용: 세션 종료 상태머신·칵테일 맵·XYZ·talking_points 반영, Vitest 160개 통과 기록
- 검증: 문서 정합성 수동 검토

## 2026-06-24 / 스프라이트 정렬 수정 [066de42]
- 내용: fix: sprite alignment - vertical head-top + horizontal eye-midpoint 정렬
- 검증: lint/build 통과

## 2026-06-23 / DATA-804 / 칵테일별 이야깃거리 필드 추가 [ced5870]
- 내용: 45개 칵테일 전체에 `talking_points` 2개씩 추가, 타입·변환 계층 연결, 추천 응답에 포함
- 검증: response.test.ts + database.test.ts 통과, check 통과

## 2026-06-23 / DATA-803 / XYZ 칵테일 DB 추가 [ced5870]
- 내용: `cocktail_classic_043` XYZ 추가 (IBA sour/daisy 계열, 공식 출처 미확인으로 source_url 생략)
- 검증: database.test.ts 통과, check 통과

## 2026-06-23 / FLOW-001 / 환상주점 세션 흐름과 XYZ 종료 구조 추가 [ced5870]
- 내용: SESSION_FLOW_SPEC.md 추가 - 닫힌 세션 구조(웰컴→추천→XYZ→Farewell→귀가), 호감도·엔딩 금지, DEC-023 승인
- 검증: 문서 작업, 코드 변경 없음

## 2026-06-23 / LOGIC-001 / 시에스타 임시 배제와 카루아 단독 핵심 로직 정리 [a64f0d9]
- 내용: `SIESTA_EVENTS_ENABLED = false`, CURRENT_LOGIC_FOCUS.md에 카루아 단독 루프 명시
- 검증: check 통과, test 154/154 통과, build 통과

## 2026-06-23 / SPR-006 / 카루아 스프라이트 에셋 구조와 제조 애니메이션 연결 [a64f0d9][066de42]
- 내용: 에셋 → `assets/characters/karua/static/` + `animations/shaker/` + `sprites.ts`, 칵테일 확정 후 `preparing` 상태에서 셰이킹 애니메이션 재생
- 검증: check 통과, build 통과

## 2026-06-22 / DLG-806 / 키워드 규칙 JSON 분리와 persona 보존 [e636175]
- 내용: `keyword-rules.json` 분리, `persona.ts` JSON 전환 취소하고 사용자 작업트리 유지
- 검증: test 154/154 통과, lint/build 통과

## 2026-06-22 / DLG-805 / 추천 질문과 추천 응답 문단 프리셋 전환 [e636175]
- 내용: `text-presets.ts` 추가, 추천 질문 JSON 프리셋 참조 전환, 응답 `[reaction]+[recommend]+[explanation]` 3블록 구조
- 검증: question-engine.test.ts + response.test.ts 통과, test 154/154 통과

## 2026-06-22 / DLG-804 / 일반 대화 입력 연결성 보정 [e636175]
- 내용: 현재 입력에 칵테일명 있을 때만 칵테일 언급 우선, fallback에 현재 입력 포함 전달
- 검증: test 154/154 통과, lint/build 통과

## 2026-06-22 / 수렴 원칙 문서화 [a8b42c1]
- 내용: Document convergence refactor principles (DEC-022)
- 검증: 문서 작업

## 2026-06-19 / RST-416 / 감정 상태와 대사 바리에이션 런타임 연결 보강 [fd86558][ce8cce5]
- 내용: 표정 4종(`annoyed/stern/disappointed/embarrassed`) 허용, `affectState` 역매핑, mood-tired/awkward 라우팅, `any` 캐스팅 제거
- 검증: dialogue-turn.test.ts + engine.test.ts + response.test.ts (60/60) 통과, test 151/151 통과

## 2026-06-19 / RST-415 / 평문 재료 요청 추천 제약 보정 [b618730]
- 내용: 라임즙·레몬즙·민트·소다수 → `preferredIngredients` 추출 및 정규화, 기주 완전일치/재료 포함매칭 분리
- 검증: state.test.ts + question-engine.test.ts (41/41) 통과, test 145/145 통과

## 2026-06-19 / WLC-001 / 1회성 웰컴드링크 버튼과 환영 추천 흐름 [b618730][a3c1c72]
- 내용: 방문당 1회 웰컴드링크 버튼, 접근성 좋은 클래식 후보 선택, 1문항 피드백, 사용 후 버튼 숨김
- 검증: welcome-drink.test.ts + recommendation-ui.test.tsx (14/14) 통과, test 141/141 통과

## 2026-06-19 / DLG-803 / Re:Station 기본 설정과 예외상황 응답 보강 [407d945][269b915]
- 내용: 과음·미성년·무알코올·알레르기·매장정보 한계 응답 추가 (keywords.ts + conversation.ts)
- 검증: engine.test.ts (31/31) 통과, test 133/133 통과

## 2026-06-19 / DLG-802 / 추천 질문 DialogueFlow JSON 계약 [c30ca49][85b6d8f]
- 내용: `dialogueFlow.leadIn/continuation/goal` 계약 추가, 질문별 flow 힌트로 연결
- 검증: question-engine.test.ts (20/20) 통과, test 127/127 통과

## 2026-06-19 / SPR-000 / 스프라이트 작업군 진행도와 가이드 정리 [2c17d7e]
- 내용: SPR-001~005 분할 정리, 카루아 CSS 필터 기반 표정, 시에스타 대사 라벨만 있음
- 검증: 문서 갱신, 코드 변경 없음

## 2026-06-19 / RST-414 / 추천 의도 라우팅과 시에스타 만담 구조 보강 [2aecaf0]
- 내용: 추천 의도→미등록 칵테일보다 먼저 판정, 시에스타 3→4발화(대화권 반환) 구조로 전면 보강
- 검증: input-router.test.ts + siesta-event.test.ts (29/29) 통과, test 125/125 통과

## 2026-06-19 / 시에스타·스프라이트 계획 개선 [2c17d7e]
- 내용: Refine Siesta banter and sprite planning
- 검증: 문서 작업

## 2026-06-18 / DATA-802 / IBA 우선 검색과 레시피 기반 설명 보강 파이프라인 [ce60488]
- 내용: `processRecipeCandidate` - IBA→시그니처→정보부족→출처충돌 분류, 비공식 권위 표현 생성 금지
- 검증: ingestion-pipeline.test.ts (5/5) 통과, test 123/123 통과

## 2026-06-18 / DATA-801 / 관리자 검증 큐와 미확정 칵테일 처리 [ce60488]
- 내용: 큐 open/approved/rejected/archived, unknownCocktail/signatureCandidate/conflictingSearchResult 분리
- 검증: admin-queue-manager.test.ts (11/11) 통과, test 118/118 통과

## 2026-06-18 / DLG-801 / JSON 중심 DialogueTurn 계약 [ce60488]
- 내용: `validateDialogueTurn` 강화, action별 기본 복구 템플릿, 안전·퇴장·취소 조기분기 검증
- 검증: dialogue-turn.test.ts (8/8) 통과, test 113/113 통과

## 2026-06-18 / RST-413 / RST-000 상위 프로그램 상태 정리 [99c2d98]
- 내용: RST-000 MVP DONE, WebLLM·데이터운영 → PROPOSED/DEFERRED 분리
- 검증: 문서 작업, 코드 변경 없음

## 2026-06-18 / RST-412 / mission_control 문서 정합성 정리 [99c2d98]
- 내용: 테스트 수 110개, JS 321.75 kB로 통일, HANDOVER.md/CURRENT_STATE.md 다음작업 최신화
- 검증: 문서 작업

## 2026-06-18 / RST-411 / 기능 검수 및 안전·직접 주문 경계 보완 [2ad13e4]
- 내용: `SAFETY_REDIRECT_REPLY`로 119/112/1393 안내 단일화, 직접주문 시 `resetRecommendation()`, `responseGoal` intent 기준 매핑
- 검증: test 110/110 통과, check/lint/build 통과

## 2026-06-18 / 대화 계약·칵테일 검토 파이프라인 추가 [e41af17]
- 내용: Add dialogue contract and cocktail review pipeline
- 검증: 문서 작업

## 2026-06-18 / MVP 완료 상태 문서화 [99c2d98]
- 내용: Document MVP completion status
- 검증: 문서 작업

## 2026-06-18 / 안전 응답·추천 경계 수정 [2ad13e4]
- 내용: Fix safety response and recommendation boundaries
- 검증: lint/build/test 통과

## 2026-06-17 / RST-410 / MVP 마감 검수 및 안전 응답 개선 [2ad13e4]
- 내용: MVP 8개 성공 기준 코드 리뷰 완료, safety 경로 조기 return 후 1393 안내
- 검증: test 97/97 통과, check/lint/build 통과

## 2026-06-17 / RST-409 / 시에스타 대사 풀 확장 및 다양성 개선 [2aecaf0]
- 내용: 4→7 브랜치, 12→22 대사세트, `siestaRecentKeysRef` 키 기반 중복 방지
- 검증: test 97/97 통과, check/lint/build 통과

## 2026-06-17 / RST-701+RST-407+RST-405 / 통합 검증 [90e196c][2aecaf0][de40d39]
- 내용: 14 modified + 2 untracked 통합 검증
- 검증: tsc 0에러, eslint 0경고, vitest 85/85, build 성공

## 2026-06-17 / RST-408 / 입력 경로별 대사 풀 확장 [90e196c]
- 내용: `routeTags/dialogueState/affectState` 조건 추가, 점수 기반 선택기, 피곤/걱정/축하 무드 등
- 검증: test 85개, check/lint/build 통과

## 2026-06-17 / RST-405 / 시에스타 만담 이벤트 엔진 구현 [2aecaf0]
- 내용: 세션당 최대 2회, 6턴 쿨다운, 추천중·안전·퇴장·취소 금지, 3발화 시퀀스, 화자 라벨
- 검증: test 80개, 수동 검증(Chrome DevTools) 통과

## 2026-06-17 / RST-701 / 브라우저 수동 검증 완료 [de40d39]
- 내용: 선택지 클릭·잘모르겠어요·취소·입장→퇴장·모바일 390px·무알코올·제외재료·소진리셋 모두 통과
- 검증: 브라우저 실제 흐름 통과

## 2026-06-17 / RST-701 / 검수 및 제외 베이스 경계 보강 [de40d39]
- 내용: 제외 재료를 `ingredients` + `base_spirit` 모두에 적용
- 검증: test 74개, check/lint/build 통과

## 2026-06-17 / RST-701 / 엣지 케이스 순수 함수 테스트 확장 [de40d39]
- 내용: alcohol preference, 빈 신호, 도수 필터, 복합 신호 추천 이유, isRecommendationIntent 등 +13
- 검증: test 73개, check/lint/build 통과

## 2026-06-17 / RST-701 / 추천 UI 렌더링 계약 테스트 [de40d39]
- 내용: CocktailCard/ChatInput 서버 렌더링 검증 (react-dom/server)
- 검증: test 61개, check/lint/build 통과

## 2026-06-17 / RST-407 / 입력 경로 기반 대사 트리거 [90e196c]
- 내용: `route/routeTags/dialogueState/affectState` 계약 추가, 경로별 추천 첫 문장 분리
- 검증: test 56개, check/lint/build 통과

## 2026-06-17 / 문서 갱신 [61ad642]
- 내용: mission_control 문서 갱신 (RST-407/405/701/408)
- 검증: 문서 작업

## 2026-06-16 / RST-701 / 재추천 후보 제외 경계 테스트 [ff093a0]
- 내용: `createRecommendationSourcePool(excludedCocktailIds)` 분리, 소진 시 `exhausted` 반환
- 검증: test 51개, check/lint/build 통과

## 2026-06-16 / RST-701 / 추천 취소 텍스트 라우팅 테스트 [ff093a0]
- 내용: `recommendation-cancel` 경로 추가, `취소/추천 그만/그만 물어봐` 처리
- 검증: test 49개, check/lint/build 통과

## 2026-06-16 / RST-702 / 사이드바 부가 패널 지연 로딩 [8c94c3b]
- 내용: RecipeInfoTab + BarMusicTab `React.lazy` 분할 (메인 302kB, 레시피 3.3kB, BGM 2.3kB)
- 검증: test 47개, check/lint/build 통과

## 2026-06-16 / DEC-021-B / FSM 말투와 감정 스프라이트 축 추가 [acfac5f]
- 내용: route(소재)/dialogueState(말투·리듬·애니메이션)/affectState(표정·어조) 3축 분리 명시
- 검증: 문서 작업

## 2026-06-16 / DEC-021 / 입력 경로 기반 대사 트리거 방향 승격 [b652d22]
- 내용: 칵테일 ID→입력 경로 기반 대사 트리거로 방향 전환, RST-407 1순위
- 검증: 문서 작업

## 2026-06-16 / DEC-020 / 칵테일 데이터 확장 정책 정리 [9393bf9]
- 내용: IBA 우선 확장, 관리자 검증 큐, BaaS 방향
- 검증: 문서 작업

## 2026-06-16 / 대화 상태→말투·스프라이트 매핑 [acfac5f]
- 내용: docs: map dialogue states to tone and sprites
- 검증: 문서 작업

## 2026-06-16 / 경로 기반 대화 트리거 우선순위 [b652d22]
- 내용: docs: prioritize route-based dialogue triggers
- 검증: 문서 작업

## 2026-06-16 / 칵테일 DB 확장 정책 기록 [9393bf9]
- 내용: docs: record cocktail DB expansion policy
- 검증: 문서 작업

## 2026-06-15 / RST-403 / 다시 추천받기와 추천 제외 처리 [ff093a0]
- 내용: CocktailCard에 "다시 추천받기" 버튼, `excludedCocktailIds` 추적, 31종 소진 시 리셋
- 검증: test 47개, check/lint/build 통과 (JS 299.33kB)

## 2026-06-15 / 저장 [3ce38c5]
- 내용: 20260615 중간 저장
- 검증: lint/build 통과

## 2026-06-14 / RST-406 / 자연스러운 런타임 응대 적용 [003a5cd]
- 내용: 모든 대화·추천·입퇴장·안내에서 캐릭터 말투 제거, 자연스러운 존댓말 통일
- 검증: test 47개, check/lint/build 통과 (JS 298.41kB)

## 2026-06-14 / RST-402 / 추천 설문 종료 정책 개선 [003a5cd]
- 내용: 점수차 조기종료 제거, 실제 후보 1개만 조기종료, 맡기기 즉시종료
- 검증: test 47개, check/lint/build 통과 (JS 300.68kB)

## 2026-06-14 / DATA-004 / 칵테일 DB 문체·표기 통일 [98b5f74]
- 내용: DB 스키마 1.1.0, 한국어·ml 표기, 설명문 `…칵테일입니다.` 형식, 레거시 영문 우선 제거
- 검증: test 45개, check/lint/build 통과 (JS 301.12kB)

## 2026-06-14 / RST-501 / 추천 JSON 문장 중립화 [003a5cd]
- 내용: 추천 질문 JSON에서 카루아 말투·비유 제거, 선택지·신호는 유지
- 검증: test 44개, check/lint/build 통과 (JS 301.09kB)

## 2026-06-14 / RST-501 / 설문 밖 아무거나 랜덤 추천 [003a5cd]
- 내용: 설문 밖 `아무거나`→랜덤 추천, 설문 중→맡기기, 부정형 오인 방지
- 검증: test 44개, check/lint/build 통과 (JS 301.07kB)

## 2026-06-14 / RST-501 / 아무거나 맡기기 별칭 [003a5cd]
- 내용: `아무거나/그냥 아무거나 골라줘` → 즉시 추천, 부정형 구분
- 검증: test 41개, check/lint/build 통과 (JS 300.43kB)

## 2026-06-14 / RST-501 / 추천 질문 반복 안내 제거 [003a5cd]
- 내용: `(선택하거나 직접 말씀하셔도 돼요)` 제거
- 검증: test 40개, check/lint/build 통과 (JS 300.26kB)

## 2026-06-14 / RST-701 / 저장소 실패 경계 보강 [85b6d8f]
- 내용: localStorage 차단·손상에도 세션 유지, 필드 검증, 기본값 복구, 마이그레이션
- 검증: test 40개, check/lint/build 통과 (JS 300.31kB)

## 2026-06-14 / 추천 설문 개선 [003a5cd]
- 내용: feat(recommendation): refine guided flow
- 검증: lint/build/test 통과

## 2026-06-14 / 샘플 텍스트 변경 [98b5f74]
- 내용: sample text change
- 검증: lint/build 통과

## 2026-06-13 / DISC-001-B / JSON 규모 통제와 역할 분리 논의 [e867bc3]
- 내용: 대사전문 JSON 저장 금지, responseGoal+facts+forbidden 중심 WebLLM 입력, 역할 구분
- 검증: 문서 작업

## 2026-06-13 / DISC-001 / JSON 대화 계약과 미등록 칵테일 발견 논의 [eef6fd6]
- 내용: DialogueTurn JSON 계약 제안, DLG-801/DATA-801/DATA-802 제안
- 검증: 문서 작업

## 2026-06-13 / DEC-018 / 추천 질문 4축 간소화 [c30ca49]
- 내용: 단맛+산미 통합, 5축→4축(맛·도수·탄산·베이스), 롱숏 제외 (120조합, 정확70+최근접50)
- 검증: test 35개, check/lint/build 통과 (JS 299.78kB)

## 2026-06-13 / RST-402 / 확정 후보 조기 추천과 최근접 전용 대사 [c30ca49]
- 내용: 두 취향 주제+1·2위 거리 차이 기반 조기 종료, 최근접 전용 대사 추가
- 검증: test 34개, check/lint/build 통과 (JS 300.03kB)

## 2026-06-13 / DATA-003 / 전체 선택 조합 결과 보장 [3008140]
- 내용: IBA 6종 추가(→31종), 180조합 전수 결과 보장(정확74+최근접106)
- 검증: test 31개, check/lint/build 통과 (JS 299.19kB)

## 2026-06-13 / RST-402 / 질문 선택지 전체 후보 커버리지 [3008140]
- 내용: 베이스 질문 재구성(데킬라/보드카, 브랜디/리큐르/시그니처), 양방향 커버리지 테스트
- 검증: test 29개, check/lint/build 통과 (JS 295.06kB)

## 2026-06-13 / 추천 매칭 개선 [3008140]
- 내용: feat(recommendation): refine cocktail matching
- 검증: lint/build/test 통과

## 2026-06-13 / 대화형 추천 확장 [c30ca49]
- 내용: feat(recommendation): expand guided cocktail flow
- 검증: lint/build/test 통과

## 2026-06-13 / JSON 대화 책임 경계 [e867bc3]
- 내용: docs: bound JSON dialogue responsibilities
- 검증: 문서 작업

## 2026-06-13 / JSON 대화 발견 흐름 제안 [eef6fd6]
- 내용: docs: propose JSON dialogue discovery flow
- 검증: 문서 작업

## 2026-06-13 / 구조 역할 명확화 [0492bc8]
- 내용: refactor(structure): clarify source roles
- 검증: 문서 작업

## 2026-06-13 / WebLLM 연기 [aa790b2]
- 내용: docs: defer WebLLM integration (DEC-015)
- 검증: 문서 작업

## 2026-06-12 / RST-603-A / 카루아 한국어 모델 평가 기반 구축 [aa790b2]
- 내용: Qwen·Gemma 평가세트 16사례, 자동 하드실패 판정기, 수동 채점 계약
- 생성: `karua-evaluation-set.json`, `karua-evaluation.ts`, `WEBLLM_EVALUATION.md`
- 검증: test 19개, lint/check/build 통과

## 2026-06-12 / RST-503 / Re:Station 시각 개편 [8d6a908][112bfd8]
- 내용: 다크브라운/골드 + 보라 언더톤·네온·명암비 레이어링, 사이드바 시안/핑크→골드/퍼플
- 검증: test 15개, build/lint 통과 (JS 282.20kB)

## 2026-06-12 / RST-203 / 추천 입력과 근거 모델 확장 [22ca0e8]
- 내용: 추천 상태·신호·질문이력·근거 객체, 기분/상황/맛/도수/무알코올/제외재료 구조화
- 검증: test 15개, lint/check/build 통과 (JS 281.19kB)

## 2026-06-12 / RST-302 / 타이머, 로딩, 오류 상태 통합 [cbc04aa]
- 내용: 관리형 타이머 레지스트리, `idle/processing/typing/exiting` 단일 상태
- 검증: test 11개, lint/check/build 통과 (JS 275.99kB)

## 2026-06-12 / DOC-002 / 작업자 AI 모델명 기록 규칙 [75aeeed]
- 내용: 작업자 항목에 실제 AI 모델명 기록 규칙 통일
- 검증: 문서 작업

## 2026-06-12 / RST-301 / 애플리케이션 로직 분리 [9c37666]
- 내용: App.tsx → `useRecommendationSession`(추천) + `useRestationController`(메시지·표정·도감)
- 검증: test 9개, lint/check/build 통과 (JS 275.26kB)

## 2026-06-12 / PLAN-006 / 단계적 대화형 추천 질문 계약 [075c196]
- 내용: WebLLM 전후 추천 질문 책임 분리 계약
- 검증: 문서 작업

## 2026-06-12 / 앱 세션 훅 분리 [9c37666]
- 내용: refactor: separate application session hooks
- 검증: lint/build/test 통과

## 2026-06-12 / 단계적 추천 질문 정의 [075c196]
- 내용: docs: define staged recommendation questions
- 검증: 문서 작업

## 2026-06-11 / RST-404 / 카루아 상세 계약 감사 및 안전 경계 보강 [bc23714]
- 내용: 직접위로·정답형 수정, 자해 우선처리, 강한 음주 경계, 평가 테스트 5개 추가
- 검증: test 9개, lint/check/build 통과

## 2026-06-11 / DOC-001 / 전면 리팩토링 계획 및 문서 상태 동기화 [8b99390]
- 내용: RST-000 상위프로그램 추가, PLAN-003~005 반영, 일정 재산정, 오래된 표현 제거
- 검증: 문서 정합성 검토, test 4개 통과

## 2026-06-11 / PLAN-005 / 시에스타 난입 및 업무복귀 장면 문법 [6c9631a]
- 내용: IDLE→INTERRUPTING→BANTER→EXITING→COOLDOWN 상태흐름, 업무복귀 발화
- 검증: 문서 작업

## 2026-06-11 / PLAN-004 / 시에스타 만담 이벤트 계약 [c83fa4b]
- 내용: 시에스타=저빈도 만담 이벤트(2~4발화), 발생 금지 구간, 대화권 반환
- 검증: 문서 작업

## 2026-06-11 / PLAN-003 / 검색 우선순위 및 WebLLM 체감 속도 계약 [dcbbda5]
- 내용: 이름 검색 우선, OpenAI/Ollama→WebLLM 전환, 체감지연 최소화 전략
- 검증: 문서 작업

## 2026-06-11 / RST-201+RST-202 / 칵테일 데이터 계약 통합 및 검증 강화 [dcbbda5]
- 내용: 단일 `CocktailData` 컬렉션, `toLegacyCocktail()` 제거, 번들 593→276kB, 불용 openai/ollama 제거
- 검증: test 3개, lint/check/build 통과

## 2026-06-11 / PLAN-002 / 캐릭터 대화 설계 계약 반영 [c83fa4b]
- 내용: `CHARACTER_DESIGN.md` 생성, 발화 알고리즘·금지패턴·관계성·검수 기준
- 검증: 문서 작업

## 2026-06-11 / RST-101-1 / 한국어 문자열 손상 전수 조사 [d5a0ea5]
- 내용: 38개 소스 파일 전수조사 → **손상 없음**, PowerShell 디코딩 오인 확인
- 검증: 각 파일 직접 읽기 및 패턴 검색

## 2026-06-11 / RST-401 / 카루아 규칙 기반 대화 응답 엔진 [bc23714]
- 내용: keywords.ts(12규칙), conversation.ts(30+템플릿), App.tsx 환영/작별/추천 카루아 말투 적용
- 검증: test 통과, lint/check/build 통과

## 2026-06-11 / HANDOVER: 강제 푸시 금지 규칙 추가 [a80d4ce]
- 내용: HANDOVER: 강제 푸시 금지 규칙 추가
- 검증: 문서 작업

## 2026-06-11 / HANDOVER: 다중 PC 동기화 절차 추가 [e304716]
- 내용: HANDOVER: 다중 PC 동기화 절차 추가
- 검증: 문서 작업

## 2026-06-11 / gitignore 통일 및 중첩 저장소 정리 [d5a0ea5]
- 내용: gitignore 통일 및 중첩 저장소 정리
- 검증: lint/build 통과

## 2026-06-11 / Re:Station 카루아 MVP 초기 셋업 [221b006]
- 내용: Re:Station 카루아 MVP 초기 셋업 (최초 커밋)
- 검증: lint/build 통과

---

## 작성 규칙
- 작업 종료 시 최신 로그를 위에 추가한다.
- 수정 또는 생성 파일은 경로를 명시한다.
- 각 작업 항목에 해당 커밋 해시를 `[hash]` 형태로 기록한다.
- **커밋 발생 시** 해당 커밋 해시(`git rev-parse --short HEAD`)와 커밋 메시지(`git log -1 --format=%s`)를 작업 항목에 즉시 기록한다.
- 사용자가 직접 커밋한 경우, 나중에 `git log --oneline --after=<날짜>`로 히스토리를 조회해 `[hash]`를 보충할 수 있다.
