<div align="center">

# Re:Station

[🇺🇸 English](#english) · [🇯🇵 日本語](#japanese) · [🇰🇷 한국어](#korean)

</div>

---

## <a id="english"></a>🇺🇸 English

> *A virtual bar for real tastes.*  
> *A few words about your mood, and a glass finds its way to you.*

**Re:Station** is a web application that helps you find the perfect cocktail through conversation with the bartender *Karua*. It features a recommendation engine, a character-driven dialogue system, and a session-based flow, with experimental WebLLM semantic analysis support.

<!-- TODO: add screenshot — entrance screen or main chat view -->

### Features

- **Conversational recommendations** — Natural language input like "I'm tired today" is analyzed across four axes (taste, strength, carbonation, base spirit) through adaptive questions
- **Karua character** — The bartender responds with distinct lines and expressions based on input route, dialogue state, and emotional state
- **Siesta banter** — Occasional brief interruptions from fellow bartender Siesta (max 2 per session, 4-turn structure with return of conversation)
- **Result card** — Shows description, recipe, and talking points for each recommended cocktail, with options to **order** or **ask for its story**
- **Cocktail codex** — Every encountered cocktail is recorded in the sidebar codex
- **XYZ · Farewell Phase** — When the cumulative alcohol star limit is reached, the final drink (XYZ) is served and the session naturally concludes

<!-- TODO: add screenshot — result card with order/story buttons -->

### Tech Stack

| Area | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript 6 |
| Tests | Vitest (609 tests) |
| Styling | Tailwind CSS 4 + custom theme |
| Semantic Analysis | WebLLM (experimental, default OFF) |
| Package Manager | npm |

### Getting Started

```bash
cd bar_tend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm test` | Run Vitest tests |
| `npm run lint` | Run ESLint |

### Project Structure

```
bar_tend/
  src/
    App.tsx                    — Entry point, view controller
    components/
      bar/                     — CocktailCard, DialogueBox, ChatInput, BartenderSprite
      sidebar/                 — Codex, recipe, music tabs
      entrance/                — Entrance screen
    hooks/                     — useRestationController, useRecommendationSession
    lib/
      recommendation/          — Engine, state machine, question engine, response formatter
      dialogue/                — Dialogue service, ResponsePlan, input router, character layer
      character/               — Karua speech validation, character profile
      banter/                  — Siesta banter event engine
      session/                 — Session flow, XYZ / Farewell
      webllm/                  — WebLLM worker, semantic analysis, validator
      bartender/               — Intent classifier, keyword rules
      cocktails/               — Cocktail database, search, lore references
      storage/                 — localStorage persistence
      relationship/            — Hidden rapport state
      timing/                  — Timer registry
    types/                     — TypeScript type definitions
    data/                      — JSON data (cocktails, questions, keyword rules)
```

---

## <a id="japanese"></a>🇯🇵 日本語

> *バーチャルなバー、リアルな味わい。*  
> *気分をひとこと、グラスが応える。*

**Re:Station** は、バーテンダー *カルア* との会話を通じてぴったりのカクテルを見つけられるウェブアプリケーションです。レコメンドエンジン、キャラクター主導の対話システム、セッションベースのフローを備え、実験的にWebLLMによる意味分析をサポートしています。

<!-- TODO: スクリーンショット追加 — 入場画面またはメインチャット画面 -->

### 機能

- **会話型レコメンド** — 「今日は疲れた」のような自然な入力から好みを分析。味・強さ・炭酸・ベースの4軸で質問を絞り込みます
- **カルアのキャラクター** — 入力経路・対話状態・感情状態に応じて、異なる台詞と表情で応答します
- **シエスタの乱入** — 同僚バーテンダー・シエスタが時折短い乱入イベントを発生（1セッション最大2回、4ターン構造で会話権を返却）
- **結果カード** — おすすめカクテルの説明・レシピ・豆知識を表示。「注文する」または「話を聞く」を選択可能
- **カクテル図鑑** — 出会ったカクテルはサイドバーの図鑑に記録されます
- **XYZ · フェアウェルフェーズ** — 累積アルコールスターが上限に達すると最後の一杯（XYZ）を提供し、自然にセッションを終了します

<!-- TODO: スクリーンショット追加 — 結果カード（注文/話を聞くボタン） -->

### 技術スタック

| 領域 | 技術 |
|---|---|
| フレームワーク | React 19 + Vite 8 |
| 言語 | TypeScript 6 |
| テスト | Vitest（609 tests） |
| スタイリング | Tailwind CSS 4 + カスタムテーマ |
| 意味分析 | WebLLM（実験的、デフォルトOFF） |
| パッケージ管理 | npm |

### 始め方

```bash
cd bar_tend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` が開きます。

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + プロダクションビルド |
| `npm test` | Vitestテスト実行 |
| `npm run lint` | ESLintチェック |

---

## <a id="korean"></a>🇰🇷 한국어

> *가상의 바, 현실의 취향.*  
> *취향 몇 마디면 잔 하나가 따라옵니다.*

**Re:Station**은 바텐더 *카루아*와의 대화를 통해 나에게 딱 맞는 칵테일을 찾아주는 웹 애플리케이션입니다. 추천 엔진, 캐릭터 대화 시스템, 세션 기반 플로우를 갖추고 있으며 WebLLM을 통한 의미 분석 보조를 실험적으로 지원합니다.

<!-- TODO: 스크린샷 추가 — 입장 화면 또는 메인 채팅 화면 -->

### 주요 기능

- **대화형 추천** — "오늘 좀 피곤해요" 같은 자연어 입력으로 취향을 파악하고 4축 질문(맛·도수·탄산·베이스)으로 좁혀가며 칵테일을 추천합니다
- **카루아 캐릭터** — 반존대와 농담을 섞는 바텐더 카루아가 입력 경로·대화 상태·감정 상태에 따라 각기 다른 대사와 표정으로 응답합니다
- **시에스타 만담** — 가끔 동료 바텐더 시에스타가 난입하는 짧은 이벤트. 세션당 최대 2회, 4발화 구조로 대화권을 반환합니다
- **추천 결과 카드** — 추천받은 칵테일의 설명·레시피·이야깃거리를 카드로 표시하고 **주문하기** 또는 **이야기하기**를 선택할 수 있습니다
- **도감 시스템** — 만난 칵테일이 도감에 기록되며, 사이드바에서 다시 확인할 수 있습니다
- **XYZ · Farewell Phase** — 도수 누적 한계에 도달하면 마지막 잔(XYZ)을 서빙하고 Farewell Phase로 자연스럽게 세션을 마무리합니다

<!-- TODO: 스크린샷 추가 — 결과 카드 (주문하기/이야기하기 버튼) -->

### 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | React 19 + Vite 8 |
| 언어 | TypeScript 6 |
| 테스트 | Vitest (609개 테스트) |
| 스타일 | Tailwind CSS 4 + 수동 테마 |
| 의미 분석 | WebLLM (실험적, 기본 OFF) |
| 패키지 매니저 | npm |

### 시작하기

```bash
cd bar_tend
npm install
npm run dev
```

브라우저가 자동으로 열리며 `http://localhost:5173`에서 앱을 사용할 수 있습니다.

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm test` | Vitest 단위 테스트 실행 |
| `npm run lint` | ESLint 검사 |

---

<div align="center">

### Contributors

Development documentation and task board: [`mission_control/`](mission_control/)  
Start with [`mission_control/README.md`](mission_control/README.md) for reading order.

---

*Private — All rights reserved.*

</div>
