# 작업 이력 (축약)

## 2026-07-22 / Codex / PIPE-806-B topic·speech·entity 점진 적용

- 구현 커밋: `507abfc` (`refactor: consume planned topic and speech signals`).
- `DialogueMove`가 `SpeechAct`와 단일 topic transition을 소유하고, controller는 `InputUnderstanding`과 계획이 정확히 일치할 때만 이를 소비한다. 불일치·대화 중단 시 기존 topic transition으로 fallback한다.
- `PrimaryTopic`을 세션 topic으로 결정적으로 매핑하고 칵테일 지식·스토리의 entity ID를 subject에 전달한다. 질문·답변 SpeechAct는 일반 대화 초대 여부에도 반영했다.
- 풍부해진 `world-building` 문맥에서도 `당신은?` 후속 발화를 character 질의로 복구하도록 기존 ContinuationResolver 계약을 확장했다.
- Replay snapshot에 `primaryTopic`, `speechAct`, `entityId`를 추가하고 topic transition 및 칵테일 story entity 연속성을 검증했다.
- 검증: 표적 5 files / 52 tests, 전체 65 files / 864 tests, TypeScript check, ESLint, production build 통과.
- 번들: main 549.33 kB(gzip 164.01 kB), WebLLM 청크 없음, 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-806-C PreferenceEvidence 소비다.

## 2026-07-22 / Codex / PIPE-806-A safety·ControlIntent 점진 적용

- 구현 커밋: `f691adf` (`refactor: consume planned control transitions`).
- `DialogueService.resolve()`가 기존 classifier 결과에서 `InputUnderstanding`과 `DialogueMove`를 생성해 반환하도록 연결했다. Understand와 Plan은 상태를 직접 변경하지 않는다.
- controller의 safety `lock-safety`와 추천 취소 `set-mode:conversation`만 DialogueMove transition으로 교체했다. legacy route와 move type·transition이 정확히 일치하지 않으면 기존 transition을 적용한다.
- Replay snapshot에 `controlIntent`, move, transition plan을 critical 필드로 추가하고 추천 질문 중 safety 잠금, 추천 취소, farewell 추천 차단, 일반 대화의 구조 불변을 검증했다.
- topic·speech·entity, PreferenceEvidence, Conversation Expansion 소비는 포함하지 않았다. PIPE-806은 DOING 상태를 유지한다.
- 검증: Decision shadow·Replay·DialogueService·Continuity 4 files / 52 tests, 전체 65 files / 861 tests, TypeScript check, ESLint, production build 통과.
- 번들: main 548.27 kB(gzip 163.64 kB), Understand·Plan runtime 연결로 직전보다 4.83 kB(gzip 1.32 kB) 증가. WebLLM 청크 없음, 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-806-B topic·speech·entity 소비다.

## 2026-07-22 / Codex / PIPE-805 Evaluate·Select·Plan shadow

- 구현 커밋: `a6129f7` (`feat: add deterministic decision shadow`).
- 칵테일·질문·대화별 `Evaluation`을 분리하고 공통 Select 불변식만 공유했다. legacy 추천 후보·다음 질문·DialogueAction 결과를 shadow envelope로 감싸 기존 결과를 변경하지 않는다.
- Select는 hard constraint를 점수보다 우선하고 동점은 안정적인 candidate ID 순서로 결정한다. 입력 evaluation과 기존 추천 상태를 변경하지 않는다.
- `DialogueMove`는 legacy action 정체성을 보존하며 safety 잠금과 추천 취소의 FSM transition을 생성만 한다. reducer 적용과 런타임 소비는 추가하지 않았다.
- `PreferenceEvidence`는 강도, general/session/entity scope, source, 원문 span, 관측 turn을 누적한다. scope·강도·최신성 순으로 기존 `RecommendationState`를 순수 projection한다.
- 검증: Decision shadow·InputUnderstanding·Replay 3 files / 36 tests, 전체 65 files / 859 tests, TypeScript check, ESLint, production build 통과. main 543.44 kB(gzip 162.32 kB), 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-806 FSM 점진 적용이며 safety·ControlIntent 소비부터 독립 변경으로 시작한다.

## 2026-07-22 / Codex / PIPE-804 Understand 계약

- 구현 커밋: `daae94c` (`feat: define input understanding shadow contract`).
- `TurnInput`과 `PrimaryTopic`, `SpeechAct`, `PreferenceSignal`, `Entity`, `ControlIntent`, 턴 단위 `ConversationStateCue`를 동시에 담는 `InputUnderstanding` 계약을 추가했다. 모든 신호는 confidence, source, 원문 evidence span을 가진다.
- 기존 `IntentClassifier` 출력과 추천 신호 추출기를 읽기 전용 shadow adapter로 재사용했다. 런타임 `DialogueService`, 추천 FSM, 상태 reducer에는 연결하지 않았다.
- 낮은 confidence이며 명시 취향·알려진 entity·ControlIntent·질문 답변이 없는 경우만 허용하는 호출 자격과 공급자 중립 `SemanticAssistPort`, fake/no-op adapter를 추가했다.
- validator는 의미 후보와 정확한 원문 span만 허용하며 ControlIntent, 상태 patch, 추천 결과, ResponsePlan 등 추가 필드를 거부한다. 실제 API·공급자·네트워크 코드는 없다.
- 검증: InputUnderstanding·Replay 2 files / 20 tests, 전체 64 files / 843 tests, TypeScript check, ESLint, production build 통과. main 543.44 kB(gzip 162.32 kB), 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-805 Evaluate·Select·Plan shadow다.

## 2026-07-22 / Codex / PIPE-803 Replay 기반

- 구현 커밋: `d5d086c` (`test: add deterministic conversation replay gate`).
- 정규화된 대화 snapshot과 필드별 severity diff runner를 추가했다. safety/FSM/추천 선택과 route/action/ResponsePlan 차이는 자동 실패하고 topic/expression은 검토, 최종 문구 차이는 허용으로 분리했다.
- 기존 `DialogueService`를 직접 재생하는 정적 corpus로 smalltalk→character 후속 대화, 추천 질문 중 safety 잠금, farewell 중 추천 action 차단을 고정했다.
- 문장과 표정 variant는 기존 의도적 랜덤성을 유지하므로 반복 결정성 검사는 상태·분류·선택·계획 필드에 적용한다. 운영 대화 원문 저장, InputUnderstanding, FSM 신규 소비자는 추가하지 않았다.
- 검증: Replay·Continuity·Regression 3 files / 18 tests, 전체 63 files / 827 tests, TypeScript check, ESLint, production build 통과. main 543.44 kB(gzip 162.32 kB), 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-804 Understand 계약이며 실제 API 연결과 런타임 행동 전환은 포함하지 않는다.

## 2026-07-22 / Codex / PIPE-802 WebLLM 제거

- 구현 커밋: `0b29a0e` (`refactor: remove WebLLM runtime`).
- App의 lazy 준비 컴포넌트, controller의 비차단 분석·세션 태그, 전용 hook/component, `src/lib/webllm` 19개 파일, 환경 변수와 `@mlc-ai/web-llm` 의존성을 제거했다.
- `SignalSource`는 현재 사용하는 `rule | question`만 유지하고 Character Layer의 활성 설명을 외부 의미 보조 경계로 갱신했다. IntentClassifier, 추천 FSM, 후보·응답 로직은 변경하지 않았다.
- 검증: 62 files / 823 tests, TypeScript check, ESLint, production build, Conversation Expansion·Continuity 2 files / 20 tests 통과. source/package/lock/dist에서 WebLLM 참조·청크 0건.
- 번들: main 553.16→543.44 kB, gzip 166.01→162.32 kB. WebLLM worker 6,029.70 kB와 lib 5,895.35 kB 청크 제거. 기존 500 kB 경고는 유지.
- 다음 작업은 PIPE-803 Replay 기반이며 InputUnderstanding과 FSM 소비는 포함하지 않는다.

## 2026-07-22 / Codex / PIPE-801 기준선 고정

- 기준 커밋 `ad058ed`의 P0.5 Conversation Expansion과 결정론적 파이프라인 문서 상태를 migration baseline으로 고정했다.
- 전체 검증: 69 files / 856 tests, TypeScript check, ESLint, production build 통과.
- 대표 대화 검증: `conversation-expansion.test.ts`와 `conversation-continuity.test.ts` 2 files / 20 tests 통과.
- 번들 기준: main 553.16 kB(gzip 166.01 kB), WebLLM worker 6,029.70 kB, lib 5,895.35 kB. 기존 500 kB 경고 유지.
- 다음 작업은 PIPE-802 WebLLM 런타임·의존성 제거이며 classifier·FSM 개편은 포함하지 않는다.

## 2026-07-22 / Codex / 결정론적 상호작용 파이프라인 설계 반영

- 추천, 잡담, 스토리, 세션, 캐릭터 이벤트의 목표 구조를 `Input → Understand → Evaluate → Select → Plan → Present`로 통일하고 DEC-029로 승인 결정을 기록했다.
- WebLLM 중심 활성 계획을 대체하고 RST-602~606·Phase 14를 SUPERSEDED 처리했다. 현재 남은 실험 코드는 PIPE-802 제거 대상으로 분리했다.
- PIPE-801~809에 기준선, WebLLM 제거, Replay, InputUnderstanding, Evaluate·Select·DialogueMove·PreferenceEvidence, FSM 점진 적용, 평가 근거, 제한적 API, Present 정리의 범위·테스트·완료 조건을 기록했다.
- 외부 API는 의미 후보와 evidence span만 제안하며 상태·추천·사실·행동·최종 표현을 결정하지 않는 경계를 문서 전체에 동기화했다.
- 검증: `git diff --check`, 활성 WebLLM 재개·Phase 14 DEFERRED 상충 검색, DEC-029·PIPE-800 참조 검색.

## 2026-07-22 / Codex / P0.5 Conversation Expansion 완료

- 새 mode 없이 RecommendationState, ConversationTopic, SuspendedQuestion, ExtractedPreferences를 동시 유지하도록 추천 중 대화 중단/복귀를 연결했다.
- 칵테일 지식, 세계관, 카루아/시에스타, 감정·일상, 범용 지식 질문은 기존 추천 질문을 소비하지 않고 주제별 응답 뒤 같은 질문으로 복귀한다.
- “탄산은 별로지만 사이다는 좋아해”의 낮은 탄산 선호와 “오늘은 독한 게 당겨”의 높은 도수 선호를 추천 상태에 반영한다.
- 자연어 추천 거부가 추천 FSM을 종료하고 conversation mode를 유지하며, 기존 추천 시작 경로로 재진입할 수 있게 했다.
- 검증: 69 files / 856 tests, check, lint, build 통과. 메인 JS 553.16 kB(gzip 166.01 kB). 500 kB 경고는 기존 추적 항목 유지.

## 2026-07-20 / Codex / 시에스타 이벤트 상태 재검수와 기준 문서화

- 시에스타 이벤트가 삭제·주석 처리된 것이 아니라 `SIESTA_EVENTS_ENABLED = false`로 런타임에서 임시 제외된 상태임을 Git 이력과 코드로 확인했다.
- 이벤트 엔진의 7개 분기, 21개 4발화 세트, 세션당 최대 2회, 6턴 쿨다운, 보호 경로 차단과 컨트롤러 연결이 보존된 것을 확인했다.
- 과거 Phase 15 기록의 “이미 런타임 활성화” 판정을 오류로 정정하고, 기획·구현·미구현 차이와 재활성화 게이트를 `SIESTA.md`에 단일 기준으로 기록했다.
- 검증: `siesta-event.test.ts`와 `recommendation-ui.test.tsx` 31 tests 통과. 문서 변경 후 링크·상태 검색과 `git diff --check`를 수행한다.

## 2026-07-20 / Codex / SPR-003 카루아 Sprite Animation 완료

- `KaruaPresentationCue`로 expression·speaking과 `idle/mixing/serving` action을 분리하고, `BartenderSprite`가 구조화 cue만 소비하도록 변경했다.
- 이전 prop 변화로 서빙 컷을 추론하던 로컬 상태를 제거했다. 제조 종료 시 serving cue를 600 ms 표시하고, 초기화·퇴장·safety의 공통 중단 경로에서는 즉시 idle로 복귀한다.
- reduced-motion 환경에서는 CSS뿐 아니라 JS 셰이커 프레임 순환도 중단한다. serving 컷에는 짧은 settle 전환을 적용했다.
- cue·프레임·SSR 렌더링·제조 스케줄 7개 테스트를 추가했다. 활성 표정·셰이커·서빙 PNG는 모두 649×649 캔버스이며 동일 고정 레이아웃을 사용한다.
- 검증: 전체 68 files / 841 tests, check, lint, build, diff check 통과. 메인 JS 550.28 kB(gzip 165.00 kB).

## 2026-07-20 / Codex / AUD-001 Audio 자동 QA 및 런타임 보강

- SFX 상태를 순수 `sfx-runtime`으로 분리해 shake loop, serve one-shot, volume/mute, stop/stopAll, 저장 복구를 독립 검증할 수 있게 했다.
- shake 재생 Promise가 거부된 뒤 내부 루프가 남아 재시도를 막던 문제를 수정하고, 활성 serve one-shot에도 볼륨 변경과 stop 정리가 적용되게 했다. localStorage 접근 자체가 거부되는 환경도 세션 기본값으로 복구한다.
- `BarMusicTab`의 BGM/SFX 분리 라벨, 현재 값, autoplay 차단·음소거·오류 표시 계약을 추가했다.
- 음원 HTTP 확인: `shake.mp3` 200 `audio/mpeg` 257,182 bytes, `serve.wav` 200 `audio/wav` 44,144 bytes.
- 검증: Audio 2 files / 8 tests, 전체 65 files / 834 tests, check, lint, build, diff check 통과. 메인 JS 549.75 kB(gzip 164.81 kB).
- 브라우저 제어 스킬의 런타임이 로컬 경로 오류로 시작되지 않아 실제 클릭·청취 검수는 수행하지 못했다. AUD-001은 REVIEW를 유지한다.

## 2026-07-20 / Codex / 로드맵 정합성 재검수

- 완료된 Phase 2~15 항목에 남아 있던 `현재 작업` 표기를 제거하고 현재 대화·테스트·번들 상태를 실제 구현과 맞췄다.
- RST-601은 Phase 12의 Worker·기본 OFF·격리·실패 복구 범위가 종료됐으므로 DONE으로 판정했다. 지원 GPU 모델 실행은 RST-602로 계속 DEFERRED다.
- Audio Step 2~4는 SFX 채널·제조/서빙 cue·볼륨/음소거 UI가 이미 구현된 것을 확인했다. 전용 자동 테스트와 실제 재생 검수가 없어 DONE이 아닌 `AUD-001 REVIEW`로 통합했다.
- 다음 종료 작업은 AUD-001이며, 이후 SPR-003을 승인·착수한다. SPR-004~005, FLOW-003, WebLLM RST-602~606은 기존 PROPOSED/DEFERRED 상태를 유지한다.
- 검증: WebLLM 7개 파일 + 스프라이트 계약 1개 파일, 총 35 tests 통과. 문서 상태 검색과 `git diff --check` 통과.

## 2026-07-20 / Codex / Phase 15 최종 카루아 캐릭터 QA 완료

- 카루아 금지 표현을 `KARUA_FORBIDDEN_EXPRESSIONS` 단일 계약으로 통합하고, 전체 말투 회귀가 이 프로필을 직접 사용하도록 변경했다.
- ResponsePlan·대화 JSON·keyword rule·formatter의 상담가/AI 도우미/고객센터형 표현을 관찰과 잔 선택 중심의 바텐더 화법으로 교체했다.
- 시에스타 만담 속 카루아 발화와 Action 기본 fallback을 자동 감사 범위에 추가했다. 시에스타 이벤트는 이미 런타임에 활성화되어 있어 기존 차단·쿨다운·대화권 반환 계약을 유지한다.
- 검증: `npm.cmd test -- --run` (63 files, 826 tests), `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build`, `git diff --check` 통과. 메인 JS 549.55 kB(gzip 164.64 kB).

## 2026-07-15 / Codex / SPR-002 화면 검수 완료

- production preview에서 카루아 기본 스프라이트를 확인했다. 데스크톱 1280×800 viewport에서는 360×360px, 모바일 375×812 viewport에서는 180×180px로 표시됐고 두 화면 모두 viewport 안에 완전히 들어왔다.
- `sprites.test.ts` 2개, `npm.cmd run check`, `npm.cmd run lint`를 통과했다. 모든 `Expression` 이미지·fallback 슬롯 계약과 실제 기본 표시 레이아웃을 함께 확인해 SPR-002를 DONE으로 전환한다.

## 2026-07-14 / Codex / Phase 12 실측 완료 및 Phase 13 보류 결정

- 실제 Chrome에서 `VITE_WEB_LLM_PRELOAD_ENABLED=true`, `VITE_WEB_LLM_SEMANTIC_ENABLED=true`로 WebLLM 준비를 실행했다. WebGPU API, 16 GB memory, 16 CPU는 감지됐으나 호환 GPU를 확보하지 못했다.
- cold prepare는 약 375 ms에 `preparation-failed`로 종료되고 세션이 비활성화됐다. 모델 다운로드는 시작되지 않았고, warm prepare는 `session-disabled`로 즉시 생략됐다.
- `capability`, `loader`, `service`, `semantic-contract` 테스트 4 files / 24 tests가 통과했다. timeout 시 세션 비활성화와 WebLLM의 ResponsePlan·Recommendation·Action·FSM 미의존 계약을 검증한다.
- Phase 13은 **보류**로 결정한다. 현 환경에서의 준비 실패와 사용자 응답에 주는 가치가 비용을 정당화하지 못하므로 Phase 14를 착수하지 않고 기존 JSON/FSM/Rule Engine을 유지한다.

## 2026-07-14 / Codex / P2 모바일·키보드 실제 검수

- production preview를 375×812 모바일 viewport로 열어 메뉴를 dialog로 열고, ESC 닫기와 원래 메뉴 트리거 포커스 복귀를 확인했다.
- 메뉴 마지막 탭에서 Tab을 누르면 닫기 버튼으로 순환하는 것을 확인했다.
- 375×400 가상 키보드 높이에서 입력창은 y=293.61~339.61, 전송 버튼은 y=294.61~338.61으로 모두 viewport 안에 남았다.
- 입력값이 있는 상태에서 Enter 제출 후 입력값이 초기화되고 전송 버튼이 비활성화되는 것을 확인했다.
- P2를 DONE으로 판정한다. CocktailCard의 dialog·focus trap 계약은 기존 UI 회귀 테스트가 유지한다.

## 2026-07-14 / Codex / P4 초기 로딩 최적화 및 P5 문서 동기화

- `BartenderSprite` 마운트 시 정적 표정 9장과 셰이커 프레임 4장을 모두 내려받던 선로딩을 제거했다. 첫 화면은 현재 표현에 필요한 이미지 하나만 요청하며, 셰이커 프레임은 실제 제조 동작에서만 요청한다.
- 기본 OFF인 WebLLM 준비 훅을 `ExperimentalWebLLMPreparation` 지연 청크로 분리했다. 개발 모드 또는 `VITE_WEB_LLM_PRELOAD_ENABLED=true`에서만 로드하므로 기본 production 진입 경로는 WebLLM 준비 요청을 만들지 않는다.
- 검증: `npm.cmd test -- --run` (63 files, 824 tests), `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build` 통과. 메인 JS 549.33 kB(gzip 164.52 kB), WebLLM worker 6,029.70 kB와 lib 5,895.35 kB는 별도 청크다.
- production Network 검증: 기본 OFF에서 입장 후 카루아 현재 표정 PNG 1장만 요청되고 WebLLM 청크는 0건이었다. `VITE_WEB_LLM_PRELOAD_ENABLED=true` 빌드에서는 `ExperimentalWebLLMPreparation`, `lib`, `webllm.worker` 요청이 발생했다.
- P4는 이미지·WebLLM 로딩 격리와 ON/OFF 실측을 마쳐 DONE으로 판정한다. 메인 JS 549.33 kB 경고는 향후 기능 단위 분할 때 재검토한다. P5는 README, CURRENT_STATE, TASK_BOARD, WORK_LOG를 동기화해 DONE으로 판정했다.

## 2026-07-13 / Codex / SPR-002 talk fallback 확정

- `talk`은 별도 PNG를 제작하지 않고 `idle` 이미지를 의도적으로 공유하기로 확정했다. 타이핑 표시와 대사 변화가 발화감을 담당한다.
- SPR-002는 데스크톱·모바일 수동 화면 검수만 남은 REVIEW 상태다. 현재 브라우저 연결이 없어 해당 검수는 수행하지 못했다.
- 검증: `git diff --check` 통과.

## 2026-07-13 / Codex / 외부 구조 보고서 최신화

- `EXTERNAL_STRUCTURE_REPORT.md`에 카루아 `sprites.ts` 에셋 진입점과 `Expression` 기반 정적 스프라이트 계약을 반영했다.
- `upset.png`가 별도 대화 타입이 아닌 `stern` 이미지 자산이라는 경계와, 노출 시간·자동 복귀 정책은 아직 구조에 포함하지 않았다는 점을 명시했다.
- 검증: `git diff --check` 통과.

## 2026-07-13 / Codex / SPR-002 표정 PNG 5종 연결

- 새 `sympathy`, `surprised`, `disappointed`, `annoyed` PNG를 동명 `Expression` 슬롯에 연결했다.
- `upset.png`는 별도 `Expression`을 추가하지 않고, 기존 safety 경계 표현인 `stern` 슬롯에 연결했다.
- 이제 `talk`만 `idle` fallback을 사용한다.
- 검증: `npm.cmd test -- sprites.test.ts --run` (2개), `npm.cmd run check`, `npm.cmd run build`, `git diff --check` 통과. 메인 JS 535.04 kB, gzip 160.22 kB.

## 2026-07-13 / Codex / 후속 로드맵 정렬

- Dialogue는 `Phase 12 안정화 + WebLLM 실측`을 하나의 종료 단계로 묶고, Character QA 병행 → Phase 13 활용 결정 gate → Phase 14 ResponsePlan 보조 선택 → Phase 15 최종 QA 순서로 정리했다.
- Presentation은 PNG 제작 → 카루아 애니메이션 → 시에스타 표시 → 이벤트 동기화로 재정렬했다. 기존 에셋 제작 가이드는 SPR-002 완료 조건에 흡수했다.
- Audio는 기본 BGM UI가 Step 1에서 완료됐으므로 Step 4를 새 UI가 아닌 Audio UX 보강으로 정의했다.
- 검증: 문서 정합성 검토 및 `git diff --check` 통과.

## 2026-07-13 / Codex / SPR-001 캐릭터 스프라이트 슬롯 계약

- `karua/sprites.ts`에 모든 `Expression`의 명시적 fallback 맵을 추가했다. 기준 디자인은 현재 런타임의 `Kaura.png`이며, 미제작 표정은 `idle`, `disappointed`는 `embarrassed`로 표시한다.
- `sprites.test.ts`로 모든 표현 슬롯의 이미지와 fallback 슬롯 존재를 고정했다.
- `TASK_BOARD.md`와 `CURRENT_STATE.md`에 기준 디자인, 표시 크기, 다음 스프라이트 작업 경계를 반영했다.
- 검증: `npm.cmd test -- sprites.test.ts --run` (2개), `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build`, `git diff --check` 통과.

## 2026-07-10 / Codex / Phase 12 semantic layer stabilization start

- WebLLM 의미 결과를 `WebLLMSemanticSnapshot`으로 명명하고, 현재 출력·ResponsePlan·Recommendation·Action·FSM에 연결하지 않는 Phase 12 경계를 코드 계약으로 고정했다.
- 실제 `IntentType` 기준 eligible route를 정리해 general-chat, mood-talk, quiet-talk, bar-atmosphere, weather-talk, uncertain-talk만 의미 분석 대상으로 허용했다.
- `window.__RESTATION_WEBLLM__.snapshot()` 관측 API를 추가해 enabled, prepared, sessionTags, lastResult, lastFailure, statistics를 확인할 수 있게 했다.
- `semantic-contract.test.ts`와 WebLLM service 테스트를 추가·정리해 금지 경로, invalid JSON 폐기, unknown tag 폐기, diagnostics 기록, core response/recommendation/action/FSM의 WebLLM 미의존을 검증했다.
- 남은 Phase 12 종료 작업: 실제 브라우저 preload/prepare, cold start, warm start, timeout, 모델 다운로드 크기와 준비 시간 수동 기록.
- Verification: `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` passed. Current Vitest total: 49 files, 769 tests.

## 2026-07-10 / Codex / Phase 11 source ownership closure

- `response-templates`, `story-query`, `welcome-drink`, `farewell-replies`에 Phase 11 이후 표현 출처 소유권 계약을 추가했다.
- ResponsePlan-backed legacy category와 required JSON fallback category의 경계를 테스트로 고정했다.
- 검증: `npm.cmd test`, `npm.cmd run check`, `git diff --check` 통과. 현재 Vitest 765개 통과.

## 2026-07-10 / Codex / Audio System 1차 도입

- `useAudioManager`를 추가해 YouTube BGM player lifecycle, preset 선택, play/pause, volume/mute, localStorage 저장/복원을 앱 수준 책임으로 이동했다.
- `BarMusicTab`은 Audio Manager 상태를 표시하고 조작하는 UI-only 컴포넌트로 전환하고, `Sidebar`/`App`이 오디오 상태를 주입하도록 연결했다.
- SFX channel, shaker loop, serving one-shot, reset/exit/safety stopAllSfx는 2차 범위로 남겼다.
- Verification: `npm.cmd run check`, `npm.cmd test -- recommendation-ui` passed.

## 2026-07-10 / Codex / Phase 11 DONE 문서 정리

- `CURRENT_STATE.md`와 `TASK_BOARD.md`에서 Phase 11 Dialogue Source Normalization을 DONE으로 정리했다.
- ResponsePlan-backed legacy category 삭제, required legacy fallback 유지, 표현 소유권 정리, Character QA 확장 완료를 Phase 11 종료 조건으로 기록했다.
- Interaction Timeline, Rapport, WebLLM 런타임 통합은 Phase 11 밖의 후속 범위로 분리했다.
- Verification: `npm.cmd test`, `npm.cmd run build`, `git diff --check` passed.

## 2026-07-10 / Codex / Interaction cue first extraction

- Audited `useRestationController` presentation responsibilities: typing, preparation, serving reveal, screen shake, delayed outside transition, and queued interactions.
- Classified `clearPendingWork`, `bartenderReply`, `runCocktailPreparation`, safety lock, recommendation cancel, and session block handling as mixed domain/timeline boundaries that should stay in the controller for now.
- Extracted only the repeated pure `screenShake` serving cue into `playScreenShakeCue()` and reused it from XYZ, welcome drink, recommendation serve, and card-order serve paths.
- Verification: `npm.cmd test` and `npm.cmd run check` passed.

## 2026-07-10 / Codex / Phase 11 follow-up architecture audit

- Extended `karua-speech-contract.test.ts` so Character QA scans `RESPONSE_PLANS` text directly after `dialogues.json` fallback-only deletion.
- Reviewed Rapport usage: state updates exist and `selectVariation()` is available, but current runtime does not use rapport to select ResponsePlan/dialogue output.
- Reviewed WebLLM role: current implementation remains semantic-only, eligible for limited free-talk routes, stores session tags, and does not generate final replies.
- Reviewed interaction timeline: typing, preparation, serving reveal, screen shake, and queued interactions are still coordinated in `useRestationController`, making a future `InteractionTimeline` layer a clear extraction candidate.
- Verification: `npm.cmd test`, `npm.cmd run check`, and `git diff --check` passed.

## 2026-07-10 / Codex / Phase 11 dialogues.json fallback-only deletion

- Removed all ResponsePlan-backed fallback-only categories from `dialogues.json`; `fallback-required` legacy categories remain owned by JSON.
- Updated Phase 11 inventory tests so `keywordRuleDeletionPendingCategories` is empty and deleted categories are explicitly documented as ResponsePlan-only.
- Reworked `response-plan-adapter.test.ts` and `engine.test.ts` to read migrated dialogue text from ResponsePlan instead of deleted JSON pools.
- Verification: `npm.cmd test`, `npm.cmd run check`, `npm.cmd run build`, and `git diff --check` passed.

## 2026-07-10 / Codex / Phase 11 pre-delete test contract split

- `dialogue-source-inventory.test.ts` now separates `ResponsePlan-only ready`, `fallback-required`, and `deletion-pending JSON fallback` categories before any `dialogues.json` deletion.
- Added `response-plan-route-smoke.test.ts` to cover high-risk Phase 11 routes (`water-request`, `overdrunk`, `rude-*`, `mood-*`, `siesta-setting`, etc.) through classifier + engine rendering.
- No `dialogues.json` category was deleted in this step.
- Verification: `npm.cmd test -- dialogue-source-inventory response-plan-route-smoke response-plan-adapter response-templates`, `npm.cmd run check` passed.

## 2026-07-09 / Codex / Phase 11 story/welcome/farewell fallback 출처 점검

- `story-query.ts`에서 칵테일 fact 선택 책임을 `selectCocktailContentFact()`로 분리하고, 선택된 fact를 최종 응답 형태로 감싸는 `formatStoryQueryFactReply()`를 추가했다. 기존 `formatStoryQueryReply()` API와 반환 형태는 유지했다.
- `welcome-drink.ts`와 `farewell-replies.ts`는 Phase 10 이관 후에도 `plans: []` 또는 invalid ResponsePlan에서 legacy formatter로 내려가는 테스트가 남아 있어, 현재 legacy fallback은 아직 실제 안전망으로 필요하다고 판단했다.
- `dialogue-source-inventory.test.ts`에 전체 `dialogues.json` category 중 ResponsePlan이 이미 소유하고 JSON은 fallback-only로 남은 삭제 후보 목록을 고정했다. 삭제는 수행하지 않았다.
- 검증: `npm.cmd test -- story-query welcome-drink farewell-replies dialogue-source-inventory`, `npm.cmd run check` 통과.

## 2026-07-09 / Codex / response-templates 출처 계약 정리

- `response-templates.ts`에 fallback 출처 판별 함수와 inline draft 출처 목록을 추가했다. `dialogueCategory`가 있는 template의 fallback은 ResponsePlan/JSON 실패 시 안전문구이고, `exit-intent`, `mood:default`, `taste:default`만 이 파일이 직접 소유하는 기본 fallback으로 고정했다.
- `dialogue-service.ts`의 셰이킹 주문 응답 하드코딩을 `formatShakeOrderDraft()` 호출로 통합해 같은 문구의 소유 출처를 `response-templates.ts` 한 곳으로 줄였다.
- `response-templates.test.ts`가 fallback 소유권과 남은 inline draft 출처를 문서화하도록 갱신했다.
- 검증: `npm.cmd test -- response-templates dialogue-source-inventory`, `npm.cmd run check` 통과.

## 2026-07-09 / Codex / 셰이킹 없는 서빙 컷 표시

- `BartenderSprite`가 `isServingCocktail` 플래그를 받아 셰이킹 루프 없이도 `SERVE` 컷을 표시할 수 있게 했다.
- `useRestationController`는 recipe text에 흔들기 계열 표현이 없는 칵테일을 서빙할 때 셰이킹 루프를 생략하고 서빙 컷만 보여준다. 흔들기 계열 칵테일은 기존 셰이킹 흐름을 유지한다.
- `App.tsx`가 새 서빙 플래그를 스프라이트로 전달하고, UI 렌더 테스트에 셰이킹 없이 `SERVE` cue가 표시되는 계약을 추가했다.
- 검증: `npm.cmd test -- recommendation-ui`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` 통과. 현재 Vitest 703개 통과.

## 2026-07-09 / Codex / Phase 11 대사 출처 인벤토리 착수

- `response-plan-adapter.ts`가 현재 ResponsePlan으로 이관된 대사 카테고리 목록과 판별 함수를 명시적으로 내보내도록 했다.
- `dialogue-source-inventory.test.ts`를 추가해 `keyword-rules.json`의 `dialogueCategory`가 알려진 출처로 해석되는지, 이관 카테고리가 아직 legacy fallback 라인을 유지하는지, ResponsePlan 단독 렌더링이 가능한지 고정했다.
- `keyword-rules.json` 기준 legacy-only 카테고리 목록을 테스트로 고정하고, 첫 안전 이관 대상으로 `guest-uncertain` 8개 라인을 ResponsePlan에 복사 연결했다. 기존 `dialogues.json` 라인은 삭제하지 않았다.
- 같은 방식으로 `quiet-moment` 8개 라인을 ResponsePlan에 복사 연결했다. 기존 `dialogues.json` 라인은 삭제하지 않았다.
- `greeting` 10개 라인을 ResponsePlan에 복사 연결했다. 앱 첫 입장/웰컴드링크 흐름은 변경하지 않고 keyword-rule category 응답 경로만 이관했다.
- `siesta-mention` 10개 라인을 ResponsePlan에 복사 연결했다. 시에스타 이벤트/관계성 로직은 변경하지 않고 keyword-rule category 응답 경로만 이관했다.
- `water-request` 8개 라인과 `overdrunk` 10개 라인을 ResponsePlan에 복사 연결했다. 물 요청/과음 케어 응답의 문구만 이관하고 safety/session/action 로직은 변경하지 않았다.
- 남은 keyword-rule legacy category인 `ingredient-constraint`, `real-world-info`, `rude-annoyed`, `rude-boundary`, `cocktail-request`, `taste-sweet`, `taste-strong`도 ResponsePlan에 복사 연결했다. 추천·제외 재료·실매장 안내·무례 대응의 판단 로직은 변경하지 않았다.
- keyword-rule이 참조하는 모든 `dialogueCategory`가 ResponsePlan으로 렌더링되며, 기존 `dialogues.json` 라인은 삭제하지 않고 fallback으로 유지한다.
- keyword-rule 경로의 ResponsePlan-only 렌더링 테스트, invalid ResponsePlan 주입 시 legacy fallback으로 내려가는 테스트, category-by-category 삭제 후보 목록 테스트를 추가했다. `response-templates` 계약은 JSON pool 고정이 아니라 JSON fallback 또는 ResponsePlan source 중 하나를 허용하도록 갱신했다.
- 검증: `npm.cmd test -- dialogue-source-inventory response-plan-adapter response-templates`, `npm.cmd run check`, `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build` 통과. 현재 Vitest 706개 통과.

## 2026-07-09 / Codex / mission_control 문서 포털 1차 압축

- `HANDOVER.md`의 중복 상태 요약을 제거하고, 다음 작업자가 바로 이어받을 행동 맥락·주의사항·검증 기준만 남겼다. 현재 상태는 `CURRENT_STATE.md`, 작업 계획은 `TASK_BOARD.md`, 상세 이력은 `WORK_LOG.md`가 소유한다.
- `CURRENT_LOGIC_FOCUS.md`의 현재 로직 메모를 검토했다. 제품 루프는 `PROJECT_VISION.md`, 세션 종료 기준은 `SESSION_FLOW_SPEC.md`, 구조 경계는 `EXTERNAL_STRUCTURE_REPORT.md`가 이미 소유하므로 별도 문서 책임이 남지 않았다.
- `REFACTORING_LOG.md`의 REF-SESSION-001/002 기록은 기존 `WORK_LOG.md`의 `2026-06-25 / REF-SESSION-001~002 / 세션 컨트롤러 책임 축소` 1줄 요약이 소유하도록 정리했다.
- `WEBLLM_EXPERIMENT.md`의 장기 원칙은 `DECISIONS.md`, `ARCHITECTURE.md`, `EXTERNAL_STRUCTURE_REPORT.md`로 흡수하고, 실험 이력은 기존 WebLLM 작업 로그가 소유하도록 정리했다.
- `HANDOVER.md`와 `CURRENT_STATE.md`는 병합하지 않기로 판단했다. `CURRENT_STATE.md`는 현재 상태 스냅샷, `HANDOVER.md`는 다음 작업자가 바로 이어받을 행동 맥락을 소유하되, 이후 `HANDOVER.md`의 중복 상태 요약은 축소 대상이다.
- 세 문서를 삭제하고 `README.md`의 읽기 경로와 정보 소유권을 갱신했다.
- 검증: 문서 작업. 코드 변경 없음.

## 2026-07-09 / Codex / Phase 10 farewell phase/block replies Farewell Formatter

- `formatFarewellConversationReply()`의 farewell phase conversation 5종을 ResponsePlan으로 이관했다: `no-xyz-ejection`, `no-xyz-generic`, `xyz-ejection`, `xyz-why`, `xyz-generic`.
- `formatFarewellBlockReply()`와 `formatReturnHomeReply()`는 문자열 API를 유지하고, `formatFarewellBlockResponse()` / `formatReturnHomeResponse()`가 ResponsePlan 우선·legacy fallback `{ text, expression }`을 반환한다.
- semantic slot은 만들지 않았고 각 ResponsePlanLine이 final text와 expression을 직접 소유한다. ejection concern 감지, hasXyz 판단, farewell turn count, returnHome 전이, ordering block, safety, DialogueService, Action, Router, CocktailCard는 변경하지 않았다.
- 컨트롤러의 farewell block / return-home 경로는 ResponsePlan expression을 사용하도록 연결했다.
- Phase 10 Farewell Formatter와 Phase 10 ResponsePlan DB 리팩토링은 완료 상태로 본다. 다음은 Phase 11 대사 출처 정상화다.
- 검증: targeted Vitest 3개 파일·85개 테스트, 전체 Vitest 46개 파일·697개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 538.46 kB, gzip 159.63 kB.

## 2026-07-09 / Codex / Phase 10 welcome-farewell XYZ Farewell Formatter

- `formatWelcomeFarewellXyzReply()` welcome-farewell XYZ final body만 ResponsePlan으로 이관했다.
- 허용 slot은 이미 선택된 `{cocktail_name}` 하나뿐이며 ResponsePlanLine이 final text와 `smirk` expression을 직접 소유한다.
- 기존 문자열 API `formatWelcomeFarewellXyzReply()`는 유지하고, `formatWelcomeFarewellXyzResponse()`가 ResponsePlan 우선·legacy fallback `{ text, expression }`을 반환한다.
- welcome-farewell 컨트롤러 경로는 ResponsePlan expression을 사용하되, welcome-farewell entry decision, XYZ selection, session-flow, phase transition, safety, DialogueService, Action, Router, CocktailCard는 변경하지 않았다.
- 남은 Farewell slice는 farewell phase / block replies다. Phase 10은 아직 완료로 표시하지 않는다.
- 검증: Vitest 46개 파일·679개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 534.20 kB, gzip 158.80 kB.

## 2026-07-09 / Codex / Phase 10 regular XYZ Farewell Formatter

- `formatXyzReply()` regular XYZ final body만 ResponsePlan으로 이관했다.
- 허용 slot은 이미 선택된 `{cocktail_name}` 하나뿐이며 ResponsePlanLine이 final text와 `smirk` expression을 직접 소유한다.
- 기존 문자열 API `formatXyzReply()`는 유지하고, `formatXyzResponse()`가 ResponsePlan 우선·legacy fallback `{ text, expression }`을 반환한다.
- 표준 XYZ 컨트롤러 경로는 ResponsePlan expression을 사용하되, XYZ cocktail selection, serving-plan, alcohol accumulation, session-flow, DialogueService, FSM, SessionState, CocktailCard, unlock, safety는 변경하지 않았다.
- 남은 Farewell slices는 welcome-farewell XYZ / welcome-missed replies, farewell phase / block replies다. Phase 10은 아직 완료로 표시하지 않는다.
- 검증: Vitest 46개 파일·673개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 533.35 kB, gzip 158.62 kB.

## 2026-07-08 / Codex / Phase 10 welcome XYZ clarification Farewell Formatter

- `formatWelcomeXyzClarificationReply()` welcome-drink XYZ clarification body만 ResponsePlan으로 이관했다.
- semantic slot 없이 ResponsePlanLine이 final text와 `smirk` expression을 직접 소유한다.
- XYZ selection, welcome detection, session state, phase transition, DialogueService, Router, IntentClassifier, safety, CocktailCard, unlock timing, serving animation은 변경하지 않았다.
- ResponsePlan 부재·검증 실패·금지 slot·invalid expression은 기존 farewell formatter로 안전하게 fallback한다.
- 남은 Farewell slices는 XYZ / welcome-missed main replies, farewell phase / block replies다. Phase 10은 아직 완료로 표시하지 않는다.
- 검증: Vitest 46개 파일·666개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 532.48 kB, gzip 158.46 kB.

## 2026-07-08 / Codex / 외부 구조 보고서 프로젝트 구조 최신화

- `rg --files` 기준으로 루트 운영 문서와 실제 앱 경로 `bar_tend/`의 현재 구조를 다시 확인했다.
- `EXTERNAL_STRUCTURE_REPORT.md`의 상단 기준, 주요 파일 지도, CocktailCard 버튼 계약, Recommendation/Welcome Formatter 책임, 검증 상태와 빌드 산출물 수치를 갱신했다.
- 검증: `npm.cmd test` 46개 파일·654개 테스트 통과, `npm.cmd run build` 통과, `npm.cmd run lint` 통과. 메인 JS 531.18 kB, gzip 158.22 kB.

## 2026-07-08 / Codex / Phase 10 standard farewell entry Formatter

- `formatStandardFarewellEntryReply()` standard farewell entry body만 ResponsePlan으로 이관했다.
- semantic slot 없이 ResponsePlanLine이 final text와 `sympathy` expression을 직접 소유한다.
- `decideFarewellEntry()`, `beginFarewell()`, `enter-farewell`, phase transition, XYZ/welcome-missed replies, farewell block/conversation/returnHome replies, safety, unlock timing, serving animation, CocktailCard는 변경하지 않았다.
- ResponsePlan 부재·검증 실패·누락 line·invalid expression·금지 slot은 기존 farewell formatter로 안전하게 fallback한다.
- 남은 Farewell slices는 XYZ / welcome-missed replies, farewell phase / block replies다. Phase 10은 아직 완료로 표시하지 않는다.
- 검증: Vitest 46개 파일·660개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 531.93 kB, gzip 158.38 kB.

## 2026-07-08 / Codex / Phase 10 welcome feedback + Farewell boundary

- welcome feedback final presentation만 ResponsePlan으로 이관했다.
- feedback ResponsePlan은 semantic slot 없이 positive/lighter/sweeter/alternate/neutral state별 text/expression을 직접 소유한다.
- `welcomeDrink.served/resolved`, welcome selection, feedback answer detection, SessionState, Action, Router, DialogueService, safety, XYZ/farewell, CocktailCard는 변경하지 않았다.
- Welcome Formatter body+feedback 전체 검증을 통과해 Welcome Formatter를 완료 상태로 기록한다.
- Farewell Formatter는 조사만 수행했다. trigger와 transition은 `useRestationController.ts`, `dialogue-session.ts`, `session-flow.ts`, `serving-plan.ts`가 소유하고, presentation 후보는 `farewell-replies.ts`에 있다.
- 추천 첫 Farewell slice는 `formatStandardFarewellEntryReply()` 단일 body다. session transition, XYZ selection, unlock, safety, CocktailCard는 이관하지 않는다.
- 검증: Vitest 46개 파일·654개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 531.18 kB, gzip 158.22 kB.

## 2026-07-08 / Codex / Phase 10 welcome-drink body Welcome Formatter

- welcome-drink 최종 응답 본문만 ResponsePlan으로 이관했다.
- `{cocktail_name}`, `{talking_point}`만 허용 slot으로 사용하고, 각 ResponsePlanLine이 `smirk` expression을 직접 소유한다.
- welcome drink selection, `welcomeDrink.served/resolved`, feedback, unlock/serving flow, alcohol accumulation, XYZ/farewell, CocktailCard는 변경하지 않았다.
- ResponsePlan 부재·검증 실패·누락/금지 slot은 기존 welcome formatter로 안전하게 fallback한다.
- Welcome Formatter slice 1은 완료했다. Phase 10 전체 완료와는 구분하며 welcome feedback/farewell이 남은 Phase 10 대상이다.
- 검증: Vitest 46개 파일·644개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 528.78 kB, gzip 157.70 kB.

## 2026-07-08 / Codex / Phase 10 acknowledgement-lead-in Recommendation Formatter

- 추천 질문 acknowledgement/lead-in/continuation/prompt 조립만 ResponsePlan으로 이관했다.
- `{question_label}`, `{acknowledgement}`, `{lead_in}`, `{continuation}`만 허용 slot으로 사용하고, 각 ResponsePlanLine이 expression을 직접 소유한다.
- 질문 선택·질문 순서·slot filling·signal extraction·`잘 모르겠어요`·`카루아에게 맡기기`·추천 완료 로직·exact/randomPick/nearest 본문은 변경하지 않았다.
- ResponsePlan 부재·검증 실패·누락/금지 slot은 기존 question formatter로 안전하게 fallback한다.
- Recommendation Formatter는 4/4 완료했다. Phase 10 전체 완료와는 구분하며 welcome/farewell이 남은 Phase 10 대상이다.
- 검증: Vitest 46개 파일·634개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 526.93 kB, gzip 157.36 kB.

## 2026-07-08 / Codex / Phase 10 nearest fallback Recommendation Formatter

- exact match 실패 뒤 이미 선택된 nearest cocktail의 최종 본문만 ResponsePlan으로 이관했다.
- affect별 8개 plan이 `{cocktail_name}`, `{fallback_reason}`, `{talking_point}`를 배치하고 기존 expression을 직접 소유한다.
- opening·acknowledgement, 후보 필터·거리 계산·nearest 선택·추천 사유·talking point 선택은 변경하지 않았다.
- plan 부재·검증 실패·누락/금지 slot은 기존 formatter로 안전하게 복귀한다.
- 검증: Vitest 46개 파일·623개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 525.67 kB, gzip 156.01 kB.

## 2026-07-06 / UI 개선 — 레이아웃·스크롤·추천 선택지 위치 변경

- **레이아웃 보호**: 캐릭터 영역(stage)이 창 크기에 따라 먼저 찌그러지던 문제 수정. stage에 `flex-shrink: 0`, `min-height: calc(60vh - 60px)` 적용, chat-dock을 `flex: 1`로 변경
- **캐릭터 이미지**: `height: clamp(180px, 36vh, 360px)` → `height: 100%` + min/max로 변경, viewport 높이에 직접 반응하지 않도록 수정
- **입력창+버튼 그룹화**: ChatInput과 하단 버튼바를 `chat-input-wrap`으로 묶고 높이 기준(`max-height: 600px`)으로 같은 줄(row) 전환 트리거 추가
- **추천 선택지 이동**: `recommendation-choices`를 ChatInput → DialogueBox 내부(메시지 영역 최하단)로 이동
- **자동 스크롤 개선**: 유저가 위로 스크롤하면 자동 스크롤 중단, 최하단일 때만 새 메시지 따라가도록 `onScroll` 핸들링 추가
- **컨테이너 여백 축소**: `.recommendation-choices` padding/gap 0, DialogueBox 하단 패딩 `p-6` → `pb-3`, chat-input-shell form 하단 패딩 절반으로 축소
- **기타**: 미사용 코드(`Suspense`, `RapportDebugDisplay`, `rapport`) 정리, 테스트 수정
- **검증**: TypeScript, Vitest 610개 통과
- **미커밋** (검수 후 커밋 예정)

## 2026-07-06 / Card action buttons 변경

- CocktailCard의 "다시 추천받기" 버튼을 "주문하기"·"이야기하기" 두 버튼으로 교체했다.
- "주문하기"는 현 칵테일을 즉시 주문/서빙한다. `handleOrderCocktail(cocktail)`을 호출하며 주문→제조→서빙 전 과정을 실행한다.
- "이야기하기"는 카드를 닫고 칵테일명을 포함한 story-query를 전송해 카루아가 이야기를 들려주는 흐름으로 전환한다. 새 `handleCardStory`/`performCardStory`를 추가했으며 queue 지원(`story-from-card` 타입)도 포함했다.
- `handleReRecommend`/`performReRecommend` 및 `canReRecommend`는 제거하고 `canCardActions`로 대체했다.
- 2026-07-08 안정화: 닫기·주문하기·이야기하기 버튼에 `type="button"`을 명시하고 UI 렌더링 계약에 3개 버튼 타입 검증을 추가했다.
- 검증: Vitest 46개 파일·610개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 524.64 kB, gzip 155.80 kB.
- 브라우저 수동 검증은 인앱 브라우저 연결 후 수행할 항목으로 남아 있다.

## 2026-07-03 / Codex / Phase 10 exact Recommendation Formatter

- RecommendationDecision 이후 이미 결정된 cocktail name·reason·talking point를 조립하는 exact recommendation 최종 본문만 ResponsePlan으로 이관했다.
- affect별 8개 plan의 모든 line이 text/expression을 직접 소유하며 제한 slot `{cocktail_name}`, `{cocktail_name_subject}`, `{reason}`, `{talking_point}`만 렌더링한다.
- opening·acknowledgement는 기존 경계에 남기고 plan 선택·검증·slot 치환 실패 시 기존 formatter로 fallback한다.
- Recommendation Engine·Decision·opening 선택/회피·reason/talking point 선택·FSM·Action·SessionState·Context는 변경하지 않았다.
- 검증: Vitest 46개 파일·609개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 523.89 kB, gzip 155.58 kB.

## 2026-07-03 / Codex / Phase 9~10 readiness 문서 통합

- 전환기 문서 `PHASE_9_10_READINESS.md`의 보존 가치가 있는 내용을 기존 책임 문서로 통합했다.
- Phase 10 시작 시점 출처 인벤토리는 `EXTERNAL_STRUCTURE_REPORT.md`, 지속 계약과 금지선은 `TASK_BOARD.md`, Phase 9 검수와 도입 이력은 기존 `WORK_LOG.md` 기록을 기준으로 유지한다.
- 현재 상태는 `CURRENT_STATE.md`, 인수인계는 `HANDOVER.md`, 상세 구조와 Phase 10 진행률은 `EXTERNAL_STRUCTURE_REPORT.md`를 단일 기준으로 사용한다.
- 중복 갱신과 상태 드리프트를 막기 위해 readiness 문서를 활성 문서 목록에서 제거했다.

## 2026-07-03 / Codex / Phase 10 randomPick Recommendation Formatter

- 이미 선택된 opening·cocktail·talking point를 받아 randomPick 최종 본문만 ResponsePlan으로 조립한다.
- 순수 slot renderer는 `{cocktail_name}`, `{talking_point}`만 허용하며 plan 선택·검증·치환 실패 시 기존 formatter로 fallback한다.
- 랜덤 칵테일 선택, opening ranking/최근 ID 회피, talking point 선택, RecommendationDecision, FSM·Action·Session·Context는 변경하지 않았다.
- ResponsePlan `smirk`와 기존 `playful → smirk` expression 동등성을 검증했다.
- 검증: Vitest 46개 파일·598개 테스트, typecheck, lint, build 통과. 메인 JS 521.31 kB, gzip 154.91 kB.

## 2026-07-03 / Codex / Phase 10 ResponsePlanLine 필수 expression 계약

- ResponsePlanLine의 expression을 필수화하고 block에서 문자열 line을 금지했다.
- validator가 문자열 line과 expression 누락을 명시적으로 거부하며 adapter는 검증된 line expression만 사용한다.
- 기존 14개 카테고리·108개 문장의 필수 계약, JSON 빈 배열 독립성, 미이관 legacy fallback을 유지했다.
- 검증: Vitest 45개 파일·590개 테스트, typecheck, lint, build 통과. 메인 JS 520.28 kB, gzip 154.60 kB.

## 2026-07-03 / Codex / Phase 10 small fallback ResponsePlan 슬라이스

- 추천·웰컴·farewell·safety·story/lore와 독립된 `bar-atmosphere`, `small-talk-weather` 각 8개 문장을 ResponsePlan으로 이관했다.
- ResponsePlan 우선, 문장별 text/expression 소유, JSON 제거·빈 배열 독립성, 미이관 `water-request` legacy fallback을 검증했다.
- 분위기·음악 입력은 `bar-atmosphere`, 비·추위 입력은 `weather-talk`을 유지하며 추천·story로 오분기되지 않도록 회귀를 추가했다.
- Phase 10은 총 14개 카테고리·108개 문장 이관 상태이며 다음 별도 작업으로 중간검수를 진행할 수 있다.
- 검증: Vitest 45개 파일·587개 테스트, typecheck, lint, build, `git diff --check` 통과. 메인 JS 520.10 kB, gzip 154.54 kB.

## 2026-07-03 / Codex / recommendation-cancel ResponsePlan + RapportState 0~10

- `recommendation-cancel` 3개 문장을 문장별 text/expression을 소유하는 ResponsePlan으로 이관했다. 추천 FSM·세션·farewell 동작은 변경하지 않았다.
- Hidden RapportState를 0~10 정수 축으로 변경했다. 초기값 4, `distant(0~2) / normal(3~5) / warm(6~8) / close(9~10)`이며 cooldown/max-count 보호를 유지한다.
- SafetyLocked는 Rapport delta가 아닌 hard stop이다. Rapport는 숨은 상태이며 추천·FSM·Action·SessionState·ResponsePlan 선택에 영향을 주지 않는다.
- 검증: Vitest 45개 파일·582개 테스트, typecheck, lint, build 통과. 메인 JS 517.69 kB, gzip 154.42 kB.

## 2026-07-03 / Codex / Phase 10 recipe-request ResponsePlan 슬라이스

- `recipe-request` 10개 문장을 `karua + explain + request + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy fallback, 문장별 expression, JSON 제거 상황을 검증했다. 기존 JSON은 삭제하지 않았다.
- recipe 생성·story/lore·공개 순서·DialogueService·추천 엔진·분류/라우터 로직은 변경하지 않았다.
- `레시피 알려줘`, `재료가 뭐예요`, `어떻게 만들어요`는 `recipe-query`를 유지한다. `만드는 법 알려줘`는 기존 계약상 `story-query`로 남아 있음을 회귀로 기록했다.
- 검증: Vitest 45개 파일·568개 테스트, typecheck, lint, build 통과. 메인 JS 517.11 kB, gzip 154.29 kB.

## 2026-07-03 / Codex / Phase 10 random-request ResponsePlan 슬라이스

- `random-request` 3개 문장을 `karua + recommend + request + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy fallback, 문장별 expression, JSON 제거 상황을 검증했다. 기존 JSON은 삭제하지 않았다.
- 추천 엔진·Slot Filling·FSM·IntentClassifier·input-router·칵테일 선택은 변경하지 않았다.
- 아무거나/랜덤/일반 추천과 활성 추천 세션의 `맡길게`가 기존 Recommendation Action으로 연결되고 다른 intent로 오분기되지 않는지 고정했다.
- 검증: Vitest 45개 파일·563개 테스트, typecheck, lint, build 통과. 메인 JS 515.84 kB, gzip 154.06 kB.

## 2026-07-03 / Codex / Phase 10 unknown-cocktail ResponsePlan 슬라이스

- `unknown-cocktail-request` 3개 문장을 `karua + explain + request + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy fallback, 문장별 expression, JSON 제거 상황을 검증했다. 기존 JSON은 삭제하지 않았다.
- unknown 감지·input-router·IntentClassifier·추천 FSM은 변경하지 않았다.
- 존재하지 않는 칵테일과 알려진 주문·story/info·recommendation·random 경계를 회귀로 고정했다.
- 검증: Vitest 45개 파일·558개 테스트, typecheck, lint, build 통과. 메인 JS 515.34 kB, gzip 153.96 kB.

## 2026-07-03 / Codex / Phase 10 story ResponsePlan 슬라이스

- `story-request` 8개와 `story-unresolved` 4개 문장을 `karua + explain + request + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy fallback, 문장별 expression, JSON 제거 상황을 검증했다. 기존 JSON은 삭제하지 않았다.
- story-query, lore-reference, talking_points 데이터와 공개 이력 로직은 변경하지 않았다.
- `story:* → trivia:* → description` 공개 순서 회귀 테스트를 추가했다.
- 검증: Vitest 45개 파일·554개 테스트, typecheck, lint, build 통과. 메인 JS 514.67 kB, gzip 153.88 kB.

## 2026-07-03 / Codex / Phase 10 character-query ResponsePlan 슬라이스

- `character-query` 4개 문장을 `karua + small_talk + request=character-query + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy JSON fallback, 전체 expression 동등성, JSON 제거 상황을 테스트했다. 기존 JSON은 삭제하지 않았다.
- 미이관 `story-unresolved`가 기존 JSON 경로를 유지하는지 고정했다.
- 카루아·직원 질문 3종은 `character-query`로 보강했다. `시에스타는 누구예요`는 의미가 다른 전용 `siesta-setting → siesta-mention` 경로를 보존했다.
- 검증: Vitest 45개 파일·554개 테스트, typecheck, lint, build 통과. 메인 JS 512.72 kB, gzip 153.26 kB.

## 2026-07-03 / Codex / Phase 10 bar-intro ResponsePlan 슬라이스

- `bar-intro` 10개 문장을 `karua + small_talk + request=bar-intro + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy JSON fallback, 전체 expression 동등성, JSON 제거 상황을 테스트했다. 기존 JSON은 삭제하지 않았다.
- 미이관 `character-query`가 기존 JSON 경로를 유지하는지 고정했다.
- `여긴 뭐죠`, `여긴 뭐하는 곳인가요`, `여긴 뭐하는 바인가요`, `Re:Station이 뭐예요`를 `bar-setting`으로 분류하도록 최소 보강했다.
- 검증: Vitest 45개 파일·547개 테스트, typecheck, lint, build 통과. 메인 JS 512.00 kB, gzip 153.07 kB.

## 2026-07-03 / Codex / Phase 10 mood ResponsePlan 슬라이스

- 실제 mood 라우트가 사용하는 `mood-tired`, `mood-sad`, `mood-happy` 34개 문장을 `karua + comfort + state/request + answer` ResponsePlan으로 이관했다.
- ResponsePlan 우선, legacy JSON fallback 순서를 유지하고 JSON 데이터는 삭제하지 않았다.
- mood 전체 문장 expression 동등성, JSON lines 제거 상황, 기존 미이관 카테고리 fallback을 테스트했다.
- `mood-surprised`는 현재 라우터·템플릿 미연결이므로 이번 범위에서 제외했다.
- 검증: Vitest 45개 파일·540개 테스트, typecheck, lint, build 통과. 메인 JS 510.84 kB, gzip 152.77 kB.

## 2026-07-03 / Codex / Phase 10 첫 슬라이스 — general-chat ResponsePlan 이관

- DLG-808·809를 Phase 10과 병행하는 첫 작업으로 `general-chat` 13개 문장을 `karua + small_talk + general-chat + answer` ResponsePlan으로 이관했다.
- `response-plan-adapter.ts`를 `pickDialogue()` 앞에 연결했다. 이관된 문장은 ResponsePlan에서 선택하고, 기존 JSON의 동일 문장에서 expression을 보존한다.
- 미이관 카테고리는 어댑터가 처리하지 않고 기존 JSON 선택 경로를 그대로 사용한다.
- 동등성, expression 보존, 미이관 fallback 테스트 3개를 추가했다.
- 검증: Vitest 45개 파일·530개 테스트, typecheck, lint, build 통과. 메인 JS 507.65 kB, gzip 151.68 kB.

## 2026-07-02 / Codex / WebLLM 구조화 의미 보조 전환

- WebLLM의 자유 문장 생성 경로를 제거하고 topic, stance, 응답 블록 후보, 세션 태그, rapport 힌트, confidence만 반환하는 구조화 의미 분석기로 전환했다.
- 허용 목록 기반 검증기를 추가해 알 수 없는 topic·태그·블록 후보를 폐기하고 자유 문장·마크다운·비정상 JSON을 거부한다.
- 의미 분석은 비동기 fire-and-forget으로 실행하며, 엔진 사용 중·시간 초과·실패 시 JSON/FSM 응답을 즉시 그대로 사용한다.
- 세션 태그는 메모리에만 유지하고 입장·퇴장·밤 초기화 시 삭제하도록 했다.
- 추천·주문·안전·farewell·lore 등 결정 경로는 의미 분석 대상에서 제외했다.
- 모델 준비는 브라우저 idle callback에서 시작하고, 의미 분석 기능은 기본 OFF로 유지했다.
- 검증: Vitest 44개 파일·527개 테스트, typecheck, lint, build 통과. 메인 JS 505.72 kB, gzip 151.17 kB.

## 2026-07-02 / Codex / Phase 9 마무리 — 커밋 정리 [71e6f2b][141d915][78fd049][944d2dd][45c1839]

- **dialogue audit** [`71e6f2b`]: 금지 패턴 3건 수정(counselor-prompt 2건 + blanket-reassurance 1건), character layer 경계 테스트 +5, 문장 길이 계약 +2, 자동 감사 스크립트 추가
- **RapportState v2.0.0** [`141d915`]: 단일 축 0-100, JSON 기반 config, 4단계 구간, 갱신 규칙, 성향 가중치, 개발용 Debug UI, 테스트 15개
- **WebLLM experimental** [`78fd049`]: @mlc-ai/web-llm 0.2.84, preload hook, capability check, Worker infra (response 기본 OFF)
- **ResponsePlan schema** [`944d2dd`]: ResponsePlan 타입·선택·검증 테스트, text-presets export/fallback 리팩토링, engine.test JSON text matching
- **Docs** [`45c1839`]: mission_control 전반 갱신 (CHARACTER_DESIGN, CURRENT_STATE, ARCHITECTURE, HANDOVER 등)
- 검증: 전체 Vitest 43개 파일·530개 테스트, typecheck, lint, build 통과

## 2026-07-02 / Codex / Phase 9~10 진입 전 검수와 ResponsePlan 밑준비 [d1791b4]

- Phase 9 완료 조건과 Phase 10 대사 출처 인벤토리를 `PHASE_9_10_READINESS.md`에 정리했다.
- 미등록 화자·intent가 `PARAGRAPH_PRESETS[0]`으로 떨어지는 암묵적 fallback을 제거하고 명시적 fallbackText를 사용하도록 바꿨다.
- `ResponsePlan`의 speaker/intent/state/request/blocks/fallbackText 타입, 구체도 기반 선택, 구조 검증 계약과 테스트를 추가했다.
- 카루아 말투 테스트가 복사된 프리셋이 아니라 실제 `PARAGRAPH_PRESETS` 원본을 검사하도록 수정했다.
- WebLLM safety·주문·farewell·lore·recipe 금지 경로는 reaction 표식으로 우회할 수 없도록 차단 테스트를 추가했다.
- 실제 `dialogues.json`·`text-presets.ts` 데이터 이관은 수행하지 않았다.
- 검증: 전체 Vitest 42개 파일·508개 테스트, typecheck, lint, build 통과. 메인 JS 501.57 kB, gzip 149.70 kB.

## 2026-07-02 / Codex / WebLLM 접속 직후 자동 준비 전환

- PRELOAD 기본값을 ON으로 바꾸고 첫 렌더 직후 capability 검사를 거쳐 모델 준비를 시작하도록 변경했다.
- 기존 2초 지연과 idle callback을 제거했다. 모델 준비는 Web Worker에서 실행되며 JSON 대화와 화면 입력은 계속 동작한다.
- `VITE_WEB_LLM_PRELOAD_ENABLED=false`를 명시하면 운영상 자동 준비를 중지할 수 있다.
- RESPONSE는 계속 기본 OFF이며 실제 DialogueService 출력에는 아직 연결하지 않았다.
- 검증: 전체 Vitest 41개 파일·498개 테스트, typecheck, lint, build 통과. 메인 JS 501.27 kB, gzip 149.61 kB.

## 2026-07-02 / Codex / WebLLM 실험 인프라 재연결 [d1791b4]

- `@mlc-ai/web-llm` 0.2.84와 Web Worker 엔진 기반을 추가했다.
- PRELOAD와 RESPONSE 기능 플래그를 분리하고 둘 다 기본 OFF로 설정했다.
- Chromium/WebGPU/secure context/deviceMemory/CPU capability 검사와 싱글턴 준비 Promise를 추가했다.
- 준비 실패는 세션 중 자동 재시도하지 않으며 생성은 단일 요청, 4초 제한, 취소와 stale guard를 적용했다.
- 한국어, 1~3문장, 마크다운·목록·프롬프트 노출·상담가·AI 도우미·카루아 금지 표현 검증 실패 시 규칙 응답으로 복구한다.
- WebLLM 패키지와 Worker는 동적 분리해 초기 메인 번들에서 제외했다. 실제 DialogueService와 메시지 출력에는 연결하지 않았다.
- 검증: 전체 Vitest 40개 파일·495개 테스트, typecheck, lint, build 통과. 메인 JS 501.50 kB, gzip 149.67 kB이며 WebLLM 라이브러리와 Worker는 별도 지연 자산이다. 프로덕션 의존성 audit 취약점 0개.

## 2026-07-02 / Codex / Phase 9 Character Layer 기반 구현 [b324289]

- `ResponseDraft → Response Pipeline → Character Layer → BartenderResponse` 경계를 연결하고 기존 텍스트와 표정을 보존했다.
- `persona.ts`를 직접 참조하는 카루아 프로필에 말투 원칙, 설정형 금지/권장 표현, 문장 길이, 능청 수준, 반존대, 감정 강도를 정리했다.
- 금지 표현, 문장 수, 과도한 설명, 반존대, 가벼운 능청, 추천 어조를 평가하는 독립 검증기를 추가했다.
- `BartenderResponse`에 `styled`, `validationPassed`, `warnings`, `blockedPatterns`, `preferredPatterns`, `speaker` 메타데이터를 선택적으로 추가했다.
- 미등록 시에스타 프로필을 카루아와 섞지 않도록 화자 레지스트리 확장 경계를 고정했다.
- 기존 추천 결과와 추천 이유가 Character Layer 적용 전후 동일한지 회귀 테스트로 검증했다. WebLLM·추천 엔진·세션·Action·DialogueService는 변경하지 않았다.
- `mood-tired` 랜덤 대사의 의미를 특정 단어 하나로 제한하던 테스트를 현재 대사 풀에 맞게 안정화했다.
- 검증: `npm.cmd run test` (36 files, 471 tests), `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build` 통과. 메인 JS 492.34 kB, gzip 146.26 kB.

## 2026-07-01 / Codex / Phase 9 진입 전 기능 경계 보완 [7bcd422]

- `isDialogueActionBlockedInPhase`를 추가해 closed/farewell/safetyLocked/returnHome에서 원래 route가 `general`이어도 최종 Action이 recommend/order이면 차단하도록 수정했다.
- `formatStoryQueryReply`에 story/lore/info별 fact 순서를 추가했다. info는 recipe→ingredients→tasting→description, lore는 trivia→talking points, story는 talking points→lore 순으로 시작한다.
- Reaction 판정에 최종 intent를 반영해 `여기 분위기 좋아요`, `오늘 기분 좋아요`가 positive-feedback으로 덮이지 않게 했으며 칵테일 대상 feedback과 독립 feedback은 유지했다.
- negative/another feedback 대상 ID를 Conversation Context에서 결정하고, 추천 세션의 ref/state 제외 목록에 즉시 반영해 같은 턴 재추천도 막았다.
- farewell another-request 실행 차단, 모히토 recipe 우선, 정상 intent 보존, 실제 feedback 제외 흐름 회귀 테스트를 추가했다.
- Phase 9 Character Layer와 대사 말투 원문은 변경하지 않았다.
- 검증: `npm.cmd test` (35 files, 457 tests), `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run build` 통과. 메인 JS 487.95 kB, gzip 144.09 kB.

## 2026-07-01 / Codex / Phase 8 Talking Points 2차 확장 완료

- Paper Plane, Penicillin, Piña Colada, Irish Coffee, Manhattan, Mint Julep, Sazerac, Singapore Sling, Clover Club, Bramble을 2차 확장했다.
- talking point 10개와 lore reference 20개를 추가해 Phase 8 누적 확장량을 대표 클래식 20종·포인트 20개·참조 40개로 늘렸다.
- 공개 칵테일 structured lore 커버리지는 20/49에서 30/49로 증가했다.
- Paper Plane의 기존 뉴욕 기원 표현을 2008년 시카고 The Violet Hour 공개 맥락으로 교정하고, 기원 논쟁·공식 지정·문화 일화는 완곡한 문체로 유지했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (33 files, 435 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 485.98 kB, gzip 143.56 kB.

## 2026-07-01 / Codex / Phase 7 Dialogue Quality 완료

- `character-query` 템플릿이 실제 JSON 카테고리 부재로 일반 fallback만 사용하던 문제를 찾아 전용 대사 풀을 추가했다.
- 대상 없는 lore follow-up이 사용자의 이야기를 계속 듣겠다는 `story-request`로 응답하던 출처 오류를 `story-unresolved` 풀로 분리했다.
- 누락되어 fallback만 사용하던 `random-request`, `unknown-cocktail-request`, `recommendation-cancel` 전용 대사 풀을 추가했다.
- bar/character/unresolved-story 출처가 서로 구분되는지, 템플릿이 참조하는 27개 카테고리가 모두 존재하고 비어 있지 않은지 테스트로 고정했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (33 files, 434 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 479.93 kB, gzip 141.99 kB.

## 2026-07-01 / Codex / Reaction·Conversation Flow 통합 회귀 보강

- `conversation-regression.test.ts`를 추가해 DialogueService, ActionExecutor, 추천 후보 풀을 잇는 회귀 경계를 고정했다.
- negative feedback 뒤 이전 추천 ID가 제외된 후보에서 다른 칵테일을 선택하는지 검증했다.
- another-request가 기존 `recommend(preference)` Action을 거쳐 새 추천 결과와 선행 반응을 출력하는지 검증했다.
- lore follow-up의 `fact-disclosed` key가 이전 응답과 겹치지 않는지, Conversation Flow의 반응 문장이 lore 본문보다 먼저 출력되는지 검증했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (32 files, 430 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 477.31 kB, gzip 141.38 kB.

## 2026-07-01 / Codex / Talking Points·Lore 1차 확장

- Old Fashioned, Margarita, Negroni, Aviation, Boulevardier, Cosmopolitan, Bellini, Moscow Mule, French 75, Espresso Martini의 콘텐츠를 확장했다.
- 실제 인물·작품·역사·문화 기반 talking point 10개와 lore reference 20개를 추가했다.
- 기원이 충돌하거나 일화성이 강한 내용은 `전해집니다`, `알려져 있습니다`, `대표적으로 언급됩니다` 같은 완곡한 문체로 기록했다.
- 데이터 테스트에 10종의 포인트·참조 수와 lore 세부 문체 계약을 추가했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (31 files, 426 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 477.31 kB, gzip 141.38 kB.

## 2026-07-01 / Codex / Conversation Flow 선행 반응 보강

- 기존 Intent·Action·FSM을 유지하고 story/lore/info 직접 응답 조립에만 `[reaction] → [본문]` 순서를 적용했다.
- 최초 질문은 콘텐츠 종류별 짧은 반응을, 이미 사실이 공개된 후속 질문은 연결 반응을 사용한다.
- 기존 `formatStoryQueryReply`의 사실 선택과 `fact-disclosed` 공개 이력은 그대로 유지해 정보 반복 방지 계약을 보존했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (31 files, 425 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 471.13 kB, gzip 139.78 kB.

## 2026-07-01 / Codex / Phase 6 Slot Filling 추천 FSM 완료

- 기존 `RecommendationState`와 질문 FSM을 유지하면서 자유입력의 taste/base/strength/fizz 신호를 순서와 무관하게 먼저 저장하도록 보강했다.
- 활성 질문의 선택지 문구가 포함된 복합 답변도 선택지 신호와 자유입력 신호를 병합해, 같은 문장에 말한 다른 슬롯을 잃지 않게 했다.
- 이미 채워진 topic은 기존 `getKnownTopics`/`selectNextQuestion` 경계에서 제외되어 같은 취향을 다시 묻지 않는다.
- `약하게`, `순하게`, `적당하게`, `탄산은 빼고/싫어` 같은 자연어 strength/fizz 표현을 추가했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (30 files, 421 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 470.71 kB, gzip 139.63 kB.

## 2026-07-01 / Codex / Reaction Layer 완료

- `reaction-layer.ts`에 `positive-feedback`, `negative-feedback`, `another-request`, `agreement`, `confused` 감지와 짧은 선행 반응을 추가했다.
- `DialogueService`가 명시적 안전·주문·정보 요청 경계를 보존하면서 Reaction을 먼저 판정하도록 연결했다.
- `ActionResolver`는 단순 반응을 `respond`로 유지하고 `another-request`만 기존 `recommend(preference)` 행동으로 연결한다.
- 추천 결과가 필요한 경우 `[reaction]` 뒤에 기존 추천 결과를 붙여 반응 우선 출력 순서를 보장했다.
- 검증: `npm.cmd run lint`, `npm.cmd test` (30 files, 417 tests), `npm.cmd run check`, `npm.cmd run build` 통과. 메인 JS 470.47 kB, gzip 139.55 kB.

## 2026-07-01 / Codex / Phase 5 Action Layer 완료
- 내용: `action-executor.ts`가 `DialogueAction`을 추천·랜덤·명시 주문·lore 주문 포트로 실행하고 `serve/respond` 효과와 성공·미결정·대상 누락 결과를 반환하도록 완성
- 경로 통합: 텍스트 입력과 사이드바 주문이 같은 `executeAction` 어댑터를 사용. 컨트롤러에서 `DialogueAction.type` 직접 해석과 추천 훅 선택 분기 제거
- 서빙 계획: `serving-plan.ts`를 추가해 도수 누적, XYZ 여부, farewell 필요 여부, 다음 세션 phase를 순수 계산. 두 주문 경로의 중복 판단 제거
- 책임 경계: executor와 serving plan은 무엇을 실행하고 어떤 상태 전이가 필요한지 결정하며, 컨트롤러는 타이머·애니메이션·화면 흔들림·도감 해제·메시지 표시를 적용
- 수정: `action-executor.ts`, `action-executor.test.ts`, `serving-plan.ts`, `serving-plan.test.ts`, `useRestationController.ts` 및 현황 문서
- 검증: 핵심 4개 파일 20개, 전체 Vitest 29개 파일 404개 통과. check/lint/build 통과, 메인 JS 468.39 kB (gzip 138.74 kB)

## 2026-07-01 / Codex / Phase 4 Conversation Context 완료
- 내용: Conversation Context를 컨트롤러의 `useReducer(updateConversationContext)` 단일 상태로 승격하고, 별도 `lastServedCocktail` 객체 상태와 `DialogueServiceRequest.lastServedCocktail` 전달을 제거
- 참조 계약: 생략 주문, 일반 이야기, lore 후속 selector의 우선순위와 이벤트별 필드 전이를 table-driven 테스트로 고정. 명시적 칵테일/lore 단서의 기존 우선순위 유지
- 서빙 계약: 추천·웰컴·직접 주문·XYZ의 `served` 이벤트를 주문 접수 시점이 아니라 실제 칵테일 카드 공개 완료 콜백에서 기록
- 세션 계약: recommendation 전환과 farewell에서는 context를 유지하고 새 입장·전체 reset에서 모든 참조와 공개 이력을 제거. safetyLocked 뒤에는 기존 서비스 차단 계약 유지
- 수정: `conversation-context.test.ts`, `dialogue-service.ts`, `dialogue-service.test.ts`, `useRestationController.ts` 및 현황 문서
- 검증: 핵심 회귀 7개 파일 163개, 전체 Vitest 27개 파일 396개 통과. check/lint/build 통과, 메인 JS 467.29 kB (gzip 138.31 kB)

## 2026-06-30 / Codex / Phase 3 DialogueService 분리 [1c97d8c]
- 내용: `DialogueService`를 추가해 대화 컨텍스트 구성, IntentClassifier 실행, DialogueAction 해석, 이야기·정보·캐릭터·미등록 칵테일 직접 응답, DialogueTurn 조립·검증을 컨트롤러 밖으로 이동
- 계약: 서비스는 입력·메시지·Conversation Context·세션 스냅샷을 받아 `DialogueResolution`을 반환한다. 결과에는 route/intent/action, 즉시 적용할 컨텍스트 이벤트, 직접 응답 턴이 포함된다. 추천 계산은 기존 추천 훅이 유지하고, 계산 결과의 최종 대화 턴 조립만 서비스가 담당
- 책임 분리 보완: `DialogueResolution.blockedBySession`에서 주문 차단을 먼저 확정하고 차단된 주문에는 Context 이벤트를 생성하지 않음. 텍스트 주문과 사이드바 주문이 모두 `resolve → Action → buildMainTurn → serving events` 계약을 사용하며, 서빙 완료는 `cocktail-served` reducer 액션으로 항상 conversation 모드에 복귀
- 안전 상태: `safetyLocked`를 명시적 `reset` 전까지 다른 reducer 액션을 받지 않는 흡수 상태로 고정해 추천·주문·웰컴·XYZ·farewell 전이를 차단
- 컨트롤러: `useRestationController`에서 IntentClassifier, Action Resolver, story formatter, 일반 응답 엔진, DialogueTurn builder 직접 호출을 제거. 컨트롤러는 서비스 결과를 세션 reducer, 타이머, 제조 애니메이션, 카드·도감 해제, 화면 메시지에 반영
- 안전 계약: 공통 `SAFETY_REDIRECT_REPLY`에 즉시 위험 확인과 119/112/1393 안내를 복구해 기존 실패 2개 해소
- 수정: `bar_tend/src/lib/dialogue/dialogue-service.ts`, `dialogue-service.test.ts`, `action-resolver.ts`, `turn-builder.ts`, `bar_tend/src/hooks/useRestationController.ts`
- 검증: check/lint/build 통과, Vitest 27개 파일 390/390 tests pass, 메인 JS 467.19 kB (gzip 138.28 kB)

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
- 동작 보존 리팩토링 기록도 이 문서가 소유한다. 별도 리팩토링 로그를 만들지 않는다.
- 수정 또는 생성 파일은 경로를 명시한다.
- 각 작업 항목에 해당 커밋 해시를 `[hash]` 형태로 기록한다.
- **커밋 발생 시** 해당 커밋 해시(`git rev-parse --short HEAD`)와 커밋 메시지(`git log -1 --format=%s`)를 작업 항목에 즉시 기록한다.
- 사용자가 직접 커밋한 경우, 나중에 `git log --oneline --after=<날짜>`로 히스토리를 조회해 `[hash]`를 보충할 수 있다.
