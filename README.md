<div align="center">

# Re:Station

[English](#english) · [日本語](#japanese) · [한국어](#korean)

</div>

---

## <a id="english"></a>English

> *A virtual bar for real tastes.*

Re:Station is a React/Vite web application where you discover cocktails through conversation with bartender Karua. It combines adaptive recommendations, character-driven dialogue, a cocktail codex, Siesta banter, and a session-based farewell flow.

### Features

- Conversational recommendations across taste, strength, carbonation, and base spirit
- Karua responses selected by input route, dialogue state, affect, and expression
- Optional Siesta banter and XYZ/Farewell session flow
- Cocktail result cards with recipe, story, order, and codex actions
- Experimental WebLLM semantic analysis, isolated and default OFF

### Tech stack

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS 4 · Vitest · npm

### Getting started

```bash
cd bar_tend
npm install
npm run dev
```

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and create a production build |
| `npm test -- --run` | Run the full Vitest suite |
| `npm run lint` | Run ESLint |
| `npm run check` | Run TypeScript without emitting files |

## <a id="japanese"></a>日本語

Re:Stationは、バーテンダーのカルアとの会話を通じてカクテルを見つけるReact/Viteアプリケーションです。味・度数・炭酸・ベースの4軸レコメンド、キャラクター対話、カクテル図鑑、シエスタの会話イベント、XYZフェアウェルを提供します。

WebLLMによる意味分析は実験的な補助機能で、標準では無効です。最終的な対話・推薦・状態遷移はJSON、FSM、ルールエンジンが担当します。

## <a id="korean"></a>한국어

Re:Station은 바텐더 카루아와 대화하며 취향에 맞는 칵테일을 찾는 React/Vite 애플리케이션입니다. 맛·도수·탄산·베이스 4축 추천, 캐릭터 대화, 칵테일 도감, 시에스타 만담, XYZ/Farewell 세션을 제공합니다.

WebLLM 의미 분석은 실험적 보조 기능이며 기본적으로 비활성화되어 있습니다. 최종 대화·추천·상태 전이는 JSON, FSM, 규칙 엔진이 담당합니다.

## Project structure

```text
bar_tend/src/
  components/       UI, chat, sidebar, entrance
  hooks/            controller and interaction orchestration
  lib/dialogue/     dialogue routing and ResponsePlan
  lib/recommendation/ recommendation state and questions
  lib/session/      session flow, XYZ, farewell
  lib/webllm/       isolated experimental semantic layer
  assets/           Karua sprites and shaker animation frames
mission_control/    current state, task board, work log, structure reports
```

## Current verification

- Vitest: 63 test files / 824 tests passing
- `npm run lint`, `npm run check`, and `npm run build` passing
- P0–P5 complete; Phase 13 WebLLM adoption decision is deferred
- Main JS: 549.33 kB (gzip 164.52 kB); the remaining 500 kB warning is documented for future feature-level splitting

Project status and decision records live in [`mission_control/CURRENT_STATE.md`](mission_control/CURRENT_STATE.md), [`mission_control/TASK_BOARD.md`](mission_control/TASK_BOARD.md), and [`mission_control/WORK_LOG.md`](mission_control/WORK_LOG.md).

<div align="center">

*Private — All rights reserved.*

</div>
