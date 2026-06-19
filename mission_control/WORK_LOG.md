# 작업 이력

## 2026-06-19 / SPR-000 / 스프라이트 작업군 진행도와 가이드 정리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-19 |
| 작업 ID | SPR-000 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | WebLLM 후속 논의보다 카루아·시에스타 스프라이트 작업을 우선 검토하기로 방향을 바꾸고, 스프라이트 작업군의 진행도와 착수 가이드를 `mission_control`에 정리했다. |
| 진행도 | 만담 개편은 RST-414로 DONE. 스프라이트 구현은 아직 PROPOSED 단계이며 `SPR-001~005`로 분리했다. 현재 카루아는 단일 `character.png`와 CSS 필터 기반 표정만 사용하고, 시에스타는 대사 라벨만 있으며 무대 스프라이트는 없다. |
| 작업 가이드 | `SPR-001`에서 카루아/시에스타 표정 슬롯과 파일명 계약을 먼저 고정한다. `SPR-002`는 기존 `Expression`과 `BartenderSprite`를 실제 이미지 매핑으로 바꾸고, `SPR-003`은 시에스타를 이벤트 중에만 표시하는 컴포넌트를 만든다. `SPR-004`는 대사 텍스트 파싱이 아니라 구조화된 `spriteCue`/`stageDirection`으로 난입·발화·퇴장·카루아 반환을 연결한다. `SPR-005`는 최종 에셋 제작·정리 기준이며 `SPR-001` 이후 병행 가능하다. 권장 에셋 경로는 `bar_tend/src/assets/characters/karua/`, `bar_tend/src/assets/characters/siesta/`이다. |
| 수정 파일 | `mission_control/TASK_BOARD.md`, `mission_control/CURRENT_STATE.md`, `mission_control/HANDOVER.md`, `mission_control/WORK_LOG.md` |
| 검증 | 문서 갱신 작업. 코드 변경 없음. 직전 RST-414 검증 기준은 Vitest 125개, check, lint 통과 |

## 2026-06-19 / RST-414 / 추천 의도 라우팅과 시에스타 만담 구조 보강

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-19 |
| 작업 ID | RST-414 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 자연어 추천 요청이 미등록 칵테일 문의로 오분류되는 문제를 수정하고, 시에스타 만담이 불쑥 끼어든 뒤 자기 말만 하고 사라지는 느낌을 줄이도록 대사 구조를 보강했다. |
| 주요 변경 사항 | `routeUserInput`에서 알려진 칵테일명 탐지 이후 추천 의도를 미등록 칵테일 추출보다 먼저 판정하도록 순서를 조정했다. `다음잔은 추천을 받을래` 같은 입력은 이제 추천 흐름으로 들어간다. 시에스타 이벤트는 기존 `시에스타 → 카루아 → 시에스타 퇴장` 3발화에서 `시에스타 → 카루아 → 시에스타 퇴장 → 카루아 대화권 반환` 4발화 구조로 변경했다. 모든 브랜치 대사를 직전 맥락을 받아 짧게 참견하고, 카루아가 손님과의 기존 대화로 다시 이어받는 형태로 전면 수정했다. 시에스타는 인사나 독백 대신 관찰·보충·주의를 던지고, 카루아는 이를 가볍게 받아친 뒤 손님에게 다시 대화권을 돌려준다. |
| 수정 파일 | `bar_tend/src/lib/dialogue/input-router.ts`, `bar_tend/src/lib/dialogue/input-router.test.ts`, `bar_tend/src/lib/banter/siesta-event.ts`, `bar_tend/src/lib/banter/siesta-event.test.ts`, `mission_control/WORK_LOG.md` |
| 검증 | `npm.cmd test -- input-router.test.ts --run` 통과(11/11), `npm.cmd test -- siesta-event.test.ts input-router.test.ts --run` 통과(29/29), `npm.cmd run check` 통과, `npm.cmd test` 통과(125/125), `npm.cmd run lint` 통과 |

## 2026-06-18 / DATA-802 / IBA 우선 검색과 레시피 기반 설명 보강 파이프라인

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | DATA-802 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 칵테일 추가 후보를 IBA 공식 레코드, 시그니처 검증 큐, 정보 부족 큐, 출처 충돌 큐로 분류하는 순수 판정 파이프라인을 구현했다. |
| 주요 변경 사항 | `processRecipeCandidate`를 추가해 IBA URL과 공식 분류가 모두 유효한 후보만 정식 `CocktailRecord`로 정규화한다. 비공식 시그니처 후보는 레시피와 재료가 있어도 관리자 검증 큐로 보내며, 정보 부족과 출처 충돌 항목은 자동 선택 없이 각각 unknown/conflict 큐로 이관한다. 비공식 후보에는 공식·정통·클래식 같은 권위 표현을 생성하지 않는 회귀 테스트를 추가했다. |
| 수정 파일 | `bar_tend/src/lib/cocktails/ingestion-pipeline.ts`, `bar_tend/src/lib/cocktails/ingestion-pipeline.test.ts`, `bar_tend/src/lib/cocktails/cocktail-db.ts`, `mission_control/*` |
| 검증 | `npm.cmd test -- ingestion-pipeline.test.ts --run` 통과(5/5), `npm.cmd test` 통과(123/123), `npm.cmd run check` 통과, `npm.cmd run lint` 통과, `npm.cmd run build` 통과(메인 JS 324.87 kB) |

## 2026-06-18 / DATA-801 / 관리자 검증 큐와 미확정 칵테일 처리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | DATA-801 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 자동 검색이나 현재 DB로 확정하지 못한 칵테일을 정식 추천 후보가 아니라 관리자 검증 큐로 분리하는 운영 경계를 구현했다. |
| 주요 변경 사항 | 큐 상태를 `open/approved/rejected/archived`로 확장하고 `unknownCocktail`, `signatureCandidate`, `conflictingSearchResult` 등록 함수를 분리했다. 미확정·출처 충돌 항목은 승인할 수 없고, 레시피와 재료가 있는 시그니처 후보만 승인 후 승격 준비 후보로 노출된다. 큐 조회 결과는 복사본으로 반환해 외부에서 내부 상태를 변형하지 못하게 했다. |
| 수정 파일 | `bar_tend/src/types/admin-queue.ts`, `bar_tend/src/lib/cocktails/admin-queue-manager.ts`, `bar_tend/src/lib/cocktails/admin-queue-manager.test.ts`, `mission_control/*` |
| 검증 | `npm.cmd test -- admin-queue-manager.test.ts --run` 통과(11/11), `npm.cmd test` 통과(118/118), `npm.cmd run check` 통과, `npm.cmd run lint` 통과, `npm.cmd run build` 통과(메인 JS 324.88 kB) |

## 2026-06-18 / DLG-801 / JSON 중심 DialogueTurn 계약

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | DLG-801 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 대화 의미, 다음 행동, 상태 변경을 검증 가능한 `DialogueTurn` JSON 계약으로 다루도록 런타임 검증과 기본 복구 템플릿을 보강했다. |
| 주요 변경 사항 | `validateDialogueTurn`이 intent/action/route/routeTags/statePatch/expression enum, confidence 범위, 필수 문자열과 배열을 검증하도록 강화했다. `buildDialogueTurn`에 action별 기본 복구 템플릿과 confidence/entities 오버라이드를 추가했다. 안전·퇴장·추천 취소·미등록 칵테일 조기 분기는 상태 변경 전에 `DialogueTurn` 검증을 통과하도록 순서를 정리했다. |
| 수정 파일 | `bar_tend/src/types/dialogue-turn.ts`, `bar_tend/src/lib/dialogue/turn-builder.ts`, `bar_tend/src/hooks/useRestationController.ts`, `bar_tend/src/types/dialogue-turn.test.ts`, `mission_control/*` |
| 검증 | `npm.cmd test -- dialogue-turn.test.ts --run` 통과(8/8), `npm.cmd test` 통과(113/113), `npm.cmd run check` 통과, `npm.cmd run lint` 통과, `npm.cmd run build` 통과(메인 JS 324.72 kB) |

## 2026-06-18 / RST-413 / RST-000 상위 프로그램 상태 정리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | RST-413 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | RST-000 상위 프로그램을 MVP 범위 DONE으로 정리하고, WebLLM 및 데이터 운영 확장은 MVP 이후 PROPOSED/DEFERRED 범위로 분리했다. |
| 주요 변경 사항 | `TASK_BOARD.md`의 RST-000 상태를 DONE으로 전환하고 승인된 MVP 잔여 계획을 0일로 정리했다. `CURRENT_STATE.md`와 `HANDOVER.md`의 다음 수행 후보에서 RST-000을 제거하고 DLG-801, DATA-801/DATA-802, WebLLM 재개 논의로 갱신했다. |
| 수정 파일 | `mission_control/TASK_BOARD.md`, `mission_control/CURRENT_STATE.md`, `mission_control/HANDOVER.md`, `mission_control/WORK_LOG.md` |
| 검증 | 문서 검색으로 RST-000이 다음 수행 후보/권장 순서에 남지 않는지 확인. 코드 변경 없음. |

## 2026-06-18 / RST-412 / mission_control 문서 정합성 정리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | RST-412 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | RST-411 커밋 이후 `mission_control` 문서의 현재 상태 수치와 다음 작업 안내를 최신 기준으로 정리했다. |
| 주요 변경 사항 | 현재 기준 테스트 수를 110개로 통일하고, 현재 빌드 메인 JS 크기를 321.75 kB로 반영했다. `HANDOVER.md`의 오래된 다음 작업/권장 순서/검증 기준을 RST-411 이후 상태에 맞게 정리했다. `CURRENT_STATE.md`에 다음 수행 후보를 별도 섹션으로 추가했다. |
| 수정 파일 | `mission_control/CURRENT_STATE.md`, `mission_control/HANDOVER.md`, `mission_control/TASK_BOARD.md`, `mission_control/WORK_LOG.md` |
| 검증 | 문서 내 현재형 수치 검색으로 `97개`, `306.60 kB`, 오래된 권장 순서 잔여 여부 확인. 과거 `WORK_LOG`의 당시 검증 수치는 사실 기록으로 유지했다. |

## 2026-06-18 / RST-411 / 기능 검수 및 안전·직접 주문 경계 보완

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-18 |
| 작업 ID | RST-411 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 완료 기능을 실제 사용자 흐름 기준으로 재검수하고, 안전 응답·직접 주문·DialogueTurn 의미 목표 경계에서 발견한 문제를 보완했다. |
| 검수 항목 | 1) 안전 입력 라우팅과 실제 안내 문구, 2) 안전 응답의 추천/농담 차단, 3) 활성 추천 질문 중 명시적 칵테일 주문, 4) `DialogueTurn.responseGoal` 계약, 5) 관련 회귀 테스트와 빌드 검증 |
| 발견한 문제 | **안전 응답 본문 누락 가능성:** `safety` 라우트에서 `buildDialogueTurn(..., '', 'sympathy')`가 빈 fallback을 그대로 `reply`로 사용할 수 있었다. **직접 주문 후 설문 잔존:** 추천 질문 중 `모히토 한 잔` 같은 명시적 칵테일 주문은 카드 응답을 반환하지만 추천 상태를 닫지 않아 이전 선택지 버튼이 남을 수 있었다. **responseGoal 매핑 오류:** `responseGoalMap`은 intent 키를 갖지만 실제 조회는 input route로 수행되어 기본값으로 흐를 수 있었다. |
| 주요 변경 사항 | `SAFETY_REDIRECT_REPLY`를 추가해 안전 응답 본문을 단일 상수로 관리하고 `119`, `112`, `1393` 안내를 포함했다. `getCocktailResponse`도 같은 안전 문구를 사용하도록 통일했다. `buildDialogueTurn`은 안전 fallback이 비어 있어도 안전 안내를 반환하고, `responseGoal`은 `intent` 기준으로 매핑한다. `useRecommendationSession`의 명시적 칵테일 주문 분기에서 `resetRecommendation()`을 호출해 활성 설문 상태를 종료한다. |
| 수정 파일 | `bar_tend/src/lib/dialogue/turn-builder.ts`, `bar_tend/src/lib/bartender/engine.ts`, `bar_tend/src/hooks/useRecommendationSession.ts`, `bar_tend/src/types/dialogue-turn.test.ts`, `bar_tend/src/lib/bartender/engine.test.ts`, `mission_control/*` |
| 검증 | `npm.cmd test -- --run` 통과(110/110), `npm.cmd run check` 통과, `npm.cmd run lint` 통과, `npm.cmd run build` 통과 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 전체 Vitest | 통과, 110개 |
| 타입 체크 | 통과 |
| 린트 | 통과 |
| 프로덕션 빌드 | 통과, 메인 JS 321.75 kB |

## 2026-06-17 / RST-410 / MVP 마감 검수 및 안전 응답 개선

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-410 |
| 작업자 | deepseek-v4-flash-free |
| 작업 내용 | WebLLM 제외 MVP 전 항목 검수 완료. PROJECT_VISION.md의 MVP 성공 기준 8개 항목을 코드 리뷰로 검증했다. |
| 검수 항목 | 1) 첫 사용자 진입 흐름, 2) 추천 질문 1~3개 범위, 3) 추천 결과 연결성, 4) 카드/대화 분리, 5) 다시 추천받기, 6) WebLLM 불필요, 7) 모바일 대응, 8) 안전·퇴장 처리 |
| 주요 변경 사항 | **안전 응답 처리 버그 수정:** `useRestationController.ts`에서 `inputRoute === 'safety'`일 때 `resetRecommendation()` 후에도 일반 응답 처리로 fallback하던 문제 수정. 조기 `return` 후 `bartenderReply`로 위기 상담 번호(1393) 안내 메시지를 전송하도록 변경. |
| 수정 파일 | `bar_tend/src/hooks/useRestationController.ts`, `mission_control/*` |
| 검증 | `npm.cmd run lint` 통과, `npm.cmd run check` 통과, `npm.cmd test` 97/97 통과, `npm.cmd run build` 통과 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 린트 | 통과 |
| 타입 체크 | 통과 |
| 전체 Vitest | 통과, 97개 |
| 프로덕션 빌드 | 통과, 메인 JS 314.67 kB |

## 2026-06-17 / RST-409 / 시에스타 대사 풀 확장 및 다양성 개선

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-409 |
| 작업자 | deepseek-v4-flash-free |
| 작업 내용 | 시에스타 만담 이벤트의 대사 풀을 4개 브랜치·12개 대사 세트에서 7개 브랜치·22개 대사 세트로 확장했다. 키 기반 중복 방지(`siestaRecentKeysRef`)를 적용해 세션 내 같은 대사 세트 반복을 방지한다. |
| 주요 변경 사항 | **새로운 브랜치 3개 추가:** `celebration`(축하/기념/생일), `sweet`(달콤/디저트), `sad`(슬프/우울/속상). **기존 브랜치 확장:** `recommendation` 1→3세트, `strong` 1→3세트, `tired` 1→4세트, `default` 1→4세트. **중복 방지:** `selectDialogueSet`이 `recentKeys` Set을 받아 최근 사용한 세트를 제외하고 선택, 모두 소진 시 리셋 후 재선택. **컨트롤러:** `siestaRecentKeysRef` 추가, `createSiestaEvent`에 `recentKeys` 전달, 이벤트 발생 시 키 저장 및 임계치 초과 시 리셋. |
| 수정 파일 | `bar_tend/src/lib/banter/siesta-event.ts`, `siesta-event.test.ts`, `src/hooks/useRestationController.ts`, `mission_control/*` |
| 검증 | `npm.cmd run lint` 통과, `npm.cmd run check` 통과, `npm.cmd test` 97/97 통과, `npm.cmd run build` 통과 (메인 JS 314.40 kB) |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 린트 | 통과 |
| 타입 체크 | 통과 |
| 전체 Vitest | 통과, 97개 (siesta-event 5→17개) |
| 프로덕션 빌드 | 통과, 메인 JS 314.40 kB |

## 2026-06-17 / 전체 변경사항 통합 검증

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-701 / RST-407 / RST-405 통합 검증 |
| 작업자 | deepseek-v4-flash-free |
| 작업 내용 | RST-407(입력 경로 기반 대사 트리거), RST-405(시에스타 만담 이벤트), RST-701(테스트 확장+브라우저 검증)의 미커밋 변경사항 전체를 통합 검증. Git status 기준 14개 modified + 2개 untracked 신규 파일 모두 검증. |
| 검증 결과 | `tsc --noEmit` 0 errors, `eslint` 0 warnings, `vitest run` 85/85 passed (10 files), `npm run build` 성공(메인 JS 310.67 kB). |
| 발견한 문제 | 없음. RST-407(response.ts opening line 매칭 + state.ts dialogue context)와 RST-405(siesta-event + controller 연결)가 기존 RST-701 테스트를 전혀 깨지 않음. |

## 2026-06-17 / RST-408 / 입력 경로별 대사 풀 확장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-408 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 첫 문장 대사 풀을 입력 경로뿐 아니라 경로 태그, 장면 상태, 감정 상태 기준으로 확장했다. |
| 주요 변경 사항 | `RecommendationOpeningLine`에 `routeTags`, `dialogueState`, `affectState` 조건을 추가하고, 일치도가 높은 문구를 우선 선택하되 최근 사용 라인은 제외하도록 점수 기반 선택기를 적용했다. 피곤·걱정·축하 무드, 도수 조건, 질문 답변, 선호/제외 재료, 직접 주문 serving, 맡기기/추론 문구를 추가했다. 제외 재료만 있는 요청도 `ingredientOrBaseOrder`로 분류한다. |
| 검증 | `npm.cmd test` 85개, `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build` 통과 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 관련 테스트 | 통과, `response`/`state` 30개 |
| 전체 Vitest | 통과, 85개 |
| 타입 체크 | 통과 |
| 린트 | 통과 |
| 프로덕션 빌드 | 통과 |

## 2026-06-17 / RST-405 / 시에스타 만담 이벤트 엔진 구현

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-405 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 시에스타 저빈도 만담 이벤트 엔진을 추가하고 컨트롤러에 연결했다. |
| 주요 변경 사항 | `createSiestaEvent`로 세션당 최대 2회, 6턴 쿨다운, 추천 진행 중·안전·퇴장·추천 취소 금지 조건을 적용했다. 본 답변 뒤 시에스타-칼루아-시에스타 3발화 시퀀스를 예약하며, 대화창에 `시에스타`/`칼루아` 화자 라벨을 표시한다. |
| 검증 | `npm.cmd run check`, `npm.cmd test` 80개, `npm.cmd run lint`, `npm.cmd run build`, Chrome DevTools Protocol 수동 검증 통과 |
| 수동 검증 | 일반 대화 3턴 후 `시에스타` 2회, `칼루아` 1회, 업무복귀 단어 표시 확인. 안전 입력, 추천 질문 진행 중, 추천 취소, 퇴장, 초기화 구간에서는 시에스타/칼루아 라벨 0회 확인. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 타입 체크 | 통과 |
| 전체 Vitest | 통과, 80개 |
| 린트 | 통과 |
| 프로덕션 빌드 | 통과 |
| 브라우저 수동 검증 | 통과 |

## 2026-06-17 / RST-701 / 브라우저 수동 검증 완료

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | Vite dev 서버와 headless Chrome DevTools Protocol을 사용해 HANDOVER의 남은 수동 검증 항목을 실제 브라우저 흐름으로 확인했다. |
| 검증 항목 | 선택지 클릭, `잘 모르겠어요`, 추천 질문 취소, 입장→자유 대화→추천 질문→추천 카드→다시 추천받기→퇴장, 모바일 폭 선택지 줄바꿈/스크롤, 무알코올 오류 메시지, 제외 재료 결과, 모든 후보 소진 리셋 안내 |
| 결과 | 모두 통과. 모바일 390px 폭에서 선택지는 2줄로 줄바꿈되며 가로 오버플로 없음. 모든 후보 소진 시 `모든 칵테일을 이미 추천해 드렸네요. 처음부터 다시 골라볼게요.` 안내가 표시됨. |
| 참고 | 후보 소진 검증은 실제 버튼 흐름을 유지하되 검증 시간을 줄이기 위해 브라우저 로드 전 `setTimeout`을 0ms로 줄인 상태에서 반복했다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 브라우저 실제 클릭 흐름 | 통과 |
| 모바일 390px 배치 | 통과 |
| 무알코올 요청 | 통과 |
| 제외 재료 요청 | 통과 |
| 모든 후보 소진 리셋 | 통과 |

## 2026-06-17 / RST-701 / 검수 및 제외 베이스 경계 보강

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | RST-701 테스트 보강분을 검수하고, 제외 재료가 재료 목록뿐 아니라 `base_spirit`에도 적용되도록 추천 필터 경계를 보강했다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/state.ts`, `state.test.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `filterCocktailsByRecommendationState`와 최근접 복구의 hard constraint에서 제외 재료를 `ingredients`와 `base_spirit` 모두에 적용한다. 재료 목록에는 없지만 베이스가 `진`인 후보도 `진 제외` 요청에서 걸러지는 회귀 테스트를 추가했다. |
| 발견한 문제 | 기존 제외 재료 필터는 현재 데이터에서는 대체로 통과하지만, 향후 데이터 정규화 과정에서 재료 목록과 베이스 필드가 어긋나면 베이스 제외 요청이 누락될 수 있었다. |
| 후속 작업 제안 | 브라우저 연결 가능 환경에서 선택 버튼 클릭, 추천 완료 카드, 다시 추천받기, 모바일 배치를 수동 확인한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 74개 |
| `npm.cmd run build` | 통과, 메인 JS 306.60 kB, 레시피/BGM 별도 chunk 유지 |

## 2026-06-17 / RST-701 / 엣지 케이스 순수 함수 테스트 확장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-701 |
| 작업자 | deepseek-v4-flash-free |
| 작업 내용 | 추천 상태, 응답, 질문 엔진의 미커버 엣지 케이스를 순수 함수 테스트로 추가했다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/state.test.ts`, `response.test.ts`, `question-engine.test.ts`, `mission_control/WORK_LOG.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `TASK_BOARD.md` |
| 주요 변경 사항 | **state.test.ts (+6):** alcohol preference(high/low/medium) 추출, 빈 신호 반환, low/high 도수 필터, 복합 신호 buildRecommendationReasons, answerLatestQuestion. **response.test.ts (+3):** selectRecommendationOpening 전 라인 최근 시 fallback, formatRecommendationReply acknowledgement 우선, formatRandomRecommendationReply custom opening. **question-engine.test.ts (+3):** isRecommendationIntent 의도/비의도 판별, pickFromPool 취향 기반 선택, formatQuestion null acknowledgement 기본 문구. |
| 발견한 문제 | `ingestTasteSignals`(question-engine.ts)와 `formatQuestion`의 null acknowledgement 경로는 테스트가 없었고, `selectRecommendationOpening`은 모든 라인이 최근일 때 첫 라인으로 fallback하는 동작이 미검증이었다. |
| 후속 작업 제안 | 브라우저 연결 가능 환경에서 선택 버튼 클릭, 추천 완료 카드, 다시 추천받기, 모바일 배치를 수동 확인한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 73개 |
| `npm.cmd run build` | 통과 |

## 2026-06-17 / RST-701 / 추천 UI 렌더링 계약 테스트

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 완료 UI와 선택 질문 UI가 주요 버튼과 안내를 계속 렌더링하는지 서버 렌더링 기반 테스트를 추가했다. |
| 수정 파일 | `bar_tend/src/components/bar/recommendation-ui.test.tsx`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `CocktailCard`의 상세 정보와 `다시 추천받기` 버튼, `ChatInput`의 선택지·`잘 모르겠어요`·추천 질문 취소·비활성 입력 상태를 검증한다. 질문이 없을 때 추천 전용 컨트롤이 숨겨지는지도 보호한다. |
| 발견한 문제 | 현재 테스트 환경에는 React Testing Library가 없어 실제 클릭 이벤트 시뮬레이션 대신 `react-dom/server` 렌더링 계약을 우선 보호했다. |
| 후속 작업 제안 | 브라우저 연결 가능 환경에서 선택 버튼 클릭, 추천 완료 카드, 다시 추천받기, 모바일 배치를 수동 확인한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 61개 |
| `npm.cmd run build` | 통과, 메인 JS 306.54 kB, 레시피/BGM 별도 chunk 유지 |

## 2026-06-17 / RST-407 / 입력 경로 기반 대사 트리거

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-17 |
| 작업 ID | RST-407 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 결과에 도달한 입력 경로를 `RecommendationDecision`에 저장하고, 경로별 추천 대사와 감정 기반 표정 매핑을 연결했다. |
| 수정 파일 | `bar_tend/src/types/recommendation.ts`, `src/lib/recommendation/state.ts`, `src/lib/recommendation/response.ts`, `src/hooks/useRecommendationSession.ts`, `src/lib/recommendation/state.test.ts`, `src/lib/recommendation/response.test.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `route`, `routeTags`, `dialogueState`, `affectState` 계약 추가. 감정·무드, 취향, 재료·베이스, 직접 주문, 랜덤 추천 경로를 분리하고 추천 첫 문장 풀을 최근 사용 라인에서 제외한다. `affectState`는 기존 `Expression`으로 매핑해 화면 표정에 반영한다. |
| 발견한 문제 | 현재 런타임은 자연스러운 존댓말 응대 정책을 유지하므로, 대사 풀은 캐릭터 말투 확장이 아니라 중립 추천 문구의 경로 분리로 구현했다. |
| 후속 작업 제안 | 추천 완료 UI와 재추천 흐름을 테스트 가능한 경계로 더 분리하고, RST-405 시에스타 이벤트 조건 구현으로 넘어간다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 56개 |
| `npm.cmd run build` | 통과, 메인 JS 306.54 kB, 레시피/BGM 별도 chunk 유지 |

## 2026-06-16 / RST-701 / 재추천 후보 제외 경계 테스트

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 다시 추천받기 흐름의 핵심인 중복 추천 제외와 전체 후보 소진 리셋 조건을 테스트 가능한 순수 경계로 분리했다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `src/hooks/useRecommendationSession.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `createRecommendationSourcePool(excludedCocktailIds)`를 추가해 세션 내 이미 추천된 칵테일을 후보군에서 제외한다. 모든 후보가 제외되면 `exhausted`를 반환하고, 훅은 기존처럼 제외 목록을 리셋한 뒤 안내 메시지를 출력한다. |
| 발견한 문제 | 재추천 제외 정책은 훅 내부 상태 로직에만 있어 React 훅 없이 직접 검증하기 어려웠다. |
| 후속 작업 제안 | 추천 완료 UI와 카드 표시, 다시 추천 버튼 클릭 흐름을 브라우저 또는 컴포넌트 테스트 경계로 보호한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 51개 |
| `npm.cmd run build` | 통과, 메인 JS 302.75 kB, 레시피/BGM 별도 chunk 유지 |

## 2026-06-16 / RST-701 / 추천 취소 텍스트 라우팅 테스트

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 활성 추천 질문 중 버튼이 아니라 텍스트로 취소 의사를 입력해도 추천 질문을 종료하도록 입력 라우팅과 컨트롤러를 보강했다. |
| 수정 파일 | `bar_tend/src/lib/dialogue/input-router.ts`, `input-router.test.ts`, `src/hooks/useRestationController.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `recommendation-cancel` 입력 경로 추가. 활성 추천 중 `취소`, `추천 그만`, `그만 물어봐`를 추천 취소로 처리하고, 컨트롤러는 기존 버튼 취소와 같은 복구 메시지로 추천 상태를 초기화한다. 안전 입력은 추천 취소보다 우선한다. |
| 발견한 문제 | 기존 취소 흐름은 UI 버튼으로만 연결되어 텍스트 입력 회귀 테스트로 보호되지 않았다. |
| 후속 작업 제안 | 추천 완료와 다시 추천받기 흐름을 테스트 가능한 경계로 더 분리한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 49개 |
| `npm.cmd run build` | 통과, 메인 JS 302.65 kB, 레시피/BGM 별도 chunk 유지 |

## 2026-06-16 / RST-702 / 사이드바 부가 패널 지연 로딩

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | RST-702 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 의존성이 낮은 번들 최적화 작업으로 레시피 정보 탭과 BGM 탭을 초기 메인 번들에서 분리했다. |
| 수정 파일 | `bar_tend/src/components/sidebar/Sidebar.tsx`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `RecipeInfoTab`과 `BarMusicTab`을 `React.lazy`와 `Suspense`로 지연 로딩한다. 탭 선택 전에는 레시피 검색 코드와 유튜브 플레이어 탭 코드가 별도 chunk로 분리된다. |
| 측정 결과 | 기존 `dist/assets/index-DCWhaZJu.js` 306.04 kB. 변경 후 `dist/assets/index-DPxVx6W7.js` 302.22 kB, `RecipeInfoTab-WAfFvT0E.js` 3.32 kB, `BarMusicTab-e9Jg6tBS.js` 2.28 kB. 칵테일 DB 31.57 kB와 추천 질문 JSON 5.71 kB는 초기 추천 흐름에 필요하므로 유지한다. |
| 발견한 문제 | PowerShell 실행 정책으로 `npm run check`와 `npm run lint`가 차단되어 기존 프로젝트 절차대로 `npm.cmd`를 사용했다. |
| 후속 작업 제안 | 브라우저에서 레시피/BGM 탭 첫 진입 시 Suspense fallback이 자연스러운지 수동 확인한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, 메인 JS 302.22 kB, 레시피/BGM 별도 chunk 생성 |
| `npm.cmd test` | 통과, Vitest 47개 |

## 2026-06-16 / DEC-021-B / FSM 말투와 감정 스프라이트 축 추가

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | DEC-021-B |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 입력 경로 기반 대사 트리거에 FSM 상태별 말투·발화 리듬·애니메이션과 감정 상태별 표정 스프라이트 축을 추가했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `route`는 대화 소재, `dialogueState`는 장면 말투·리듬·애니메이션, `affectState`는 감정 표정 스프라이트와 세부 어조를 담당하도록 3축 분리를 명시했다. |
| 결정 내용 | FSM 상태는 대화 소재를 덮어쓰지 않고 말투와 동작만 조정한다. 감정 상태는 스프라이트와 세부 어조를 고르며, 칵테일 ID는 제조·서빙 대사의 변수로만 결합한다. |
| 후속 작업 제안 | RST-407 구현 시 `route`, `routeTags`, `dialogueState`, `affectState` 타입과 기본 매핑표를 먼저 만들고, 기본 스프라이트와 no-repeat 회귀 테스트를 함께 추가한다. |

## 2026-06-16 / DEC-021 / 입력 경로 기반 대사 트리거 방향 승격

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | DEC-021 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 칵테일 ID가 아니라 사용자가 결과에 도달한 입력 경로가 대화 소재와 대사 풀을 결정하는 방향을 메인 대화 원칙으로 승격했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | DEC-021 추가. 직접 이름 주문, 감정·무드 주문, 취향 추론, 재료·베이스 언급, 랜덤 추천 등 입력 경로 태그를 대사 트리거로 저장하고, 기존 추천 엔진은 결과와 근거 확정 책임을 유지하도록 정리했다. RST-407을 TODO로 추가하고 현재 우선순위 1순위로 올렸다. |
| 결정 내용 | 주문 방식이 대사 풀을 결정하고 칵테일은 제조·서빙 대사의 변수로 결합한다. 최근 N개 대사 제외, FSM 상태별 대사 풀 분리, 입력 경로 태그 필터링을 반복 방지 원칙으로 삼는다. 대사량이 늘어나면 Ink 스크립트의 `shuffle`/`cycle`과 템플릿 변수 치환을 사용한다. |
| 기존 구조와의 결합 | 추천 결과와 근거는 DB·규칙 엔진이 확정한다. 대사 트리거 계층은 확정된 `RecommendationDecision`과 입력 경로 태그를 받아 대사 풀만 선택하며, WebLLM은 재개하더라도 말투 포장만 담당한다. |
| 후속 작업 제안 | RST-407에서 입력 라우터와 추천 결정에 `route`/`routeTags`를 남기는 타입 경계를 정의하고, 작은 TypeScript 대사 풀과 no-repeat 테스트부터 구현한다. |

## 2026-06-16 / DEC-020 / 칵테일 데이터 확장 정책 정리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-16 |
| 작업 ID | DEC-020 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 향후 칵테일 데이터 확장 시 IBA 공식 레시피를 최우선으로 검색하고, 자동으로 확정되지 않는 변형·시그니처·정보 부족 항목은 관리자 검증 큐로 넘기는 정책을 기록했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | DEC-020 추가. DATA-801을 관리자 검증 큐 중심으로 재정의하고, DATA-802를 IBA 우선 검색과 레시피 기반 맛 설명 보강 파이프라인으로 구체화했다. 이후 공통 DB는 필요하지만 유저 간 상호작용은 범위가 아니므로, 도입 시 BaaS 또는 얇은 백엔드로 `official` DB와 관리자 검증 큐만 제공하는 방향을 보강했다. |
| 결정 내용 | 정식 칵테일 DB에는 IBA 공식 또는 관리자 승인 항목만 저장한다. IBA에 없는 변형·시그니처는 확인된 레시피를 기준으로 맛·향·질감 설명만 보강하며, 정보 부족·검색 실패·출처 충돌 항목은 추천 후보로 쓰지 않고 관리자 검증 큐에서 판단한다. |
| 후속 작업 제안 | 외부 DB 도입 시 `adminReview` 큐 스키마, IBA 검색 실패 처리, 설명문 생성 금지 표현 테스트, 일반 사용자 읽기/요청 제출과 관리자 승인 권한을 분리하는 정책을 설계한다. |

## 2026-06-15 / RST-403 / 다시 추천받기와 추천 제외 처리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-15 |
| 작업 ID | RST-403 |
| 작업자 | Claude Code |
| 작업 내용 | 카드 UI에 "다시 추천받기" 버튼을 추가하고, 세션 내 이미 추천한 칵테일을 후보군에서 제외한다. |
| 수정 파일 | `src/hooks/useRecommendationSession.ts`, `src/hooks/useRestationController.ts`, `src/App.tsx`, `src/components/bar/CocktailCard.tsx`, `src/lib/recommendation/question-engine.ts`, `mission_control/*` |
| 주요 변경 사항 | - `useRecommendationSession`에 `excludedCocktailIds` 상태와 `clearExcludedCocktailIds` 함수 추가<br>- `resolveRecommendation` 호출 시 풀에서 이미 추천된 ID 제외<br>- 추천 성공 시 해당 칵테일 ID를 제외 목록에 추가<br>- CocktailCard에 "다시 추천받기" 버튼 추가 (`onReRecommend`)<br>- 나가기/초기화 시 제외 목록 초기화<br>- 전체 추천 소진 시 제외 목록 리셋 후 안내 메시지 출력 |
| 발견한 문제 | `handleReRecommend`가 `handleSend`를 참조해야 하므로 정의 순서에 주의해야 함. |
| 후속 작업 제안 | 재추천 시 기존 취향 정보를 유지할지 새로 수집할지 정책 검토 가능 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 47개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 299.33 kB |

## 2026-06-14 / RST-406 / 자연스러운 런타임 응대 적용

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-406 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 현재 캐릭터가 출력하는 문장에서 고유 말투와 농담은 제거하되 로봇이나 콜센터처럼 들리지 않는 자연스러운 존댓말로 통일한다. |
| 수정 파일 | `bar_tend/src/lib/bartender/conversation.ts`, `keywords.ts`, `engine.ts`, `engine.test.ts`, `src/lib/recommendation/response.ts`, `response.test.ts`, `question-engine.ts`, `state.ts`, `src/hooks/useRecommendationSession.ts`, `useRestationController.ts`, `mission_control/DECISIONS.md`, `ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 일반 대화, 키워드 응답, 추천 결과·근거, 질문 연결, 입퇴장, 초기화, 안전·오류 안내에서 캐릭터 말투와 기계적·콜센터식 표현을 제거하고 실제 직원이 짧게 응대하는 자연스러운 존댓말로 교체했다. `persona.ts`, `prompts.ts`, `CHARACTER_DESIGN.md`의 캐릭터 프롬프트와 예문은 변경하지 않았다. |
| 실패한 시도 | 첫 테스트에서 기존 카루아식 문구를 직접 요구하던 회귀 테스트 6개가 실패해, 말투 미적용과 안전 경계를 검증하는 계약으로 교체했다. |
| 발견한 문제 | 캐릭터 말투가 일반 대화 외에도 추천 근거, 컨트롤러 상태 안내와 오류 메시지에 분산되어 있었다. |
| 후속 작업 제안 | 향후 말투 계층을 연결할 때 중립 원문을 항상 복구 경로로 유지하고 보존된 프롬프트 예문을 평가 세트로 사용한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 47개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| 프롬프트 예문 보존 | `persona.ts`, `prompts.ts`, `CHARACTER_DESIGN.md` 변경 없음 |
| `npm.cmd run build` | 통과, JS 298.41 kB |

## 2026-06-14 / RST-402 / 추천 설문 종료 정책 개선

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-402 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 설문이 점수상 명확한 1위나 정확 일치 실패만으로 너무 빨리 종료되지 않도록 종료 정책과 후보 풀 관리를 개선한다. |
| 수정 파일 | `bar_tend/src/hooks/useRecommendationSession.ts`, `src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `src/lib/recommendation/state.ts`, `state.test.ts`, `mission_control/ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 점수 차 기반 조기 종료를 제거하고 실제 후보가 1개일 때만 조기 종료한다. 누적 답변은 매번 전체 후보군에 적용하며, 정확 일치가 없으면 하드 조건을 지키는 후보군에서 남은 항목을 추가 질문한 뒤 최대 3문항 시점에 최근접 결과를 선택한다. 맡기기만 질문 수와 무관하게 즉시 종료한다. |
| 실패한 시도 | 첫 검증에서 제거된 import와 종료 판정 함수의 미사용 인자가 타입·린트 오류로 발견되어 함수 계약과 호출부를 정리했다. |
| 발견한 문제 | 이전 세션은 좁혀진 후보 풀만 다음 답변에 재사용하고 정확 일치 실패 시 즉시 종료해, 아키네이터처럼 추가 조건으로 최근접 후보를 구분할 수 없었다. |
| 후속 작업 제안 | 실제 사용자 로그를 바탕으로 2문항 시점에 남은 후보 요약을 대화에 노출할지 검토한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 47개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 300.68 kB |

## 2026-06-14 / DATA-004 / 칵테일 DB 문체·표기 통일

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | DATA-004 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 칵테일 DB의 레시피, 재료 목록과 설명문 스타일을 하나의 표시 계약으로 통일한다. |
| 수정 파일 | `bar_tend/src/data/cocktail-db.json`, `src/lib/cocktails/database.ts`, `database.test.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | DB 스키마를 1.1.0으로 올리고 레시피를 한국어·ml 중심 표기로 정리했다. 재료 목록은 DB 레시피에서 수량을 제거해 생성하며, 설명문은 중립적인 한 문장 `…칵테일입니다.` 형식으로 통일했다. 레거시 영문 레시피와 장문 스토리의 우선 표시를 제거했다. |
| 실패한 시도 | 설명문 편차 검색용 `rg` 명령 하나가 PowerShell 인용 문제로 실패해 단순 패턴 검색과 계약 테스트로 재검증했다. |
| 발견한 문제 | 일부 기존 칵테일은 JSON보다 `database.ts`의 레거시 영문 레시피와 장문 스토리가 우선되어 JSON만 수정해서는 화면 스타일이 통일되지 않았다. |
| 후속 작업 제안 | 새 칵테일 추가 시 동일 계약 테스트를 유지하고, 구조화 레시피 필드가 필요해지면 문자열 파싱 대신 별도 배열 스키마로 승격한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 45개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 301.12 kB |

## 2026-06-14 / RST-501 / 추천 JSON 문장 중립화

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 질문 JSON에서 카루아식 말투와 비유를 제거하고 중립적인 질문·선택 확인 문장으로 교체한다. |
| 수정 파일 | `bar_tend/src/data/recommendation-questions.json`, `src/lib/recommendation/question-engine.test.ts`, `mission_control/ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 선택지 라벨과 구조화 신호는 유지하고 `prompt`, `acknowledgement`만 중립화했다. 칵테일 카드용 `cocktail-db.json` 설명은 변경하지 않았다. |
| 실패한 시도 | 없음 |
| 발견한 문제 | 추천 JSON의 문장이 데이터 계약과 캐릭터 표현을 동시에 담당해 향후 말투 계층 분리가 어려웠다. |
| 후속 작업 제안 | 캐릭터 말투가 필요한 지점은 JSON 원문을 변경하지 않고 표현 계층에서 포장한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 44개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 301.09 kB |

## 2026-06-14 / RST-501 / 설문 밖 아무거나 랜덤 추천

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 활성 추천 질문이 없을 때 `아무거나` 표현을 설문 시작 없이 즉시 랜덤 추천으로 처리한다. |
| 수정 파일 | `bar_tend/src/lib/dialogue/input-router.ts`, `input-router.test.ts`, `src/hooks/useRecommendationSession.ts`, `useRestationController.ts`, `src/lib/recommendation/response.ts`, `response.test.ts`, `mission_control/ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 설문 밖 긍정형 `아무거나`는 전체 DB 랜덤 추천으로 분기하고, 설문 중에는 이전 답변을 반영한 맡기기로 유지한다. `아무거나 말고`, `아무거나는 싫어` 같은 부정형은 랜덤 추천으로 오인하지 않는다. |
| 실패한 시도 | 없음 |
| 발견한 문제 | 같은 `아무거나` 표현도 활성 추천 상태 유무에 따라 의미가 달라 입력 라우터에서 명시적으로 분기할 필요가 있었다. |
| 후속 작업 제안 | 랜덤 추천에서 직전에 제공한 칵테일을 제외하는 재추천 정책은 `RST-403`에서 함께 검토한다. |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 44개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 301.07 kB |

## 2026-06-14 / RST-501 / 아무거나 맡기기 별칭

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 활성 추천 질문에서 `아무거나` 표현을 `카루아에게 맡기기`와 같은 즉시 추천 의도로 파싱한다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `mission_control/ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `아무거나`, `그냥 아무거나 골라줘`는 기존 추천 상태를 유지한 채 질문을 종료하고, `아무거나 말고` 같은 부정형은 맡기기로 오인하지 않는다. |
| 실패한 시도 | 없음 |
| 발견한 문제 | 사용자가 자연스럽게 `아무거나`라고 답하면 기존에는 일반 자유 입력으로 처리되어 다음 질문이 이어졌다. |
| 후속 작업 제안 | 추천 질문 선택·취소·완료 흐름 테스트에서 자연어 맡기기 별칭을 포함할 것 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 41개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 300.43 kB |

## 2026-06-14 / RST-501 / 추천 질문 반복 안내 제거

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 선택지 버튼과 텍스트 입력창이 이미 보이는 추천 질문에서 반복 조작 안내 문구를 제거했다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `mission_control/CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 질문 포맷은 직전 반응과 질문 문구만 출력한다. 선택지와 자유 입력 기능은 그대로 유지하고, 안내 문구가 다시 추가되지 않도록 회귀 테스트를 수정했다. |
| 실패한 시도 | 없음 |
| 발견한 문제 | `(선택하거나 직접 말씀하셔도 돼요)`가 모든 질문마다 반복되어 대화 리듬을 끊고 설문 느낌을 강화했다. |
| 후속 작업 제안 | 브라우저에서 안내문 제거 후 질문과 선택지 사이 여백을 수동 확인 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 40개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 300.26 kB |

## 2026-06-14 / RST-701 / 저장소 실패 경계 보강

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-14 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 브라우저 저장소가 차단되거나 저장 데이터가 손상돼도 손님 세션과 도감 흐름이 중단되지 않도록 저장 모듈을 보강하고 회귀 테스트를 추가했다. |
| 수정 파일 | `bar_tend/src/lib/storage/guest-session-store.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | `bar_tend/src/lib/storage/storage.test.ts` |
| 주요 변경 사항 | 세션 저장 실패 예외 흡수, 취향·감정·최근 주제·교환 횟수 필드 검증, 손상 데이터 기본값 복구, 이전 저장 키 마이그레이션과 읽기·쓰기 차단 테스트 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 도감 저장은 localStorage 쓰기 실패를 흡수했지만 손님 세션 저장은 예외를 전파해 대화 입력과 밤 초기화를 중단시킬 수 있었다. |
| 후속 작업 제안 | 추천 질문 선택·취소·완료 흐름을 테스트 가능한 순수 경계로 분리하고 회귀 테스트 추가 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 40개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 300.31 kB |

## 2026-06-13 / DISC-001-B / JSON 규모 통제와 역할 분리 논의

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DISC-001-B |
| 작업자 | GPT-5 Codex |
| 작업 내용 | JSON 중심 대화 구조가 방대해지는 것을 막기 위한 최소 계약과 검색 API·코드·WebLLM 역할 분리를 기존 논의에 추가했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `TASK_BOARD.md`, `HANDOVER.md`, `CURRENT_STATE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 대사 전문 JSON 저장 금지, `responseGoal + facts + forbidden` 중심 WebLLM 입력, 전체 대화 대신 상태 요약 전달, 소수 기본 템플릿 복구, 검색 API·코드·WebLLM 책임 구분 |
| 결정 상태 | 논의 중. DLG-801/DATA-802 승인 시 완료 조건에 반영할 제안 |
| 실패한 시도 | 없음 |
| 검증 | 문서 간 역할 경계와 작업 상태 대조, `git diff --check` 예정 |
| 후속 작업 제안 | DLG-801 설계 시 JSON Schema 예시와 최대 필드·컨텍스트 크기 예산을 명시 |

## 2026-06-13 / DISC-001 / JSON 대화 계약과 미등록 칵테일 발견 논의

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DISC-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 대화 중심 제품에서 향후 LLM 부담을 줄이기 위한 JSON 대화 계약과 미등록 칵테일 발견·외부 출처 보강 흐름을 논의 주제 및 제안 작업으로 기록했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `TASK_BOARD.md`, `HANDOVER.md`, `CURRENT_STATE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | `DialogueTurn` JSON 계약 제안, 발견·검수·공식 상태 분리, 검수 전 추천 금지, 외부 API·AI와 WebLLM 역할 경계, DLG-801/DATA-801/DATA-802 제안 작업 추가 |
| 결정 상태 | 논의 중. MVP 이후 작업이며 JSON 스키마, 저장소, 외부 API와 출처 검증 정책 확정 전에는 구현하지 않는다. |
| 실패한 시도 | 없음 |
| 검증 | 문서 간 작업 ID와 상태 대조, `git diff --check` 예정 |
| 후속 작업 제안 | DLG-801 설계 시 입력 라우터와 추천 상태 사이의 JSON 스키마부터 정의 |

## 2026-06-13 / DEC-018 / 추천 질문 4축 간소화

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DEC-018 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 현재 질문 분류와 맛·도수·탄산 및 질감·롱숏·베이스 기준표를 비교하고, DB와 UX에 맞는 4축 질문 구조로 개편했다. |
| 수정 파일 | `bar_tend/src/data/recommendation-questions.json`, `src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `mission_control/DECISIONS.md`, `PROJECT_VISION.md`, `ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 단맛·산미 질문을 맛과 풍미 질문으로 통합, 맛 질문 첫 순서 우선, 탄산 질문을 마시는 느낌 중심으로 표현, 롱·숏 질문 제외 |
| 비교 결과 | 기존 5축은 180조합 중 정확 일치 74개·최근접 106개, 새 4축은 120조합 중 정확 일치 70개·최근접 50개다. |
| 제외 근거 | 롱·숏 드링크는 현재 DB에 검수된 독립 필드가 없고 탄산·도수와 의미가 겹치며 초심자에게 전문 용어다. |
| 실패한 시도 | 없음 |
| 후속 작업 제안 | 향후 `serving_style`과 질감 데이터를 전 칵테일에 검수해 추가한 뒤 별도 질문의 정보 이득을 재평가할 것 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| 전체 조합 감사 | 120개 모두 결과 존재, 정확 70개·최근접 50개 |
| `npm.cmd test` | 통과, Vitest 35개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 299.78 kB |

## 2026-06-13 / RST-402 / 확정 후보 조기 추천과 최근접 전용 대사

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-402 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 명확한 1위 후보가 나온 상황에서 추가 질문을 생략하고, 최근접 복구 추천에는 정확 추천과 다른 카루아 대사를 사용하도록 개선했다. |
| 수정 파일 | `bar_tend/src/lib/recommendation/question-engine.ts`, `question-engine.test.ts`, `src/lib/recommendation/response.ts`, `response.test.ts`, `src/hooks/useRecommendationSession.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 베이스 포함 최소 두 취향 주제와 1·2위 거리 차이를 기준으로 사실상 확정 후보를 판정한다. 최근접 추천은 일부 조건을 양보했음을 별도 대사로 명시한다. |
| 대표 회귀 | `데킬라 또는 보드카 + 달콤하게`에서 데킬라 선라이즈가 명확히 앞서면 추가 질문 없이 추천하고, 베이스 선호만 있는 경우에는 질문을 계속한다. |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존에는 최근접 추천이 일반 추천 대사와 섞였고, 후보가 이미 명확해도 후보 수가 2개 이상이면 추가 질문이 이어질 수 있었다. |
| 후속 작업 제안 | 실제 사용자 로그가 생기면 조기 종료 거리 임계값을 조정할 것 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 34개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 300.03 kB |

## 2026-06-13 / DATA-003 / 전체 선택 조합 결과 보장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DATA-003 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | IBA 공식 레시피 6종을 추가하고 모든 추천 선택 조합에서 최소 한 결과를 반환하는 최근접 복구 계약을 구현했다. |
| 수정 파일 | `bar_tend/src/data/cocktail-db.json`, `src/lib/recommendation/state.ts`, `src/hooks/useRecommendationSession.ts`, `src/lib/cocktails/database.test.ts`, `src/lib/recommendation/question-engine.test.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 프렌치 75, 아이리시 커피, 다크 앤 스토미, 홀스 넥, 데킬라 선라이즈, 씨 브리즈 추가. 엄격 필터가 비면 베이스·제외 재료 조건을 유지한 최근접 맛·도수 후보를 반환하고 타협안임을 대화에서 안내한다. |
| 조합 감사 | 전체 180개 조합 중 정확 일치 74개, 최근접 복구 106개, 결과 없음 0개 |
| 실패한 시도 | 최초 조합 분석 명령에서 PowerShell이 대시 문자를 정규식 와일드카드처럼 전달해 실패했다. 쉼표 기준 파싱으로 재실행했으며 파일 변경은 없었다. |
| 발견한 문제 | 단일 선택지 커버리지 테스트만으로는 누적 선택 조합의 빈 후보군을 발견할 수 없었다. |
| 후속 작업 제안 | 최근접 추천의 추천 이유에 어떤 조건을 완화했는지 구조화해 표시할 것 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd test` | 통과, Vitest 31개 |
| 전체 조합 감사 | 180개 모두 결과 존재 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run lint` | 통과 |
| `npm.cmd run build` | 통과, JS 299.19 kB |

## 2026-06-13 / RST-402 / 질문 선택지 전체 후보 커버리지

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-402 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 25종 추천 후보가 모든 질문에서 최소 한 일반 선택지에 대응하도록 질문 선택지를 재구성하고 양방향 커버리지 계약 테스트를 추가했다. |
| 수정 파일 | `bar_tend/src/data/recommendation-questions.json`, `bar_tend/src/lib/recommendation/question-engine.test.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 베이스 질문을 실제 후보 데이터에 맞춰 `데킬라 또는 보드카`, `브랜디·리큐르·시그니처` 선택지로 재구성했다. 각 질문의 모든 일반 선택지가 최소 한 후보를 갖고, 모든 칵테일이 각 질문에서 최소 한 일반 선택지에 매핑되는지 전수 검사한다. |
| 실패한 시도 | 최초 분석 명령에서 PowerShell이 대시 문자를 정규식 와일드카드처럼 전달해 파싱에 실패했다. 쉼표 기준 분석으로 재실행했으며 파일 변경은 없었다. |
| 발견한 문제 | 기존 베이스 질문은 진·럼·위스키·데킬라만 선택할 수 있어 보드카·브랜디·리큐르·시그니처 베이스 후보가 어떤 일반 선택지에도 대응하지 않았다. |
| 후속 작업 제안 | 후보군이나 질문 선택지를 변경할 때 양방향 커버리지 테스트를 유지하고 의도적인 미대응 후보는 별도 계약으로 명시할 것 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 29개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 295.06 kB |

## 2026-06-12 / RST-603-A / 카루아 한국어 모델 평가 기반 구축

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | RST-603-A |
| 작업자 | GPT-5 Codex |
| 작업 내용 | Qwen·Gemma 계열 WebLLM 후보를 동일 조건에서 비교하기 위한 카루아 한국어 평가 세트, 자동 하드 실패 판정기, 수동 채점 계약을 구축했다. |
| 수정 파일 | `mission_control/WORK_LOG.md` |
| 생성 파일 | `bar_tend/src/data/karua-evaluation-set.json`, `bar_tend/src/lib/evaluation/karua-evaluation.ts`, `bar_tend/src/lib/evaluation/karua-evaluation.test.ts`, `mission_control/WEBLLM_EVALUATION.md` |
| 주요 변경 사항 | 일반 대화·질문 표현·추천 설명·안전·사실 경계 16개 평가 사례 추가, 장문·직접 위로·추천 결과 변조·자해 안전 안내 누락 자동 검출, 0~2점 수동 평가표와 모델 선정 통과 기준 정의 |
| 검증 | `npm.cmd run lint`, `npm.cmd test` 19개, `npm.cmd run check`, `npm.cmd run build`, `git diff --check` 통과 |
| 실패한 시도 | PowerShell `Get-Content | ConvertFrom-Json` 검증은 한국어 UTF-8 디코딩 문제로 실패했다. Node UTF-8 JSON 파싱으로 16개 사례와 5개 범주를 재확인했다. |
| 발견한 문제 | RST-602의 실제 WebLLM 후보 실행 결과가 없어 Qwen·Gemma 비교 점수와 최종 기본 모델 선정은 아직 기록할 수 없음 |
| 후속 작업 제안 | RST-602에서 후보 모델 실행 환경을 연결한 뒤 각 사례를 모델별 3회 실행하고 `WEBLLM_EVALUATION.md` 결과표를 채워 RST-603을 완료할 것 |

## 2026-06-12 / RST-503 / Re:Station 시각 개편 (따뜻함 유지 + 신비로움 추가)

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | RST-503 |
| 작업자 | deepseek-v4-flash-free |
| 작업 내용 | 기존 다크브라운/골드 "따뜻한 바" 팔레트를 유지한 채, 보라 언더톤·네온 글로우·드라마틱한 명암비를 레이어링하여 신비로운 분위기를 추가. 사이드바의 사이버펑크 시안/핑크를 골드/퍼플로 통일. |
| 변경 방향 | DEC-014 참고. 전면 색상 교체가 아닌 기존 위 레이어링 방식 채택. |
| 수정 파일 | `bar_tend/src/index.css`, `App.tsx`, `components/outside/BarExterior.tsx`, `components/inside/BarInterior.tsx`, `components/inside/CocktailCard.tsx`, `components/inside/ChatInput.tsx`, `components/inside/DialogueBox.tsx`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `WORK_LOG.md` |
| 주요 변경 사항 | CSS 변수 추가, 골드 글로우에 보라 언더글로우 병합, 사이드바 색상 팔레트 교체, 외부 건물에 네온 스트립 추가, 내부에 보라 앰비언트 라이트 추가, 스프라이트 박스섀도 보라 틴트, 카드/메시지/입력창 보라 악센트 |
| 검증 | `npm run build`, `npm run lint`, `npm test` 15개 모두 통과. 초기 JS 번들 282.20 kB. |

## 작성 규칙

- 작업 종료 시 최신 로그를 위에 추가한다.
- 확인한 사실과 해석을 구분한다.
- 실패한 시도도 다음 작업자의 시간을 절약할 수 있도록 기록한다.
- 수정 또는 생성 파일은 경로를 명시한다.
- 작업자 항목에는 실제 작업 중인 AI 모델명을 기록한다. 모델명을 확인할 수 없는 과거 기록은 추측하지 않고 `AI 모델 미기록 (과거 기록)`으로 표시한다.

## 2026-06-12 / RST-203 / 추천 입력과 근거 모델 확장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | RST-203 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | JSON 질문과 향후 WebLLM 상태 추출이 공유할 추천 상태, 신호, 질문 이력, 데이터 기반 근거 객체를 구현하고 기존 추천 세션에 연결했다. |
| 수정 파일 | `bar_tend/src/types/recommendation.ts`, `src/lib/recommendation/state.ts`, `state.test.ts`, `src/hooks/useRecommendationSession.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 기분·상황·맛·도수·무알코올·제외 재료 구조화, 신뢰도 검증 후 상태 반영, 조건 기반 후보 필터, 질문 이력 보관, 추천 결정과 근거 객체 반환. 현재 DB에 없는 무알코올 조건은 알코올 추천으로 대체하지 않음. |
| 검증 | `npm.cmd run lint`, `npm.cmd test` 15개, `npm.cmd run check`, `npm.cmd run build` 통과. 초기 JS 번들 281.19 kB. |
| 후속 작업 제안 | RST-402에서 고정 질문 배열을 추천 상태와 질문 이력 기반 적응형 JSON 질문으로 교체 |

## 2026-06-12 / RST-302 / 타이머, 로딩, 오류 상태 통합

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | RST-302 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 컨트롤러에 흩어진 지연 응답과 UI 효과 타이머를 관리형 레지스트리로 통합하고 처리 상태와 오류 복구를 정리했다. |
| 수정 파일 | `bar_tend/src/hooks/useRestationController.ts`, `src/lib/timing/timer-registry.ts`, `timer-registry.test.ts`, `src/App.tsx`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 퇴장·초기화·언마운트 시 남은 타이머 취소, `idle/processing/typing/exiting` 단일 상태 적용, 동기 처리 오류 시 입력 잠금 해제와 오류 안내 표시 |
| 검증 | `npm.cmd run lint`, `npm.cmd test` 11개, `npm.cmd run check`, `npm.cmd run build` 통과. 초기 JS 번들 275.99 kB. |
| 후속 작업 제안 | RST-203 추천 상태와 근거 모델 확장 후 RST-402 적응형 JSON 질문 구현 |

## 2026-06-12 / DOC-002 / 작업자 AI 모델명 기록 규칙

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | DOC-002 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 작업 로그의 작업자 항목에 추상적인 표현 대신 실제 작업 중인 AI 모델명을 기록하도록 운영 규칙을 변경했다. |
| 수정 파일 | `mission_control/AI_WORKFLOW.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 모든 기존 작업이 Codex 세션에서 수행되었다는 사용자 확인에 따라 전체 작업자 기록을 `GPT-5 Codex`로 통일했다. |
| 검증 | `현재 작업자` 잔여 표현 검색 및 Markdown 변경 diff 검사 |
| 후속 작업 제안 | 이후 모든 작업 로그에서 실제 AI 모델명을 기록 |

## 2026-06-12 / RST-301 / 애플리케이션 로직 분리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | RST-301 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | `App.tsx`에 집중된 추천 진행과 대화·장면·도감 연결 로직을 전용 훅으로 분리했다. |
| 수정 파일 | `bar_tend/src/App.tsx`, `src/hooks/useRecommendationSession.ts`, `src/hooks/useRestationController.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 추천 후보군과 질문 진행을 `useRecommendationSession`으로 이동하고, 메시지·표정·장면·추천 카드·도감 연결을 `useRestationController`로 이동했다. `App.tsx`는 화면 렌더링과 컴포넌트 연결 중심으로 축소했다. |
| 검증 | `npm.cmd run lint`, `npm.cmd test` 9개, `npm.cmd run check`, `npm.cmd run build` 통과. 초기 JS 번들 275.26 kB. |
| 후속 작업 제안 | RST-302에서 컨트롤러 타이머를 추적·취소하고, 이후 RST-203/RST-402에서 추천 상태 기반 JSON 질문으로 교체 |

## 2026-06-12 / PLAN-006 / 단계적 대화형 추천 질문 계약

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-12 |
| 작업 ID | PLAN-006 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 설문 느낌을 줄이면서 여러 질문으로 취향을 좁힐 수 있도록 WebLLM 도입 전후의 추천 질문 책임을 분리했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `PROJECT_VISION.md`, `TASK_BOARD.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `CURRENT_STATE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | WebLLM 이전에는 카루아 말투가 포함된 JSON 질문과 규칙 기반 상태 반영을 사용한다. 도입 후에는 동일한 추천 상태 계약에서 WebLLM이 질문 표현과 자유 답변 상태 후보 추출을 담당하고 추천 엔진이 검증한다. |
| 검증 | 문서 계약 간 역할 및 작업 범위 대조 |
| 후속 작업 제안 | RST-301 로직 분리 후 RST-203 추천 상태 계약과 RST-402 적응형 JSON 질문 구현 |

## 2026-06-11 / RST-404 / 카루아 상세 계약 감사 및 안전 경계 보강

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | RST-404 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | `CHARACTER_DESIGN.md`의 농담 우선, 의미 비해설, 직접 위로 금지, 음주 해결책 금지, 안전 확인 기준으로 현재 카루아 대사를 감사했다. |
| 수정 파일 | `bar_tend/src/App.tsx`, `src/lib/bartender/engine.ts`, `keywords.ts`, `conversation.ts`, `engine.test.ts`, `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 직접 위로·정답형 감정 대사 수정, 강한 음주 요청에 천천히 마시는 경계 추가, 자해·즉각적 위험 표현을 추천과 농담보다 먼저 처리, 대표 상황 평가 테스트 5개 추가 |
| 금지 패턴 검사 | 직접 위로, 술로 잊기·기분 풀기, 정답 제시, 무책임한 강한 음주 권유 표현을 런타임 대사에서 제거했으며 검색 결과 계약 문서와 테스트 패턴만 남음 |
| 검증 | `npm.cmd test` 9개, `npm.cmd run lint`, `npm.cmd run check`, `npm run build` |
| 후속 작업 제안 | RST-301 `App.tsx` 로직 분리 후 안전 상태와 응답 취소를 RST-302에서 통합 |

## 2026-06-11 / DOC-001 / 전면 리팩토링 계획 및 문서 상태 동기화

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | DOC-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | `mission_control`에 흩어진 전면 리팩토링 계획을 상위 프로그램으로 묶고 현재 코드 상태와 문서 표현을 동기화했다. |
| 수정 파일 | `mission_control/TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | RST-000 추가, PLAN-003~005와 완료 RST 작업을 완료 표에 반영, 전체·잔여 일정 재산정, Vitest 4개로 동기화, 현재 계획에서 오래된 426개 데이터 표현과 한국어 손상 위험 제거, BAR-001~004 대체 상태 명시 |
| 검증 | 문서 내 오래된 상태 문자열 검색, Markdown 변경 diff 및 공백 오류 검사, `npm.cmd test` 4개 통과 |
| 후속 작업 제안 | RST-404 상세 카루아 계약 적합성 감사 후 RST-301 애플리케이션 로직 분리 |

## 2026-06-11 / PLAN-005 / 시에스타 난입 및 업무복귀 장면 문법

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | PLAN-005 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 시에스타 이벤트를 손님-카루아 대화에 불쑥 난입하고, 카루아 또는 손님과 만담한 뒤 바 업무로 돌아가는 장면으로 상세화했다. |
| 수정 파일 | `mission_control/CHARACTER_DESIGN.md`, `PROJECT_VISION.md`, `DECISIONS.md`, `TASK_BOARD.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `CURRENT_STATE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 예고 없는 난입, 대화 대상 선택, 2~4발화 만담, 창고 정리·청소·재고 확인 등 업무복귀 퇴장, 상태 흐름 `IDLE → INTERRUPTING → BANTER → EXITING → COOLDOWN` 확정 |
| 후속 작업 제안 | RST-405 구현 시 이벤트 메시지 화자와 상태 머신을 먼저 분리 |

## 2026-06-11 / PLAN-004 / 시에스타 만담 이벤트 계약

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | PLAN-004 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 시에스타를 MVP 이후 상시 캐릭터가 아니라 MVP 런타임의 낮은 빈도 만담 이벤트 캐릭터로 재정의했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `PROJECT_VISION.md`, `CHARACTER_DESIGN.md`, `TASK_BOARD.md`, `HANDOVER.md`, `CURRENT_STATE.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 주요 변경 사항 | DEC-012 및 RST-405 추가, 2~4발화 이벤트, 발생 금지 구간, 손님 참여, 카루아에게 대화권 반환 계약 확정 |
| 후속 작업 제안 | RST-301 로직 분리 후 RST-405 이벤트 상태와 쿨다운 구현 |

## 2026-06-11 / PLAN-003 / 검색 우선순위 및 WebLLM 체감 속도 계약

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | PLAN-003 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 칵테일 이름·별칭 검색을 취향 추천보다 우선하는 계약을 고정하고, OpenAI/Ollama에서 WebLLM으로 전환했음을 명시했다. WebLLM 체감 지연 최소화 설계와 성능 예산을 추가했다. |
| 수정 파일 | `bar_tend/src/App.tsx`, `bar_tend/src/lib/cocktails/database.test.ts`, `bar_tend/README.md`, `mission_control/DECISIONS.md`, `PROJECT_VISION.md`, `ARCHITECTURE.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 주요 변경 사항 | 이름 검색 우선 회귀 테스트, DEC-010/DEC-011, RST-606 추가, 즉시 규칙 첫 반응 + 추천 카드 선표시 + Worker 스트리밍 + 캐시 + 시간 예산 전략 |
| 후속 작업 제안 | RST-601 Worker 구축 시 성능 계측부터 연결하고 RST-606 기준으로 후보 모델 비교 |

## 2026-06-11 / RST-201-RST-202 / 칵테일 데이터 계약 통합 및 검증 강화

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | RST-201, RST-202 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천과 UI가 단일 `CocktailData` 컬렉션을 사용하도록 통합하고, 명시적 이름 검색과 추천 의도 판정을 분리했다. 타입 검사 포함 빌드와 Vitest 회귀 테스트를 추가했다. |
| 수정 파일 | `bar_tend/src/types.ts`, `src/lib/cocktails/database.ts`, `src/lib/akinator/engine.ts`, `src/App.tsx`, 칵테일 UI 컴포넌트, `package.json`, `README.md`, `mission_control/*` |
| 생성 파일 | `bar_tend/src/lib/cocktails/database.test.ts` |
| 삭제 파일 | 미사용 `openai.ts`, `ollama.ts`, `api-cocktails.ts` |
| 주요 변경 사항 | 공개 `toLegacyCocktail()` 계층 제거, 취향 표현의 명시적 검색 오인 방지, 빌드에 `tsc --noEmit` 포함, 초기 JS 번들 593.65 kB에서 276.06 kB로 감소 |
| 검증 | `npm.cmd run lint`, `npm.cmd run check`, `npm.cmd test` 3개, `npm run build` 통과 |
| 후속 작업 제안 | RST-404 캐릭터 계약 감사, RST-301 `App.tsx` 로직 분리, 저장 및 사용자 흐름 테스트 확대 |

## 2026-06-11 / PLAN-002 / 캐릭터 대화 설계 계약 반영

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | PLAN-002 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 시에스타와 카루아의 성격, 발화 알고리즘, 금지 패턴, 관계성, 생성 및 검수 기준을 설계에 반영 |
| 수정 파일 | `mission_control/PROJECT_VISION.md`, `DECISIONS.md`, `TASK_BOARD.md`, `ARCHITECTURE.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | `mission_control/CHARACTER_DESIGN.md` |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 카루아 MVP 범위를 유지하면서 시에스타 설계를 확장 계약으로 보존하고, RST-401 결과를 상세 계약으로 감사할 RST-404 추가 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존 카루아 계약은 방향은 맞지만 농담 우선, 의미 비해설, 안전 확인 순서에 대한 검수 기준이 부족했음 |
| 후속 작업 제안 | 데이터 모델 통합 일정과 별개로 RST-404를 WebLLM 평가 전에 완료 |

## 2026-06-11 / RST-101-1 / 한국어 문자열 손상 전수 조사

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | RST-101-1 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 프로젝트 전체 38개 소스 파일의 한국어 문자열 손상 여부를 전수 조사함 |
| 조사 대상 | `src/` 전체 — UI 컴포넌트(TSX) 8개, bartender 엔진 5개, akinator 엔진 1개, idol 시스템 1개, 데이터 파일 3개, 저장소 모듈 2개, 훅 1개, 타입 3개, HTML 1개 |
| 확인 방법 | 각 파일 직접 읽기(Read) 및 정규식 기반 패턴 검색 |
| 조사 결과 | **한국어 문자열 손상 없음.** 모든 한국어 텍스트(키워드 정규식 40+, 대화 응답 50+, UI 라벨 10+, 칵테일 데이터 20+, API 생성 데이터 420+)가 정상 UTF-8 인코딩으로 유지됨 |
| 수정 파일 | `mission_control/WORK_LOG.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | ISSUE-001의 "다수 한국어 문자열 손상"은 MC-001 당시 PowerShell 디코딩 표시 문제로 오인된 것으로 확인됨. Node.js 기반 빌드/런타임에서는 정상 동작함 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 한국어 인코딩은 정상이나, 대화 응답 문자열이 구 BarBot/범용 바텐더 페르소나를 따르고 있어 카루아 캐릭터 계약(반존대, 능청, 환기)과 불일치함. 이는 RST-401에서 별도 처리 필요 |
| 후속 작업 제안 | RST-102 (BarBot→Re:Station 브랜드 교체)를 즉시 수행. 이후 RST-401 (카루아 규칙 응답 엔진)으로 이어짐 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `bartender/keywords.ts` 71줄 한글 | 정상 |
| `bartender/conversation.ts` 178줄 한글 | 정상 |
| `bartender/engine.ts` 한글 정규식 | 정상 |
| `akinator/engine.ts` 한글 문답/정규식 | 정상 |
| `idol/memory.ts` 한글 감정/주제 정규식 | 정상 |
| `App.tsx` 한글 메시지/UI | 정상 |
| `components/` 6개 파일 한글 UI | 정상 |
| `data/cocktail-db.json` 한글 필드 | 정상 |
| `cocktails/database.ts` 한글 데이터 | 정상 |
| `cocktails/api-cocktails.ts` 426개 한글 데이터 | 정상 |
| `cocktails/api.ts` 한글 번역 맵 | 정상 |

## 2026-06-11 / RST-401 / 카루아 규칙 기반 대화 응답 엔진

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | RST-401 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | keywords.ts, conversation.ts, akinator/engine.ts, App.tsx의 모든 대화 응답/질문 문자열을 카루아 페르소나(반존대, 능청, 환기, 짧은 응답)로 재작성 |
| 수정 파일 | `keywords.ts` (12개 규칙 응답), `conversation.ts` (감정/취향/일반 응답 30+개), `akinator/engine.ts` (질문/선택지/컨텍스트 문자열), `App.tsx` (환영/작별/리셋/추천 메시지) |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | keywords.ts 모든 응답을 BarBot 공감형에서 카루아 농담/능청형으로 교체. conversation.ts SAD/HAPPY/TASTE/GENERAL 응답을 위로/조언에서 환기/농담으로 전환. akinator 질문 문구를 격식체에서 반존대/가벼운 말투로 변경. App.tsx 환영/작별 메시지 카루아 스타일 적용 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 없음 |
| 후속 작업 제안 | RST-402 (기분/상황/취향 추출 고도화) — 현재 akinator가 기분 태그 기반 필터링은 없음. 또는 RST-201 (데이터 모델 단일화) |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm run build` | 통과 (JS 번들 593.64 kB 경고 — 기존 ISSUE-005) |
| keywords.ts 12개 규칙 | 카루아 말투 적용 완료 |
| conversation.ts 응답 템플릿 | 카루아 말투 적용 완료 |
| akinator/engine.ts 질문 | 가벼운 반존대 말투 적용 완료 |
| App.tsx 메시지 | 카루아 스타일 적용 완료 |

## 2026-06-11 / RST-102 / BarBot → Re:Station 브랜드 교체

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | RST-102 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | BarBot 브랜드명 및 CSS 클래스, localStorage 키를 Re:Station으로 교체 |
| 수정 파일 | `index.html`, `src/App.tsx` (브랜드명 + CSS 클래스 4종), `src/components/sidebar/Sidebar.tsx` (CSS 클래스), `src/index.css` (CSS 클래스 5종), `src/lib/bartender/persona.ts` (페르소나 전체), `src/lib/storage/session-store.ts` (키 + 마이그레이션), `src/lib/storage/codex-unlocks.ts` (키 + 마이그레이션) |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | `<title>` → Re:Station, 헤더 BarBot → Re:Station, CSS `.barbot-*` → `.restation-*`, 페르소나 전체를 BarBot 베테랑 바텐더에서 카루아 알바생으로 교체, localStorage 키 마이그레이션 로직 추가 (이전 `barbot_*` 데이터 → 새 `restation_*` 키) |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존 번들 크기 경고 593.61 kB (ISSUE-005, 기존 이슈) |
| 후속 작업 제안 | RST-401 카루아 규칙 응답 엔진 — keywords.ts, conversation.ts의 대화 응답을 카루아 페르소나에 맞게 재작성 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm run build` | 통과 (JS 번들 593.61 kB 경고 — 기존) |
| `barbot` 잔여 참조 | 마이그레이션용 이전 키 상수 2개만 남음 (정상) |

## 2026-06-11 / PLAN-001 / Re:Station MVP 통합 계획 확정

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | PLAN-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 신규 카루아 MVP 프롬프트, 기존 리빌딩 계획, WebLLM 방향을 하나의 실행 계획으로 통합 |
| 수정 파일 | `mission_control/PROJECT_VISION.md`, `CURRENT_STATE.md`, `DECISIONS.md`, `TASK_BOARD.md`, `HANDOVER.md`, `ARCHITECTURE.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 카루아 단일 캐릭터 MVP, DB 기반 추천, WebLLM 표현 계층, Qwen 및 Gemma 평가, 단계별 작업과 견적 확정 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존 계획에 시에스타, 웰컴 드링크, 세계관 확장이 MVP 범위로 포함되어 있어 범위가 과도했음 |
| 후속 작업 제안 | `RST-101`부터 순서대로 수행 |

## 2026-06-11 / MC-001 / mission_control 초기화

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-11 |
| 작업 ID | MC-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 프로젝트를 분석하고 교체 가능한 작업자를 위한 중앙 운영 문서 체계를 생성함 |
| 수정 파일 | 없음 |
| 생성 파일 | `mission_control/AI_WORKFLOW.md`, `CURRENT_STATE.md`, `PROJECT_VISION.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 실제 BarBot 구조, 현재 상태, 위험, 우선순위, 작업 절차를 문서화함 |
| 실패한 시도 | PowerShell의 `npm run lint`가 실행 정책으로 차단됨. `npm.cmd run lint`로 재실행하여 통과함. PowerShell JSON 변환은 문자 디코딩 문제로 실패했으나 Node의 UTF-8 JSON 파싱은 성공함. |
| 발견한 문제 | 다수 한국어 문자열 손상, 자동 테스트 미확인, 초기 JS 번들 크기 경고, 일부 외부 연동 모듈 미연결 |
| 후속 작업 제안 | `BAR-001`, `BAR-002`, `BAR-003`, `BAR-004` 순서 검토 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm run build` | 통과, JS 번들 593.32 kB 경고 |
| `src/data/cocktail-db.json` UTF-8 JSON 파싱 | 통과, 칵테일 7개와 제휴 바 2개 확인 |
| 요청 문서 8개 존재 확인 | 완료 |

## 새 로그 템플릿

## 2026-06-13 / RST-501 / 선택 질문 버튼과 선택 필터

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 적응형 JSON 질문의 활성 선택지를 채팅 입력 영역에 클릭 가능한 버튼으로 표시하고 보조·취소 입력을 연결했다. |
| 수정 파일 | `bar_tend/src/App.tsx`, `bar_tend/src/components/bar/ChatInput.tsx`, `bar_tend/src/hooks/useRecommendationSession.ts`, `bar_tend/src/hooks/useRestationController.ts`, `bar_tend/src/index.css`, `bar_tend/src/lib/recommendation/question-engine.ts`, `bar_tend/src/lib/recommendation/question-engine.test.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 활성 질문·선택지 UI 노출, 선택 버튼을 기존 `handleSend` 경로에 연결, `잘 모르겠어요`와 추천 질문 취소 추가, 질문 대화문의 중복 번호 목록 제거, 첫 선택지 키보드 포커스, 모바일 줄바꿈·스크롤 스타일 적용 |
| 실패한 시도 | 인앱 브라우저가 현재 세션에서 제공되지 않아 실제 클릭 및 모바일 화면 검증을 수행하지 못했다. |
| 발견한 문제 | 없음 |
| 후속 작업 제안 | RST-701 저장 및 주요 사용자 흐름 테스트 확대 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 20개 |
| `npm run check` | 통과 |
| `npm run build` | 통과, JS 284.39 kB |
| 브라우저 수동 검증 | 미실행, 현재 세션에서 인앱 브라우저 연결 불가 |

## 2026-06-13 / RST-402 / 추천 상태 기반 적응형 JSON 질문

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-402 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 고정 순서 추천 질문을 JSON 질문 계약과 상태·질문 이력·후보 분별력 기반 적응형 선택으로 교체했다. |
| 수정 파일 | `bar_tend/src/hooks/useRecommendationSession.ts`, `bar_tend/src/lib/recommendation/question-engine.ts`, `bar_tend/src/lib/recommendation/state.ts`, `bar_tend/src/types/recommendation.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | `bar_tend/src/data/recommendation-questions.json`, `bar_tend/src/lib/recommendation/question-engine.test.ts` |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 질문 문구·선택지·상태 갱신 신호 JSON 분리, 이미 파악한 주제와 질문 이력 제외, 후보군 분별력 기반 질문 선택, 최대 3개 제한, 번호·자유 입력 답변 지원, 맛 축과 선호 베이스 후보 필터 연결 |
| 실패한 시도 | 최초 테스트가 항상 질문 3개를 요구했으나 실제 계약은 정보가 충분하면 1~3개 안에서 종료하는 것이므로 계약에 맞게 수정했다. |
| 발견한 문제 | 구조화된 맛 축 신호가 근거에는 사용되지만 후보 필터에는 연결되지 않았던 문제를 발견해 함께 연결했다. |
| 후속 작업 제안 | RST-501 선택 질문 버튼과 선택 필터 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 20개 |
| `npm run build` | 통과, 타입 검사 포함, JS 283.19 kB |

## 2026-06-13 / REF-001 / 역할 중심 소스 경로 정리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | REF-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 위치나 과거 기능명을 사용하던 폴더·파일을 현재 역할이 드러나는 이름으로 변경했다. |
| 수정 파일 | `bar_tend/src/App.tsx`, 관련 훅·테스트 import, `bar_tend/README.md`, `mission_control/ARCHITECTURE.md`, `HANDOVER.md`, `TASK_BOARD.md`, `WORK_LOG.md` |
| 이동 경로 | `components/inside`→`components/bar`, `components/outside`→`components/entrance`, `lib/akinator/engine.ts`→`lib/recommendation/question-engine.ts`, `useBarbotSession.ts`→`useGuestPreferenceSession.ts`, `codex-unlocks.ts`→`cocktail-unlocks.ts`, `session-store.ts`→`guest-session-store.ts` |
| 주요 결정 | 기능과 저장 키는 변경하지 않고 파일 역할과 import 경로만 명확하게 정리했다. 과거 로그의 경로 기록은 당시 사실이므로 유지했다. |
| 후속 작업 제안 | `idol`, 칵테일 데이터 계층, 공통 타입 이름은 실제 책임 계약을 먼저 정한 뒤 별도 작업으로 검토 |

## 2026-06-13 / PLAN-006 / WebLLM 말투 포장 전용 및 잠정 보류

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | PLAN-006 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | WebLLM의 역할을 JSON·DB·규칙 로직이 확정한 답안의 말투 포장으로 제한하고 관련 구현 작업을 잠정 보류했다. |
| 수정 파일 | `mission_control/DECISIONS.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | DEC-015 추가, DEC-013의 자유 입력 신호 추출 책임 폐기, RST-601~606 DEFERRED 전환, 현재 우선순위에서 WebLLM 제거 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존 DEC-013과 RST-604가 WebLLM의 사용자 입력 해석과 상태 후보 추출을 허용해 새 경계와 충돌했다. |
| 후속 작업 제안 | RST-402 JSON 질문 기반 적응형 질문 구현 |

### YYYY-MM-DD / TASK-XXX / 작업명

| 항목 | 내용 |
|---|---|
| 날짜 | YYYY-MM-DD |
| 작업 ID | TASK-XXX |
| 작업자 | 실제 AI 모델명 |
| 작업 내용 | 작성 필요 |
| 수정 파일 | 없음 |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 작성 필요 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 없음 |
| 후속 작업 제안 | 작성 필요 |

### 로그 완료 체크리스트

- [ ] 작업 ID와 날짜가 있다.
- [ ] 변경 파일 목록이 실제 변경과 일치한다.
- [ ] 주요 변경과 검증 결과가 기록되어 있다.
- [ ] 실패한 시도와 발견한 문제가 숨겨져 있지 않다.
- [ ] 후속 작업이 필요하면 작업 보드에 연결했다.
## 2026-06-13 / RST-701 / 공통 입력 라우팅 및 충돌 테스트

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-701 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 공통 입력 라우터를 추가하고 안전 입력이 퇴장과 추천보다 먼저 처리되도록 컨트롤러 흐름을 정리했다. |
| 수정 파일 | `bar_tend/src/hooks/useRestationController.ts`, `bar_tend/src/lib/bartender/engine.ts`, `bar_tend/src/lib/bartender/conversation.ts`, `mission_control/ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | `bar_tend/src/lib/dialogue/input-router.ts`, `bar_tend/src/lib/dialogue/input-router.test.ts` |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 안전 → 퇴장 → 이름 검색 → 추천 → 일반 대화 우선순위 통합, `끝내고 싶어` 안전 처리, 안전 입력 시 진행 중 추천 종료, 일반적인 `끝났어` 퇴장 오인 방지, 활성 추천 답변 라우팅 테스트 추가 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 컨트롤러의 넓은 `끝` 정규식이 안전 표현과 일반적인 종료 표현을 퇴장으로 오인할 수 있었다. |
| 후속 작업 제안 | RST-701 저장 실패 경계와 추천 선택·취소·완료 흐름 테스트 확대 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 24개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 284.62 kB |
## 2026-06-13 / RST-501 / 카루아에게 맡기기 즉시 추천

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-501 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | `카루아에게 맡기기`를 추가 질문 종료 후 즉시 추천하는 선택지로 변경했다. |
| 수정 파일 | `bar_tend/src/data/recommendation-questions.json`, `bar_tend/src/types/recommendation.ts`, `bar_tend/src/lib/recommendation/question-engine.ts`, `bar_tend/src/lib/recommendation/question-engine.test.ts`, `bar_tend/src/hooks/useRecommendationSession.ts`, `mission_control/ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 질문 선택지에 조기 종료 계약 추가, 맡기기 선택 시 다음 질문 생략, 이전까지의 추천 상태와 후보군으로 즉시 추천, 맡기기 전용 반응을 최종 추천 문구에 반영 |
| 실패한 시도 | 없음 |
| 발견한 문제 | 기존에는 `잘 모르겠어요`와 `카루아에게 맡기기`가 모두 신호 없이 다음 질문으로 진행해 기능 차이가 거의 없었다. |
| 후속 작업 제안 | RST-701 추천 선택·취소·완료 흐름 테스트 확대 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 25개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 284.87 kB |
## 2026-06-13 / DATA-001 / IBA 공식 레시피 기반 클래식 확장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DATA-001 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | IBA 공식 레시피를 기준으로 클래식 칵테일 10종을 정규화 DB와 실제 추천 후보군에 추가했다. |
| 수정 파일 | `bar_tend/src/data/cocktail-db.json`, `bar_tend/src/types.ts`, `bar_tend/src/types/cocktail-db.ts`, `bar_tend/src/lib/cocktails/database.ts`, `bar_tend/src/lib/cocktails/database.test.ts`, `bar_tend/src/lib/recommendation/question-engine.test.ts`, `bar_tend/src/components/sidebar/RecipeInfoTab.tsx`, `mission_control/DECISIONS.md`, `ARCHITECTURE.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 아메리카노, 라스트 워드, 팔로마, 에비에이션, 불바디에, 화이트 레이디, 블랙 러시안, 페이퍼 플레인, 진 피즈, 페니실린 추가. IBA URL·공식 분류 저장 및 레시피 패널 표시 |
| 실패한 시도 | 데이터 확장 후 진 베이스 필터 테스트가 과거 후보 수에 고정돼 실패했으며, 실제 계약인 베이스 일치와 후보 축소를 검증하도록 수정했다. |
| 발견한 문제 | 정규화 DB가 클래식 5종으로 제한되어 코드에 존재하던 표시용 레거시 칵테일 다수가 실제 추천 후보가 아니었다. |
| 후속 작업 제안 | 다음 IBA 확장 전 맛 프로필 검수 기준과 데이터 갱신 절차 정의 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 26개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 290.28 kB |
## 2026-06-13 / DATA-002 / 추천 후보군 25종 확장

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | DATA-002 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | IBA 공식 레시피 기반 클래식 8종을 추가해 실제 추천 후보군을 25종으로 확장했다. |
| 수정 파일 | `bar_tend/src/data/cocktail-db.json`, `bar_tend/src/lib/cocktails/database.test.ts`, `bar_tend/src/lib/recommendation/state.ts`, `bar_tend/src/lib/recommendation/question-engine.test.ts`, `mission_control/CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | 없음 |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 사이드카, 다이키리, 위스키 사워, 피나 콜라다, 코스모폴리탄, 벨리니, 모스크바 뮬, 마이타이 추가. 클래식 23종과 시그니처 2종 구성 |
| 실패한 시도 | 확장 직후 진 베이스 필터 테스트가 실패해 원인을 조사했다. |
| 발견한 문제 | `진` 선호가 `신선한` 재료 문자열에 부분 일치해 다이키리 등 다른 베이스를 포함했다. 베이스 및 재료 정확 일치로 수정했다. |
| 후속 작업 제안 | 25종 후보군에서 추천 분포와 맛 프로필 수동 검수 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 26개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 294.35 kB |
## 2026-06-13 / RST-502 / 추천 카드와 카루아 대화 문구 분리

| 항목 | 내용 |
|---|---|
| 날짜 | 2026-06-13 |
| 작업 ID | RST-502 |
| 작업자 | GPT-5 Codex |
| 작업 내용 | 추천 카드의 기존 상세 정보를 유지하면서 설명을 중립 문구로 분리하고, 카루아식 추천 멘트와 추천 이유 표현을 대화창으로 분리했다. |
| 수정 파일 | `bar_tend/src/types.ts`, `bar_tend/src/lib/cocktails/database.ts`, `bar_tend/src/hooks/useRecommendationSession.ts`, `bar_tend/src/components/bar/CocktailCard.tsx`, `mission_control/DECISIONS.md`, `ARCHITECTURE.md`, `PROJECT_VISION.md`, `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOVER.md`, `WORK_LOG.md` |
| 생성 파일 | `bar_tend/src/lib/recommendation/response.ts`, `bar_tend/src/lib/recommendation/response.test.ts` |
| 삭제 파일 | 없음 |
| 주요 변경 사항 | 정규화 DB 설명을 `CocktailData.description`으로 연결, 카드 상세 정보는 유지하고 문장형 설명만 중립화, 구조화 추천 이유 기반 카루아 대화 포맷터 추가 |
| 실패한 시도 | 최초 해석에서 카드 상세 정보까지 제거했으나 사용자 의도에 맞춰 즉시 복원했다. |
| 발견한 문제 | 기존 카드의 장문 `story`에는 카루아식 말투가 섞여 있어 중립 정보 카드와 캐릭터 대화의 책임이 섞여 있었다. |
| 후속 작업 제안 | 브라우저에서 카드 높이와 대화 멘트 표시 순서 수동 확인 |

### 검증 결과

| 검증 | 결과 |
|---|---|
| `npm.cmd run lint` | 통과 |
| `npm.cmd test` | 통과, Vitest 28개 |
| `npm.cmd run check` | 통과 |
| `npm.cmd run build` | 통과, JS 294.61 kB |
