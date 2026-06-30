# 리팩토링 기록 (축약)

> 동작 변경 없이 구조와 가독성을 개선한 작업 추적.

## 2026-06-25 / REF-SESSION-001 / 세션 종료 응답 포맷 책임 분리
- 문제: 컨트롤러에 세션 흐름 제어 + 종료 응답 생성 책임 혼재
- 변경: `formatXyzReply`/`formatFarewellBlockReply`/`formatReturnHomeReply` → `lib/session/farewell-replies.ts` 이동
- 기대: Controller는 흐름만 제어, 세션 도메인 응답은 `lib/session` 담당
- 검증: farewell-replies.test.ts 통과, check 통과

## 2026-06-25 / REF-SESSION-002 / 주문 종료 단계 판정 명시화
- 문제: `sessionPhase === 'xyz' \|\| sessionPhase === 'farewell' \|\| sessionPhase === 'returnHome'` 조건 반복
- 변경: `lib/session/session-flow.ts`에 `isOrderingClosedPhase` 함수로 추출
- 검증: session-flow.test.ts 통과, check 통과
