# BarBot — 작업 로그 · 참고 메모

> **작업 로그**: 맨 아래 `## 작업 로그`에만 **追加**. 위쪽 내용 **삭제·덮어쓰기 금지**.  
> **참고**: 이 파일을 매번 읽지 말 것. 작업 요약만 짧게 남김. **caveman** 준수.

---

## 1. 프로젝트 요약

- **이름**: BarBot — 모던 바텐더
- **스택**: Vite 8, React 19, TypeScript, Tailwind CSS 4
- **역할**: 모던 바 UI에서 규칙 기반 바텐더와 대화하고 칵테일을 추천·표시하는 인터랙티브 웹앱
- **씬**: `outside`(입장) → `inside`(바텐더·채팅·칵테일 카드)

---

## 2. 아키텍처 (현재)

```
useRestationController (hooks/useRestationController.ts)
  ├─ IntentClassifier.classify()  ← intent-classifier.ts
  │    ├─ routeUserInput()        ← input-router.ts (route 결정)
  │    ├─ detectConversationIntents()  ← intent-classifier.ts (intent 보정)
  │    └─ evaluateKeywordRules()  ← keywords.ts
  ├─ resolveDialogueAction()      ← action-resolver.ts
  ├─ getCocktailResponseFromClassified()  ← engine.ts
  │    └─ generateResponse()      ← conversation.ts
  │         ├─ INTENT_RESPONSE_TEMPLATES    (19개 단순 intent)
  │         ├─ COCKTAIL_FALLBACK_TEMPLATES  (3개 칵테일 intent)
  │         ├─ MOOD/TASTE/RUDE 서브템플릿
  │         ├─ STORY_FALLBACK
  │         └─ switch: story-query / mood-talk / taste-query / rude-talk / lore-followup
  └─ buildDialogueTurn()          ← turn-builder.ts (응답 + 추천 결과 병합)

conversation-context.ts
  ├─ ConversationContextState     (lastDiscussed / lastRecommended / lastServed /
  │                                 lastOrderCandidate / lastStoryTargetCocktailId)
  ├─ getLoreFollowupCocktailId()  (fallback chain)
  └─ getStoryCocktailId() / getOrderCandidateCocktailId()

database.ts
  ├─ cocktails[]         — cocktail-db.json 기반 40종(CocktailData) + talkingPoints/lore
  └─ findCocktailByName() / getCocktailById()

session-flow.ts          — SessionPhase FSM (entry → conversation → recommending → aftertalk → xyz → farewell → returnHome)
```

### 대화 흐름 (요약)

1. `performSend(text)` → `IntentClassifier.classify(text, dialogueContext)`
2. 분류 우선순위: safety/cancel/exit > explicit-cocktail/lore-order > lore-followup/cocktail-info > general
3. `resolveDialogueAction(classifiedIntent, conversationContext)` → DialogueAction 결정
4. 라우트별 조기 처리: safety/exit → 즉시 응답, story-query/lore-query → `formatStoryQueryReply`, lore-followup → `getLoreFollowupCocktailId` → `generateResponse`
5. 주문/추천/일반 대화 → timer callback (800ms) → `resolveExplicitCocktail` / `resolveRecommendation` / `generateResponse`
6. `buildDialogueTurn` → `resolveReply(outcomeReply ?? fallbackReply)` → 최종 응답

### Pipeline 구조

- **Phase 1** — Core Intent Pipeline: intent-classifier, input-router, action-resolver, keywords
- **Phase 1.5** — Data Integration + UI: cocktail-db.json, session-flow, CocktailCard/Recommendation UI
- **Phase 2 (완료)** — Response Pipeline: 모든 응답 데이터 `response-templates.ts`로 분리, switch 제거, `dialogue()` 헬퍼 제거
- **신규** — lore-followup intent: Martini 007 lore 추적 + 제조방식(셰이크/본드식) 주문 인지

---

## 3. 칵테일 데이터

### 3.1 로컬 28종 (`database.ts` 상단)

TheCocktailDB API로 **일회성 보강**한 필드:

| 필드 | 출처 | 비고 |
|------|------|------|
| `nameEn` | API `strDrink` | 영문 공식명 |
| `taste` | 재료 기반 추론 | 수동값과 다를 수 있음 (예: 모히토 단맛 3→2) |
| `ingredients` | API 재료 + 한글 매핑 | |
| `recipe` | `{ ingredient, measure }[]` | 분량 포함 |
| `recipeText` | API `strInstructions` | **영문** 한 줄 |
| `image`, `glass`, `category`, `alcoholic`, `apiId` | API | |
| `story`, `vibe`, `popCulture`, `aroma` | **로컬 유지** | 게임 톤 한국어 서사 |

**예외 — Painkiller**: 무료 API에 항목 없음. `nameEn`·`recipe`·`recipeText`는 수동 입력. 맛·스토리는 로컬 유지.

### 3.2 API 정적 번들 (`api-cocktails.ts`)

- 생성일 주석: `2026-05-22`, **426 unique cocktails**
- `name`은 영문 (`A1`, `Mojito` 등), `story`/`vibe`는 `api.ts`와 동일한 **자동 생성** 로직
- `recipe` 없이 `measures[]`만 있는 항목 다수
- `database.ts` 하단에서 `normalizeKey(name)`으로 로컬·`nameEn`과 중복 제거 후 병합 → **총 400종대** 런타임 배열

### 3.3 검색 (`findCocktailByKeyword`)

- `name`, `nameEn`, `ingredients`, `aroma` 부분 일치
- `searchCocktail()` = 동기 로컬만 (예전 비동기 API 폴백 제거됨)
- API 병합 칵테일은 **한국어 이름 없음** → 한글 키워드로는 잘 안 잡힐 수 있음

---

## 4. The Cocktail DB API

- **Base**: `https://www.thecocktaildb.com/api/json/v1/1` (무료 테스트 키, 인증 없음)
- **사용 엔드포인트** (`api.ts`):
  - `GET /search.php?s={query}` — 이름 검색
  - `GET /random.php` — 랜덤 1건
  - `GET /lookup.php?i={id}` — ID 조회
- **원본 필드**: `strDrink`, `strIngredient1..15`, `strMeasure1..15`, `strInstructions`, `strDrinkThumb`, `strGlass`, `strCategory`, `strAlcoholic`, `strTags`, `strVideo` 등
- **앱이 버리는 필드**: tags, video, IBA, alternate name, 라이선스 메타 등
- **변환**: `toOurCocktail()` — 맛·향·베이스·스토리·vibe는 코드 추론/생성, API 레시피 원문은 `recipeText`에만 반영

### API vs 로컬 차이 (설계 시 참고)

| | 로컬 28 | API 변환/번들 |
|--|---------|----------------|
| 이름 | 한국어 | 영문 |
| 스토리 | 수작업 한국어 | 자동 생성 + 영문 레시피 일부 |
| popCulture | 일부 있음 | 없음 |
| 레시피 구조 | `recipe[]` | 번들은 `measures[]`만인 경우 많음 |

### API 한계 (발견)

- **Painkiller** 무료 DB 미포함
- 검색은 **칵테일 이름** 위주 — 재료·한국어 문장 검색 약함
- 일일 rate limit 가능 (코드에 처리 없음)
- 브라우저 직접 `fetch` — CORS 허용 필요 (정적 번들로 우회한 상태)

---

## 5. 바텐더 AI (규칙 기반)

- **`keywords.ts`**: 인사·우울·추천·맛 등 정규식 → 고정 응답 + 표정
- **`conversation.ts`**: `buildConversationContext(history)` + intent 분기 + 랜덤 템플릿 풀
- **`engine.ts`**: `keywordAnalyze` → 없으면 `generateResponse`

### 미사용·중복 코드

| 항목 | 위치 | 상태 |
|------|------|------|
| `detectIntent` | `engine.ts` export | App/대화에서 **미사용** (conversation 내부 별도 정의 사용) |
| `FIRST_GREETING`, `RETURN_GREETING` | `conversation.ts` | 정의만 있고 **미참조** (첫 인사는 `App.handleEnter`) |
| `EXPRESSIONS` | `lib/types.ts` | export만, import 없음 |
| `generateWithOpenAI` | `openai.ts` | App **미연결** |
| `generateWithOllama` | `ollama.ts` | App **미연결** |
| `persona.ts` + `prompts.ts` | LLM 프롬프트 | openai/ollama에서만 사용 |
| `api.ts` live fetch | | App **미사용** (정적 `api-cocktails.ts`로 대체) |

---

## 6. UI (`CocktailCard`)

표시: `image`, `name`, `vibe`, `story`, `popCulture`, `base`, `ingredients`, `glass`, `alcoholic`, 맛 별점(5축, **carbonated 미표시**).

**미표시 필드**: `recipe`, `recipeText`, `nameEn`, `category`, `measures`.

---

## 7. 작업 이력·스크립트 (스냅샷)

### DB 보강 (2026-05-23)

- `scripts/enrich-database.mjs` — API 27종 fetch → `scripts/enriched-output.json`
- `scripts/generate-database.mjs` — JSON → `database.js` 생성 (당시 JS)
- 이후 **TypeScript 마이그레이션** + `api-cocktails.ts` 대량 번들 추가로 구조 변경

### 권장 후속 (기록만, 미착수)

- [ ] `api.ts` 라이브 호출 제거 또는 dev 전용으로 격리
- [ ] `CocktailCard`에 `recipe` / `recipeText` 노출
- [ ] API 병합 426종에 `nameKo` 또는 검색 별칭
- [ ] `recipeText` 한국어 번역 필드
- [ ] `conversation.ts` 미사용 상수·`engine.detectIntent` 정리
- [ ] LLM 연동 시 `persona` + API 키 env

---

## 8. 기타 발견

- **README.md**: 기본 Vite 템플릿 문구, BarBot 설명 없음
- **Import 경로**: `.tsx` 파일이 `@/...jsx` 확장자로 import (Vite/TS에서 동작하나 `.js`로 통일 가능)
- **`conversation.ts` 칵테일 매칭**: `c.name`만 검사 — `nameEn` 미포함
- **랜덤 추천**: 전체 병합 배열(400+)에서 선택 → 영문 이름 칵테일이 자주 나올 수 있음
- **맛 추론 한계**: 재료 키워드 휴리스틱이라 네그로니·블러디메리 등 수동 프로필과 불일치 가능 → 로컬 28은 `taste` API값으로 덮어씀

---

## 작업 로그

> 새 작업은 **이 섹션 맨 아래에만** 블록追加. 위 §1~8 삭제 금지.

### 2026-05-23 — Auto

- 프로젝트 읽기만 함. BarBot 구조·규칙 바텐더·로컬 DB 28종 파악.
- TheCocktailDB API 정리 요청 응답 (엔드포인트, 로컬 대비).

### 2026-05-23 — Auto

- 로컬 DB API 보강: `enrich-database.mjs` / `generate-database.mjs`, 28종 `nameEn`·`recipe`·`taste` 등.
- Painkiller API 없음 → 수동 레시피.

### 2026-05-23 — Auto

- `research.md` 최초 작성 (§1~8 참고 메모 + 로그 혼합).

### 2026-05-23 — Auto

- 사용자: 로그만追加·삭제 금지·caveman·파일 자주 참조 X.
- 실수: §1~8 지움 → **복원**, 로그 섹션 분리.

### 2026-05-23 — Auto

- 사용자: 파일은 작업 로그용, 내용 지우지 말고 **무슨 작업했는지만 정리**.
- §1~8 복원 유지, `## 작업 로그`만追加 방식으로 고정.

### 2026-05-23 — Claude — JS → TS 마이그레이션 완료

- jsconfig.json → tsconfig.json (strict, @/ alias, jsx: react-jsx)
- 19개 파일 .js/.jsx → .ts/.tsx, main.ts → main.tsx (JSX 포함)
- vite.config.js → .ts (import.meta.url로 __dirname 대체)
- eslint.config.js: typescript-eslint 통합
- src/types.ts 신규: Cocktail, Message, Expression, BartenderResponse 등 전역 타입 정의
- api.ts: Drink/DrinkResponse 등 API 응답 타입 정의
- 6개 컴포넌트: props 인터페이스 명시화
- App.tsx: useState/useCallback 제네릭 타입 적용

**JS→TS 개선점:**
1. **props 타입 안전성** — 컴포넌트 props가 인터페이스로 정의되어 전달 실수 컴파일 타임에 차단
2. **런타임 에러 감소** — undefined/null 접근, 잘못된 타입 전달을 빌드 단계에서 발견
3. **자동완성·리팩터링** — IDE에서 Cocktail/Message 구조체 필드 자동완성, rename 시 전파
4. **unused 변수 제거** — `@typescript-eslint/no-unused-vars`로 conversation.ts 내 3개 데드 코드 발견·정리
5. **strict null 검사** — `document.getElementById('root')` null 체크 강제 (main.tsx)
6. **import 경로 검증** — .js→.ts 변경 후 존재하지 않는 모듈 import를 빌드 실패로 탐지
7. **명시적 API 계약** — 함수 시그니처에 입출력 타입이 선언되어 로직 파악 용이

**비용**: 빌드 342ms (JS 대비 큰 차이 없음), 번들 554KB 동일 (타입은 런타임 제거됨)

### 2026-05-23 — Claude — 테마 변경 · 외관/내부 UI 구축 · VN 스타일 버튼

**테마 변경:**
- 기존 핫핑크(#FF2D95) 네온 헬/사이버펑크 → 웜 골드(#C4A35A) 모던 바
- `src/index.css` 모든 애니메이션 gold 버전 추가 (glow-gold, glow-gold-box, warm-glow, subtle-glow)
- `CocktailCard`·`DialogueBox`·`ChatInput`·`header` gold 테마 적용

**외관 (BarExterior):**
- 브릭 파사드(brick wall background) + 캔버스 어닝 + 사인(glow-gold)
- 좌/우 윈도우 (막대 패턴 + 따뜻한 빛 새어나옴)
- 중앙 도어 (창문 + 손잡이 + 문턱)
- 빗줄기 애니메이션 (CSS `rain` keyframe, 무작위 지연)
- 보도(sidewalk) + 분위기 텍스트

**실내 (BarInterior):**
- 우드 월 패널 (linear-gradient 반복)
- 3단 선반 + 컬러 병들 (주황·초록·갈색 등, 각각 고유 높이)
- 펜던트 조명 2개 (warm-glow 애니메이션, amber 빛)
- 하단 페이드 처리 (내부 어둡게)

**바텐더 (BartenderSprite):**
- `character.png`(485×514, RGBA) Vite 에셋 import로 표시
- 3s ease-in-out 무한 float 애니메이션 적용
- 캐릭터 바로 아래에 **카운터**(counter) 렌더링 — `BartenderSprite` 내부에 직접 구현 (별도 컴포넌트 분리 안 함)
- 카운터: 손님 시점 원근법 — 상판(top surface) + 전면(front face)
- 코스터: 타원형(`border-radius: 50%`, 36×28), `radial-gradient(ellipse…)` + 내부 링

**발견/팁:**
1. **카운터 위치**: `BartenderSprite.tsx`에서 flex-col + `marginBottom: -10`(캐릭터) + `marginTop: -18`(카운터) = 총 -28px 겹침으로 캐릭터-카운터 간극 제거
2. **원근 코스터**: 정사각형이 아닌 `width: 36, height: 28` 타원 + `radial-gradient(ellipse…)`로 평면 원근감 표현
3. **씬 전환 패턴**: `useState<'outside' | 'inside'>` 단순 enum 씬 전환 — `handleEnter`에서 첫 인사 400ms 지연, `handleExit`에서 2초 후 `messages: []` 초기화
4. **채팅 영역 구조**: `flex-1` 내부에서 `BartenderSprite`(위) + 채팅 영역(아래, maxHeight: 35vh)으로 분할
5. **나가기 버튼 (VN 스타일)**:
   - 헤더에서 제거 → 채팅 영역 **아래** 별도 `<div>`에 배치 (채팅 영역과 겹치지 않음)
   - `[ 나가기 ]` 브라켓 스타일, 빨강(#b83838), hover 시 밝아짐 + border 강조
   - `justify-end`로 우측 정렬, `px-4 pb-3 pt-0.5` 패딩
6. **CSS 애니메이션**: `@keyframes float`(translateY 3s), `@keyframes rain`(Y+100%, 무작위 delay), `@keyframes light-flicker`(불투명도 깜빡임), `@keyframes warm-glow`(boxShadow 확장/축소)
7. **배경 그림자**: `inset 0 0 120px 30px rgba(0,0,0,0.5)` 가상 빛 조절 레이어 (z-index 10)

### 2026-06-29 — Claude — Phase 2 Response Pipeline + lore-followup

**Phase 2 완료:**
- 모든 응답 데이터 `response-templates.ts`로 분리 (INTENT 19개, COCKFAILL 3개, MOOD/TASTE/RUDE 키워드맵, STORY)
- `conversation.ts` switch 완전 제거, `dialogue()` 헬퍼 제거
- 271→292 tests

**lore-followup intent:**
- 8개 패턴 감지 (젓지말고 흔들, 본드식, 007처럼, shaken not stirred 등)
- `conversation-context.ts`: `lastStoryTargetCocktailId`, `getLoreFollowupCocktailId()` 추가
- Martini + 007 lore → "본드식으로요. 젓지 말고 흔들어서 준비할게요." 응답
- 칵테일명 + 제조방식 → `explicit-cocktail` 라우팅 (SHAKE_REFERENCE regex)
- `resolveReply` 우선순위 문제 수정: controller에서 `recommendation.reply` 오버라이드
