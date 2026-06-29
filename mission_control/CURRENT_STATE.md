# 프로젝트 현재 상태 (축약)

> 최종 갱신일: 2026-06-29

## 상태 요약
| 항목 | 상태 |
|---|---|
| 목표 | Re:Station 카루아 중심 MVP + 시에스타 만담 |
| 단계 | RST-000 MVP + Phase 1~1.5 완료, 다음=Phase 2 |
| 기술 | React+Vite+프론트엔드 단독, WebLLM 잠정 보류 |
| 빌드/린트 | 통과 (메인 JS 446.31 kB) |
| 테스트 | **Vitest 255개 전체 통과** |
| 세션 테스트 | farewell-replies.test.ts + session-flow.test.ts 통과 |

## 완료된 기반 (06-29 기준)
| 완료 항목 | 커밋 |
|---|---|
| Phase 1 IntentClassifier 통합 | [`36374a4`] |
| Phase 1.5 Context + Action Layer | [`0404c58`] |
| 명시적 lore/person/media 참조가 대명사보다 우선 | [`abe0606`] |
| lore 주문 → 제조·서빙까지 실행 | [`0404c58`] |
| XYZ 세션 종료 (도수한계→Farewell Phase) | [`16d322a`] |
| REF-SESSION-001/002 리팩토링 | [`69175c5`] |
| 데스크톱/모바일 수동 검증 완료 | [`de40d39`] |

## 현재 구현 vs 목표 차이
| 영역 | 현재 | 목표 |
|---|---|---|
| 캐릭터 | 카루아 CSS 필터 표정, 시에스타 라벨만 | 표정별 PNG + 시에스타 난입 스프라이트 |
| 대화 | 존댓말 응대·입력경로별 대사·3블록프리셋·예외응답 | 스프라이트 연출 + 전체 문단프리셋 이관 |
| 추천 | 43+2종, 4축, dialogueFlow, 평문재료 | 유지 |
| 테스트 | 데이터·라우팅·저장소·웰컴·시에스타·UI렌더링·DialogueTurn 등 | 스프라이트 검증 추가 |
| 번들 | 메인 446.31 kB, 레시피/BGM chunk | 유지 |

## 현재 우선순위
1. DLG-807 카루아 말투 재검수
2. DLG-808 대사 데이터 출처 정리
3. DLG-809 화자·상태·요청별 문단 프리셋 확장
4. 이후 Phase 2~9 구조 작업 (Response Pipeline→DialogueService→Context→Action→Slot→Quality→Talking→Character)

## 주요 이슈
| 이슈 | 상태 | 해결 커밋 |
|---|---|---|
| ISSUE-001 한국어 인코딩 오인 | 해결됨 | [`d5a0ea5`] |
| ISSUE-002 Cocktail/CocktailRecord 이중화 | 해결됨 | [`dcbbda5`] |
| ISSUE-003 App.tsx 집중 | 해결됨 | [`9c37666`] |
| ISSUE-004 자동 테스트 부족 | 해결됨 | [`de40d39`] |
| ISSUE-005 JS 번들 593kB | 해결됨 | [`dcbbda5`] |
| ISSUE-006 OpenAI/Ollama 잔재 | 해결됨 | [`dcbbda5`] |
| ISSUE-007 WebLLM 안정성 미검증 | 말투포장 전용 제한, 잠정 보류 | — |
| ISSUE-008 카루아 규칙 계약 | 해결됨 | [`bc23714`] |
| ISSUE-009 안전 fallback/빈 응답 | 해결됨 | [`2ad13e4`] |
| ISSUE-010 추천 UI 잔존 | 해결됨 | [`2ad13e4`] |
| ISSUE-011 미등록 칵테일 오분류 | 해결됨 | [`2aecaf0`] |
| ISSUE-012 시에스타 일방적 발화 | 해결됨 | [`2aecaf0`] |
| ISSUE-013 대명사 오해 | 해결됨 | [`0404c58`] |

## 향후 방침
- DLG-807~809 전 WebLLM·새알고리즘·새캐릭터·추가이벤트 보류
- 칵테일 확장 = IBA 우선, 관리자 검증 큐 (DEC-020)
- 대사 풀 = 입력 경로 선택, FSM=말투·리듬, affectState=표정
- 스프라이트 작업은 WebLLM보다 우선
- 공통DB 필요 시 BaaS 검토, 유저간 상호작용 불필요

## 스프라이트 에셋 구조 (SPR-006)
- `assets/characters/karua/static/` (정적PNG)
- `assets/characters/karua/animations/shaker/` (셰이킹)
- `sprites.ts` = 코드 진입점
- 칵테일 확정→`preparing`→셰이킹→추천대사+카드
- 새 에셋: `{character}/static/`(PNG), `animations/{action}/`(프레임), `sprites.ts`(import)
- 표정=`Expression` 1:1 매핑, 누락=`idle` fallback
