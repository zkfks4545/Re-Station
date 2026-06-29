# 인수인계 (축약)

> 최종 갱신일: 2026-06-29 (Phase 1.5 완료, Vitest 255개)
> 각 작업의 상세 커밋 해시는 `WORK_LOG.md` 참조.

## 현재 목표
BarBot → **Re:Station 카루아 중심 대화형 칵테일 추천 MVP**. 신규 기능보다 대사·캐릭터 일관성 수렴 우선.

**핵심 진행사항:**
- Phase 1 (IntentClassifier) + Phase 1.5 (Context + Action Layer) 완료 [`36374a4`][`0404c58`]
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
- ✅ `npm.cmd run lint`, `npm.cmd test -- --run` (Vitest **255개 통과**), `npm.cmd run check`, `npm.cmd run build`
- ✅ 브라우저 수동 검증: 선택지 클릭·모바일·무알코올·제외재료·소진리셋
- ✅ MVP 8개 성공 기준 전항목 통과

## 다음 우선순위
1. Phase 2 Response Pipeline (응답 선택·템플릿·표정 분리)
2. Phase 3 DialogueService 분리 (컨트롤러에서 대화판단 로직 분리)
3. Phase 4~9 (Context 완성 → Action Layer → Slot Filling → Dialogue Quality → Talking Points → Character Layer)
4. DLG-807~809 (말투 재검수·대사출처·문단프리셋), SPR-001~005 (스프라이트)는 구조 안정화 후 재검토

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
