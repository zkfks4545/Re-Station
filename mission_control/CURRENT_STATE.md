# 프로젝트 현재 상태 (축약)

> 최종 갱신일: 2026-07-03

## 상태 요약
| 항목 | 상태 |
|---|---|
| 목표 | Re:Station 카루아 중심 MVP + 시에스타 만담 |
| 단계 | RST-000 MVP + Phase 1~8 완료, **Phase 9 Character Layer 완료** |
| 기술 | React+Vite+프론트엔드 단독, WebLLM 의미 분석 기본 OFF, **Hidden Relationship State** 탑재 (JSON 기반) |
| 빌드/린트 | 통과 (메인 JS 521.31 kB, gzip 154.91 kB, WebLLM 지연 청크 분리) |
| 테스트 | **Vitest 598개 전체 통과** |
| 세션 테스트 | farewell-replies.test.ts + session-flow.test.ts 통과 |

## 완료된 기반 (06-30 기준)
| 완료 항목 | 커밋 |
|---|---|
| Phase 1 IntentClassifier 통합 | [`36374a4`] |
| Phase 1.5 Context + Action Layer | [`0404c58`] |
| Phase 2 Response Pipeline 완료 (템플릿·데이터 삽입·표정 선택 분리, 추천/스토리/캐릭터 공통 경유) | [`4003932`][`27e8298`][`024c692`] + 현재 작업 |
| Phase 3 선행 DialogueSessionState 정리 (웰컴 플래그·종료 종류·safetyLocked Hard Stop) | 현재 작업 |
| Phase 3 DialogueService 분리 (분류·차단·Action·Context 이벤트·응답·턴 검증) | 현재 작업 |
| Phase 4 Conversation Context 완성 (단일 reducer·참조 우선순위·세션 수명·서빙 완료 전이) | 현재 작업 |
| Phase 5 Action Layer 완성 (공통 executor·serve/respond 효과·서빙 계획) | 현재 작업 |
| Reaction Layer 추가 (5개 반응 타입·반응 우선·another-request 기존 추천 Action 연결) | 현재 작업 |
| Phase 6 Slot Filling 개선 (자유 순서 입력·기입 슬롯 재질문 방지·복합 답변 신호 병합) | 현재 작업 |
| Conversation Flow 보강 (story/lore/info 선행 반응 + 후속 연결 문장) | 현재 작업 |
| Talking Points/Lore 1차 확장 (클래식 10종·포인트 10개·참조 20개) | 현재 작업 |
| Reaction/Conversation Flow 통합 회귀 (negative 재추천 제외·another 새 추천·lore 비반복·반응 우선) | 현재 작업 |
| Phase 7 Dialogue Quality 완료 (전용 character/story 풀·누락 fallback 5종 보강·27개 출처 계약) | 현재 작업 |
| Phase 8 Talking Points 완료 (대표 클래식 20종 확장·공개 30/49종 structured lore) | [`완료`] |
| Phase 9 진입 전 경계 보완 (Action 기준 closed 차단·콘텐츠 우선순위·Reaction intent 보호·실제 feedback 제외) | [`완료`] |
| Phase 9 Character Layer 기반 (persona 참조 프로필·금지/권장 검증·응답 메타데이터·Response Pipeline 연결) | [`완료`] |
| Phase 9 전체 대사 감사 + 금지 패턴 위반 3건 수정 + 회귀 테스트 7건 보강 | [`완료`] |
| Phase 9 Hidden RapportState (숨은 정수 축 0~10·초기값 4·distant/normal/warm/close·개발용 Debug UI) | [`완료`] |
| Phase 10 ResponsePlan 타입·선택·검증·fallback 계약 | [`완료`] |
| Phase 10 ResponsePlanLine expression 필수 계약 보강 | [`완료`] |
| Phase 10 이중 읽기 어댑터 + 카테고리 배치 이관 | 진행 중 (14개 카테고리·108개 문장 완료, 중간검수 보완 통과) |
| Phase 10 Recommendation Formatter | randomPick 본문 plan 1개·template line 1개 이관 완료 |
| WebLLM 의미 보조 (Worker·구조화 분석·허용 목록 검증·세션 태그·비차단 실행, 최종 대사 생성 없음) | 현재 작업 |
| 정보 요청 최우선 라우팅 + 칵테일별 설명 공개 이력 | 현재 작업 |
| 시크릿 메뉴 격리·암구호 주문 + 칵테일 DB/이야깃거리 확장 | 현재 작업 |
| 공통 패턴·셰이크 참조·switch 응답 헬퍼 정리 | [`a73342f`][`c82cbc6`][`4f6c90d`] |
| 명시적 lore/person/media 참조가 대명사보다 우선 | [`abe0606`] |
| lore 주문 → 제조·서빙까지 실행 | [`0404c58`] |
| XYZ 세션 종료 (도수한계→Farewell Phase) | [`16d322a`] |
| REF-SESSION-001/002 리팩토링 | [`69175c5`] |
| 데스크톱/모바일 수동 검증 완료 | [`de40d39`] |

## 현재 구현 vs 목표 차이
| 영역 | 현재 | 목표 |
|---|---|---|
| 캐릭터 | 카루아 표정 PNG 일부 연결(`smirk`, `thinking`, `embarrassed/disappointed`) + 나머지 `idle` fallback, 시에스타 라벨만 | 모든 표정 슬롯별 PNG + 시에스타 난입 스프라이트 |
| 대화 | DialogueService + 입력경로별 대사·정보 요청 우선·칵테일별 점진 설명·3블록프리셋 | Context 갱신 정책 완성 + 전체 문단프리셋 이관 |
| 추천 | 43+2종, 4축, dialogueFlow, 평문재료 | 유지 |
| 테스트 | 데이터·서비스·라우팅·설명 이력·저장소·웰컴·시에스타·UI렌더링·DialogueTurn 등 | 스프라이트 검증 추가 |
| 번들 | 메인 JS 521.31 kB, gzip 154.91 kB, WebLLM 지연 청크 분리 | 유지 |

## 현재 우선순위
1. Phase 10 이관 14개 카테고리의 필수 expression·JSON 제거 독립성·legacy fallback 계약 유지
2. exact recommendation 기본 문단을 다음 formatter 슬라이스로 삼을지 작은 단위로 재조사
3. Phase 11 대사 출처 정상화 (기존 JSON 출처 → ResponsePlan 순차 이관)
4. Phase 12 의미 보조의 ResponsePlan 선택 연결은 Phase 10 이후 검토
5. Phase 13~14 의미 태그·이야기 topic 연결은 앞선 정규화 완료 후 순차 검토
6. Phase 15 최종 캐릭터 QA와 시에스타 재활성화 여부 평가

---

### WebLLM 의미 보조 구조

| 역할 | 담당 |
|---|---|
| intent·Action·안전·추천·세션 판단 | 기존 JSON/FSM/Rule Engine |
| 대사 블록·농담·비유·마무리 | ResponsePlan DB |
| topic·stance·block·세션 태그 후보 | WebLLM 구조화 의미 분석 |
| 허용 목록·confidence 검증 | Semantic Validator |
| 최종 대사 조립 | Rule Engine |

WebLLM 분석은 fire-and-forget으로 실행하며 현재 응답을 지연시키지 않는다. 검증된 세션 태그는 메모리에만 존재하고 새 입장·퇴장·밤 초기화 때 삭제한다. Phase 10 전에는 태그를 실제 대사 선택에 반영하지 않는다.

## 주요 이슈
| 이슈 | 상태 | 해결 커밋 |
|---|---|---|
| ISSUE-001 한국어 인코딩 오인 | 해결됨 | [`d5a0ea5`] |
| ISSUE-002 Cocktail/CocktailRecord 이중화 | 해결됨 | [`dcbbda5`] |
| ISSUE-003 App.tsx 집중 | 해결됨 | [`9c37666`] |
| ISSUE-004 자동 테스트 부족 | 해결됨 | [`de40d39`] |
| ISSUE-005 JS 번들 593kB | 해결됨 | [`dcbbda5`] |
| ISSUE-006 OpenAI/Ollama 잔재 | 해결됨 | [`dcbbda5`] |
| ISSUE-007 WebLLM 안정성 미검증 | 의미 분석 기본 OFF, 실제 장치 준비·구조화 분석 검증 필요 | 현재 작업 |
| ISSUE-008 카루아 규칙 계약 | 해결됨 | [`bc23714`] |
| ISSUE-009 안전 fallback/빈 응답 | 해결됨 | [`2ad13e4`] |
| ISSUE-010 추천 UI 잔존 | 해결됨 | [`2ad13e4`] |
| ISSUE-011 미등록 칵테일 오분류 | 해결됨 | [`2aecaf0`] |
| ISSUE-012 시에스타 일방적 발화 | 해결됨 | [`2aecaf0`] |
| ISSUE-013 대명사 오해 | 해결됨 | [`0404c58`] |
| ISSUE-014 정보 요청의 직전 칵테일 재주문 오인 | 해결됨 | 현재 작업 |
| ISSUE-015 safety 응답 문구와 테스트 계약 불일치 | 해결됨 | 현재 작업 |

## 향후 방침
- RapportState는 숨은 상태이며 추천 결과·FSM·Action·SessionState·ResponsePlan 선택에 연결하지 않음
- WebLLM 자유대사 생성 금지, Phase 10 전 의미 태그의 ResponsePlan 선택 반영 금지
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
