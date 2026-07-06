# Re:Station

> 가상의 바, 현실의 취향.  
> 취향 몇 마디면 잔 하나가 따라옵니다.

**Re:Station**은 바텐더 *카루아*와의 대화를 통해 나에게 딱 맞는 칵테일을 찾아주는 웹 애플리케이션입니다. 추천 엔진, 캐릭터 대화 시스템, 세션 기반 플로우를 갖추고 있으며 WebLLM을 통한 의미 분석 보조를 실험적으로 지원합니다.

## 주요 기능

- **대화형 추천** — "오늘 좀 피곤해요" 같은 자연어 입력으로 취향을 파악하고 4축 질문(맛·도수·탄산·베이스)으로 좁혀가며 칵테일을 추천합니다
- **카루아 캐릭터** — 반존대와 농담을 섞는 바텐더 카루아가 입력 경로·대화 상태·감정 상태에 따라 각기 다른 대사와 표정으로 응답합니다
- **시에스타 만담** — 가끔 동료 바텐더 시에스타가 난입하는 짧은 이벤트. 세션당 최대 2회, 4발화 구조로 대화권을 반환합니다
- **추천 결과 카드** — 추천받은 칵테일의 설명·레시피·이야깃거리를 카드로 표시하고 **주문하기** 또는 **이야기하기**를 선택할 수 있습니다
- **도감 시스템** — 만난 칵테일이 도감에 기록되며, 사이드바에서 다시 확인할 수 있습니다
- **XYZ · Farewell Phase** — 도수 누적 한계에 도달하면 마지막 잔(XYZ)을 서빙하고 Farewell Phase로 자연스럽게 세션을 마무리합니다

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | React 19 + Vite 8 |
| 언어 | TypeScript 6 |
| 테스트 | Vitest (609개 테스트) |
| 스타일 | Tailwind CSS 4 + 수동 테마 |
| 의미 분석 | WebLLM (실험적, 기본 OFF) |
| 패키지 매니저 | npm |

## 시작하기

```bash
cd bar_tend
npm install
npm run dev
```

브라우저가 자동으로 열리며 `http://localhost:5173`에서 앱을 사용할 수 있습니다.

### 주요 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm test` | Vitest 단위 테스트 실행 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
bar_tend/
  src/
    App.tsx                    — 메인 진입점, 화면 조정
    components/
      bar/                     — CocktailCard, DialogueBox, ChatInput, BartenderSprite 등
      sidebar/                 — 도감, 레시피, BGM 사이드바
      entrance/                — 입장 화면
    hooks/                     — useRestationController, useRecommendationSession 등
    lib/
      recommendation/          — 추천 엔진, 상태, 질문 엔진, 응답 포맷터
      dialogue/                — 대화 서비스, ResponsePlan, 입력 라우터, 캐릭터 레이어
      character/               — 카루아 말투 검증, 캐릭터 프로필
      banter/                  — 시에스타 만담 이벤트 엔진
      session/                 — 세션 플로우, XYZ/Farewell
      webllm/                  — WebLLM Worker, 의미 분석, 검증
      bartender/               — 의도 분류, 키워드 규칙
      cocktails/               — 칵테일 DB, 검색, lore 참조
      storage/                 — localStorage 저장소
      relationship/            — 숨은 관계성 상태
      timing/                  — 타이머 레지스트리
    types/                     — TypeScript 타입 정의
    data/                      — JSON 데이터 (칵테일 DB, 질문, 키워드 규칙)
```

## 기여

프로젝트의 개발 문서와 작업 보드는 `mission_control/` 디렉토리에서 관리됩니다. 작업을 시작하기 전에 아래 파일을 먼저 확인해 주세요.

1. [`mission_control/README.md`](mission_control/README.md) — 문서 진입점과 읽기 우선순위
2. [`mission_control/CURRENT_STATE.md`](mission_control/CURRENT_STATE.md) — 현재 구현 상태와 검증 현황
3. [`mission_control/HANDOVER.md`](mission_control/HANDOVER.md) — 최신 작업 흐름과 주의사항
4. [`mission_control/DECISIONS.md`](mission_control/DECISIONS.md) — 변경하면 안 되는 핵심 결정

## 라이선스

Private — All rights reserved.
