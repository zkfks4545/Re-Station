# Phase 9 — Karua Character Layer Audit Report

**Generated:** 2026-07-02T05:25:49.908Z

---

## 1. Forbidden Pattern Violations

### dialogues.json

| Line | Text (truncated) | Pattern | Severity |
|------|------------------|---------|----------|
| 1 | 그런 말씀은 듣기 좋지 않네요. 기분이 안 좋으시다면 천천히 말씀해 주세요. | counselor-prompt | MEDIUM |
| 5 | 혼자서 보고 있어요. 그래도 불편하신 건 없죠? 천천히 말씀해 주세요. | counselor-prompt | MEDIUM |
| 1 | 괜찮아요. 첫 잔은 기준점이니까요. 다음에는 다른 결로 맞춰볼게요. | blanket-reassurance | MEDIUM |

### dialogues.json — Missing Preferred Patterns

| Line | Text (truncated) |
|------|------------------|
| 6 | 그런 식으로 말씀하시면 저도 대응하기 어려워요. 조금만 부드럽게 부탁드립니다. |
| 6 | 그건 제가 들어드릴 수 없는 요청이에요. 분명히 말씀드립니다. |
| 8 | 제가 해드릴 수 있는 일과 없는 일이 있어요. 그건 불가능한 요청입니다. |
| 2 | Re:Station이에요. 취향 몇 마디면 잔 하나가 따라옵니다. |
| 2 | 초기화 완료됐어요. 다시 처음부터 시작하시면 됩니다. |
| 9 | 비터한 맛은 시간이 지날수록 깊어지는 매력이 있어요. 좋은 선택입니다. |
| 5 | 새콤달콤한 느낌으로 가볼까요? 아니면 확실하게 신맛 위주로? |
| 7 | 물 준비할게요. 서비스는 항상 무료입니다. |
| 2 | 못 드시는 재료가 있으면 먼저 빼고 볼게요. 이름을 알려주시면 후보에서 제외하겠습니다. |
| 2 | 혼자 있는 시간이 필요할 때가 있죠. 잔은 옆에서 너무 참견하지 않는 걸로 보겠습니다. |
| 3 | 말없이 있어도 괜찮아요. 대신 얼음 녹는 소리는 좀 들릴 겁니다. |
| 6 | ${name} 먼저 드셔 보시겠어요? 첫 잔은 가볍게, 그리고 편하게. |

### response-templates.ts — Missing Preferred Patterns

| Line | Text (truncated) |
|------|------------------|
| 123 | 그런 날이 있죠. 무거운 얘기는 천천히. |
| 218 | ${cocktail.name}은 ${cocktail.description} |

### text-presets.ts (Karua) — Missing Preferred Patterns

| Line | Text (truncated) |
|------|------------------|
| 84 | 피곤할 땐 취하는 것보다 쉬는 게 먼저긴 한데... |
| 57 | ${value}을 ${target}로 반영했습니다. |
| 59 | ${value}을 ${target}로 반영했습니다. ${caution} |

---

## 6. Overall Summary

| Metric | Count |
|--------|-------|
| Total strings checked | 525 |
| Forbidden pattern violations | 3 (HIGH: 0) |
| Missing preferred patterns | 30 |
| Sentence length issues | 0 |
| Design flag issues | 0 |

### Recommendations

1. **HIGH severity violations** must be fixed before Phase 9 can be considered complete.
2. **Sentence length issues** should be reviewed for conciseness.
3. **Missing preferred patterns** indicate responses that lack Karua's characteristic voice.
4. **Design flag issues** need manual review for character consistency.
5. Template strings containing placeholders (`{}` or `${}`) will be resolved at runtime — verify final rendered output separately.
