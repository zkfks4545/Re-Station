# 프로젝트 현재 상태 (축약)

> 최종 갱신일: 2026-07-02

## 상태 요약
| 항목 | 상태 |
|---|---|
| 목표 | Re:Station 카루아 중심 MVP + 시에스타 만담 |
| 단계 | RST-000 MVP + Phase 1~8 완료, **Phase 9 Character Layer 완료** |
| 기술 | React+Vite+프론트엔드 단독, WebLLM 실험 인프라 연결·기본 OFF, **Hidden Relationship State** 탑재 (JSON 기반) |
| 빌드/린트 | 통과 (메인 JS 501.57 kB, gzip 149.70 kB, WebLLM 지연 청크 분리) |
| 테스트 | **Vitest 530개 전체 통과 (Phase 9 회귀 +7, RapportState +15)** |
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
| Phase 8 Talking Points 완료 (대표 클래식 20종 확장·공개 30/49종 structured lore) | 현재 작업 |
| Phase 9 진입 전 경계 보완 (Action 기준 closed 차단·콘텐츠 우선순위·Reaction intent 보호·실제 feedback 제외) | 현재 작업 |
| Phase 9 Character Layer 기반 (persona 참조 프로필·금지/권장 검증·응답 메타데이터·Response Pipeline 연결) | [`완료`] |
| Phase 9 전체 대사 감사 + 금지 패턴 위반 3건 수정 + 회귀 테스트 7건 보강 (515 total) | [`완료`] |
| Phase 9 Hidden RapportState (JSON 기반 단일 축 0~100·갱신 규칙·4단계 구간·대사 변이·15개 테스트·개발용 Debug UI) | [`완료`] |
| Phase 10 ResponsePlan 스키마 확정 + 이중 읽기 어댑터 + 배치 이관 | 대기 (Phase 9 완료 후) |
| WebLLM 실험 기반 (Worker·capability·싱글턴·timeout/취소·검증 폴백, 실제 대화 미연결) | 현재 작업 |
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
| 캐릭터 | 카루아 CSS 필터 표정, 시에스타 라벨만 | 표정별 PNG + 시에스타 난입 스프라이트 |
| 대화 | DialogueService + 입력경로별 대사·정보 요청 우선·칵테일별 점진 설명·3블록프리셋 | Context 갱신 정책 완성 + 전체 문단프리셋 이관 |
| 추천 | 43+2종, 4축, dialogueFlow, 평문재료 | 유지 |
| 테스트 | 데이터·서비스·라우팅·설명 이력·저장소·웰컴·시에스타·UI렌더링·DialogueTurn 등 | 스프라이트 검증 추가 |
| 번들 | 메인 487.95 kB, 레시피/BGM chunk | 유지 |

## 현재 우선순위
1. Phase 10 ResponsePlan 스키마 확정 + 이중 읽기 어댑터 구현
2. 첫 배치 이관 및 동등성 검증
3. Phase 11 대사 출처 정상화 (기존 JSON 출처 → ResponsePlan 순차 이관)
4. **Phase X: LLM Database Refactoring** (WebLLM 연동 전 선행 설계, 아래 상세)
5. Phase 12~14 WebLLM 단계는 앞선 정규화 완료 후 순차 검토
6. Phase 15 최종 캐릭터 QA와 시에스타 재활성화 여부 평가

---

### Phase X: LLM Database Refactoring (설계·문서화 단계)

**목적**: 향후 WebLLM 연동을 위한 LLM 전용 참조 레이어 설계. 기존 JSON 규칙 기반 대사 시스템은 유지하며, WebLLM이 읽을 보조 데이터베이스를 추가한다. 이 단계에서는 **코드 수정과 기존 DB 개편을 하지 않고 설계와 문서화만 수행**한다.

**핵심 원칙**:
- 기존 JSON 대사 시스템을 완전히 보존한다 (LLM OFF시 지금과 동일하게 동작)
- 추천 엔진, Session Flow, Action Resolver 등 기존 로직은 변경하지 않는다
- 내부 로직이 판단을 내리고, DB는 지식을 저장하며, Context Builder가 필요한 정보만 선별한다
- WebLLM은 DB 전체를 읽지 않고 Context Builder가 조립한 최소 입력만 받는다
- 규칙 기반 응답 → Context Builder → WebLLM → Validator → 규칙 기반 fallback 순서로 흐름을 설계한다

**계획 구성 요소**:

**1. LLM 참조 DB (Reference Database)**
WebLLM 전용 독립 데이터베이스를 신규 설계한다. 포함 항목:
- service-manual: 바텐더 행동 철학, 응대 지침
- stance-policy: 주제별 대응 방침 (정치→회피, 혐오→차단, 칭찬→가볍게 등)
- style-examples: 대화 유형별 1~3개의 고품질 예시 대사
- forbidden-patterns: 현행 금지 표현 패턴 정리
- rewrite-rules: 어색한 표현을 캐릭터 말투로 교정하는 규칙
- locked-facts: WebLLM이 절대 변경해서는 안 되는 정보 정의 (칵테일명, 재료, 추천 이유, 세션 상태 등)

**2. Context Builder (내부 로직)**
WebLLM 입력을 조립하는 내부 모듈 설계. 책임:
- 현 route/topic 분석
- 적절한 stance 결정
- 관련 매뉴얼·예시·금지표현·locked-facts 검색
- 압축된 LLM 입력 생성

**3. Stance Policy (화제 대응 방침)**
- 정치·종교 → 회피
- 성적 발언 → 불쾌감 표시
- 혐오 발언 → 대화 차단
- 위험 주제 → safety route
- 칭찬 → 가볍게 받기
- 일상 대화 → 편하게 응대
LLM이 stance를 자체 판단하지 않고 내부 로직이 지정한 stance를 받도록 설계한다.

**4. Style Examples (말뭉치 참조)**
대화 유형별 1~3개의 캐릭터 말투 예시를 보관한다. 템플릿이 아니라 참조용으로 사용한다.
- 카루아 어조, 문장 리듬, 반존대, 유머 수준, 간접적 공감

**5. Hidden Relationship State (비공개 관계 상태)**
향후 대화 변주를 위한 내부 관계 상태를 설계한다. 사용자에게 노출되지 않는다.
- 지표: familiarity, trust, playfulness, tension
- 단일 키워드로 급변하지 않도록 설계
- 문맥을 통해 자연스럽게 회복 가능하도록 한다

**6. Validator Compatibility**
DB 구조를 미래 validator가 아래 항목을 검증할 수 있도록 설계한다:
- 금지 표현 사용 여부
- 상담가·치료자 말투 감지
- 사실 생성 여부 (hallucination)
- 어조 일관성
- 문장 수 제한
- stance 일관성

**설계 원칙 요약**:
| 역할 | 담당 |
|------|------|
| 판단 | 내부 로직 (기존 규칙 엔진) |
| 지식 저장 | LLM 참조 DB |
| 정보 선별 | Context Builder |
| 대사 생성 | WebLLM |
| 결과 검증 | Validator |
| 최종 fallback | 기존 JSON 대사 시스템 |

> **⚠️ 이 단계는 설계와 문서화만 수행한다. 기존 JSON 파일, 추천 엔진, Session Flow, Action Resolver, 게임플레이 로직을 수정하지 않는다.**

## 주요 이슈
| 이슈 | 상태 | 해결 커밋 |
|---|---|---|
| ISSUE-001 한국어 인코딩 오인 | 해결됨 | [`d5a0ea5`] |
| ISSUE-002 Cocktail/CocktailRecord 이중화 | 해결됨 | [`dcbbda5`] |
| ISSUE-003 App.tsx 집중 | 해결됨 | [`9c37666`] |
| ISSUE-004 자동 테스트 부족 | 해결됨 | [`de40d39`] |
| ISSUE-005 JS 번들 593kB | 해결됨 | [`dcbbda5`] |
| ISSUE-006 OpenAI/Ollama 잔재 | 해결됨 | [`dcbbda5`] |
| ISSUE-007 WebLLM 안정성 미검증 | 실험 인프라 재연결, 기본 OFF, 실제 장치 준비·생성 검증 필요 | 현재 작업 |
| ISSUE-008 카루아 규칙 계약 | 해결됨 | [`bc23714`] |
| ISSUE-009 안전 fallback/빈 응답 | 해결됨 | [`2ad13e4`] |
| ISSUE-010 추천 UI 잔존 | 해결됨 | [`2ad13e4`] |
| ISSUE-011 미등록 칵테일 오분류 | 해결됨 | [`2aecaf0`] |
| ISSUE-012 시에스타 일방적 발화 | 해결됨 | [`2aecaf0`] |
| ISSUE-013 대명사 오해 | 해결됨 | [`0404c58`] |
| ISSUE-014 정보 요청의 직전 칵테일 재주문 오인 | 해결됨 | 현재 작업 |
| ISSUE-015 safety 응답 문구와 테스트 계약 불일치 | 해결됨 | 현재 작업 |

## 향후 방침
- 실험 준비 인프라는 허용하되 Phase 10~11 완료 전 실제 대화 출력 연결 금지
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
