# 인수인계 (축약)

> 최종 갱신일: 2026-07-01 (Phase 8 Talking Points 완료, Vitest 435개)
> 각 작업의 상세 커밋 해시는 `WORK_LOG.md` 참조.

## 현재 목표
BarBot → **Re:Station 카루아 중심 대화형 칵테일 추천 MVP**. 신규 기능보다 대사·캐릭터 일관성 수렴 우선.

**핵심 진행사항:**
- Phase 1 (IntentClassifier) + Phase 1.5 (Context + Action Layer) 완료 [`36374a4`][`0404c58`]
- Phase 2 완료: `ResponseDraft` 기반 공통 조립기에서 텍스트와 표정을 확정하고 추천·스토리·캐릭터 응답이 같은 파이프라인을 경유 [`4003932`][`27e8298`][`024c692`] + 현재 작업
- Phase 3 선행 작업: 분산된 대화/추천/웰컴/주문/farewell 상태를 `DialogueSessionState`로 통합. 웰컴은 `served/resolved` 플래그로 관리. safety-alert는 모든 진행을 끊고 `safetyLocked`로 세션을 종료
- Phase 3 완료: `DialogueService`가 대화 컨텍스트 구성, IntentClassifier, DialogueAction, 직접 응답, DialogueTurn 조립·검증을 담당. `useRestationController`는 서비스 결과의 세션·UI·타이머·제조 연출 반영을 담당
- Phase 3 보완: 주문 차단은 서비스가 Context 이벤트 생성 전에 판정. 텍스트·사이드바 주문은 같은 Action/Context/Response 계약을 사용하고 서빙 뒤 `cocktail-served`로 conversation 모드 복귀. `safetyLocked`는 reset 전까지 흡수 상태
- Phase 4 완료: Conversation Context를 컨트롤러의 단일 reducer 상태로 승격. `lastServedCocktail` 객체 상태를 제거하고 ID 조회로 통합했으며, 이벤트 전이·selector 우선순위·reset 수명과 실제 카드 공개 뒤 `served` 기록을 테스트로 고정
- Phase 5 완료: `action-executor.ts`가 추천·랜덤·명시 주문·lore 주문을 실행하고 `serve/respond` 효과를 반환. 텍스트·사이드바 주문이 같은 executor를 사용하며 컨트롤러의 `DialogueAction.type` 직접 해석 제거
- Phase 5 서빙 경계: `serving-plan.ts`가 도수 누적, XYZ 여부, farewell 필요 여부와 다음 세션 단계를 순수 계산. 컨트롤러에는 타이머·애니메이션·도감 해제·메시지 표시만 유지
- Reaction Layer 완료: `positive-feedback`, `negative-feedback`, `another-request`, `agreement`, `confused`를 먼저 감지한다. 단순 반응은 lore/정보/주문으로 넘기지 않고, `another-request`만 기존 `recommend` Action으로 이어진다. 명시적 정보 요청과 safety/order 경계는 유지한다.
- Phase 6 완료: 자유입력에서 taste/base/strength/fizz 신호를 순서와 무관하게 상태에 저장한다. 진행 중 질문의 선택지를 인식하더라도 같은 답변의 다른 슬롯 신호를 함께 병합하며, 이미 채운 topic은 `selectNextQuestion`이 건너뛴다. FSM과 최대 질문 수, 추천 엔진은 유지한다.
- Conversation Flow 보강: story/lore/info의 사실 선택과 공개 이력은 유지하고, `DialogueService`가 최초 콘텐츠 질문과 후속 질문에 맞는 짧은 반응을 본문 앞에 조립한다. Intent·Action·FSM 계약은 변경하지 않았다.
- Talking Points/Lore 1차 확장: 클래식 10종에 실제 인물·작품·역사·문화 기반 talking point 10개와 lore reference 20개를 추가했다. 기원 논쟁은 확정하지 않고 `전해집니다/알려져 있습니다/언급됩니다` 문체로 기록했으며 테스트로 고정했다.
- Reaction/Conversation Flow 회귀 보강: negative feedback 뒤 기존 추천 ID가 후보 풀에서 제외되는지, another-request가 새 추천 Action/실행으로 이어지는지, lore fact key가 후속 턴에서 반복되지 않는지, 반응 문장이 본문보다 먼저 출력되는지 통합 테스트로 고정했다.
- Phase 7 완료: 누락되어 항상 fallback으로 떨어지던 `character-query`와 대상 없는 lore follow-up의 응답 출처를 전용 `character-query`/`story-unresolved` 풀로 분리했다. `random-request`, `unknown-cocktail-request`, `recommendation-cancel` 풀도 보강했으며, 템플릿이 참조하는 27개 JSON 카테고리가 모두 존재하고 비어 있지 않은지 테스트로 고정했다.
- Phase 8 완료: 대표 클래식 20종에 talking point 20개와 lore reference 40개를 누적 추가했다. 공개 칵테일 structured lore 커버리지는 20/49에서 30/49로 증가했다. 2차 배치는 Paper Plane, Penicillin, Piña Colada, Irish Coffee, Manhattan, Mint Julep, Sazerac, Singapore Sling, Clover Club, Bramble이며, 기원 논쟁과 일화는 완곡한 출처 문체로 유지한다.
- 미성년자/무알코올 전용 intent·추천 제약·응답·대체 farewell은 Phase 3 범위에서 제거
- 공통 `kf`, `SHAKE_REFERENCE`, mood/switch 응답 헬퍼 정리 완료 [`a73342f`][`c82cbc6`][`4f6c90d`]
- `모히토`→`그걸로 주세요` 같은 생략 입력이 직전 대상 주문/이야기로 연결 [`0404c58`]
- 명시적 lore/person/media 단서가 대명사 컨텍스트보다 우선 [`abe0606`]
- `lore-based-order`는 story 응답으로 끝나지 않고 주문→제조→서빙 실행 [`0404c58`]

## 완료된 핵심 작업
- 단일 CocktailData 컬렉션, 번들 593→276kB [`dcbbda5`]
- App.tsx → useRecommendationSession + useRestationController 분리 [`9c37666`]
- 적응형 JSON 추천 질문 4축, 31종 후보, 120조합 보장 [`c30ca49`]
- 입력 경로 기반 대사 트리거 (route/dialogueState/affectState 3축) [`90e196c`]
- 시에스타 만담 엔진 (최대2회, 6턴쿨다운, 4발화 대화권반환) [`2aecaf0`]
- 웰컴드링크 1회 버튼 + 피드백 1문항 [`b618730`]
- 평문 재료 요청 추출·정규화, 감정 상태·표정 동기화 [`b618730`][`fd86558`]
- 키워드 규칙 JSON 분리, 추천 응답 문단 프리셋 [`e636175`]
- XYZ·Farewell Phase 세션 종료 상태머신 [`16d322a`]
- REF-SESSION-001/002 리팩토링 [`69175c5`]
- 안전 응답 119/112/1393, 직접주문 시 resetRecommendation() [`2ad13e4`]
- Phase 1.5 Context + Action Layer (생략주문·lore 주문 연결) [`0404c58`]

## 검증 기준
- ✅ `npm.cmd run lint`, `npm.cmd test` (Vitest **435개 통과**), `npm.cmd run check`, `npm.cmd run build` (메인 JS 485.98 kB)
- ✅ 브라우저 수동 검증: 선택지 클릭·모바일·무알코올·제외재료·소진리셋
- ✅ MVP 8개 성공 기준 전항목 통과

## 다음 우선순위
1. 카루아 말투 금지/권장 테스트(보류 해제 시)
2. Phase 9 Character Layer 적용
3. 나머지 19개 공개 칵테일 lore는 필요 시 점진 확장

## 주의사항 (미완료)
- [ ] 카루아 대사는 농담 우선, 의미 직접 해설 금지
- [ ] persona.ts JSON화 별도 승인 전까지 금지
- [ ] DLG-807~809 전 WebLLM·새알고리즘·새캐릭터·추가이벤트 보류
- [ ] 새 대사 = 상담원도 할 수 있는 말인지, 문제 해결인지, 관찰 출발인지 검수

## 스프라이트 가이드
- 카루아: `assets/characters/karua/static/` (정적PNG) + `animations/shaker/` (셰이킹)
- 코드 진입점: `sprites.ts`
- 시에스타: 상시표시 금지, `createSiestaEvent` 큐로만 등장
- 슬롯 계약: 카루아=`idle/talk/thinking/smirk/sympathy/surprised`, 시에스타=`idle/talk/smirk/concern/exit`
- 새 에셋 추가 후 `check`+`build` 실행, 데스크톱/모바일 stage-dock-card 가림 확인

## 다중 PC 동기화
```bash
git fetch origin && git reset --hard origin/master   # 로컬변경 없을 때
git stash && git fetch origin && git reset --hard origin/master && git stash pop  # 변경 보존
```
`git push --force` 금지. 항상 `fetch + rebase` 우선.
