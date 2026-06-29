import type { CocktailData } from '../../types.js'
import type {
  AffectState,
  DialogueState,
  RecommendationDecision,
  RecommendationRoute,
  RecommendationRouteTag,
} from '../../types/recommendation.js'
import { renderParagraphPreset } from '../dialogue/text-presets.js'

interface RecommendationOpeningLine {
  id: string
  route: RecommendationRoute
  text: string
  routeTags?: RecommendationRouteTag[]
  dialogueState?: DialogueState
  affectState?: AffectState
}

export interface SelectedRecommendationOpening {
  id: string
  text: string
}

const RECOMMENDATION_OPENING_LINES: RecommendationOpeningLine[] = [
  {
    id: 'mood-context',
    route: 'moodOrder',
    text: '말씀해 주신 기분과 상황을 기준으로 골라봤어요.',
  },
  {
    id: 'mood-tired',
    route: 'moodOrder',
    affectState: 'tired',
    text: '피곤한 날에는 너무 크게 흔들지 않는 쪽으로 골라봤어요.',
  },
  {
    id: 'mood-concerned',
    route: 'moodOrder',
    affectState: 'concerned',
    text: '오늘 마음에 부담이 덜 가는 쪽으로 골라봤어요.',
  },
  {
    id: 'mood-playful',
    route: 'moodOrder',
    affectState: 'playful',
    text: '좋은 분위기를 조금 더 살릴 수 있는 쪽으로 골라봤어요.',
  },
  {
    id: 'mood-awkward',
    route: 'moodOrder',
    affectState: 'awkward',
    text: '기분이 조금 날카로운 날이라면 맛은 또렷하되 과하게 몰아붙이지 않는 쪽으로 볼게요.',
  },
  {
    id: 'mood-warm',
    route: 'moodOrder',
    affectState: 'warm',
    text: '말씀해 주신 분위기에 무리 없이 어울리는 쪽으로 골라봤어요.',
  },
  {
    id: 'mood-pause',
    route: 'moodOrder',
    text: '오늘 분위기에서 잠깐 쉬어갈 수 있는 쪽으로 골라봤어요.',
  },
  {
    id: 'ingredient-base',
    route: 'ingredientOrBaseOrder',
    text: '말씀해 주신 재료와 베이스를 기준으로 골라봤어요.',
  },
  {
    id: 'ingredient-preferred',
    route: 'ingredientOrBaseOrder',
    routeTags: ['ingredient'],
    text: '좋아하신다고 한 재료가 중심에 오도록 골라봤어요.',
  },
  {
    id: 'ingredient-excluded',
    route: 'ingredientOrBaseOrder',
    routeTags: ['excluded-ingredient'],
    text: '빼고 싶다고 하신 재료는 피해서 골라봤어요.',
  },
  {
    id: 'ingredient-menu',
    route: 'ingredientOrBaseOrder',
    text: '그 재료가 잘 살아나는 메뉴 쪽으로 골라봤어요.',
  },
  {
    id: 'taste-preference',
    route: 'tastePreferenceOrder',
    text: '말씀해 주신 취향을 기준으로 골라봤어요.',
  },
  {
    id: 'taste-strength',
    route: 'tastePreferenceOrder',
    routeTags: ['strength'],
    text: '원하신 도수감에 맞춰서 골라봤어요.',
  },
  {
    id: 'taste-question-answer',
    route: 'tastePreferenceOrder',
    routeTags: ['question-answer'],
    text: '답해 주신 선택지를 기준으로 맛의 방향을 맞춰봤어요.',
  },
  {
    id: 'taste-balance',
    route: 'tastePreferenceOrder',
    text: '맛의 균형이 말씀하신 쪽에 가까운 걸로 골라봤어요.',
  },
  {
    id: 'random-pick',
    route: 'randomPick',
    text: '이번에는 제가 하나 골라봤어요.',
  },
  {
    id: 'random-delegated',
    route: 'randomPick',
    routeTags: ['delegated'],
    text: '맡겨 주셨으니 지금 흐름에 맞춰 하나 골라봤어요.',
  },
  {
    id: 'random-counter',
    route: 'randomPick',
    text: '고민을 줄이는 쪽으로 하나 골라봤어요.',
  },
  {
    id: 'direct-order',
    route: 'directCocktailOrder',
    text: '찾으신 메뉴를 준비해 봤어요.',
  },
  {
    id: 'direct-serving',
    route: 'directCocktailOrder',
    dialogueState: 'serving',
    affectState: 'confident',
    text: '바로 찾으신 메뉴로 안내해 드릴게요.',
  },
  {
    id: 'direct-info',
    route: 'directCocktailOrder',
    text: '말씀하신 메뉴 정보를 바로 보여드릴게요.',
  },
  {
    id: 'anecdote-context',
    route: 'anecdoteOrPersonOrder',
    text: '말씀하신 이야기와 가까운 쪽으로 골라봤어요.',
  },
  {
    id: 'anecdote-cue',
    route: 'anecdoteOrPersonOrder',
    text: '그 맥락에서 떠올리기 좋은 메뉴로 골라봤어요.',
  },
  {
    id: 'inference-summary',
    route: 'recommendationInference',
    text: '지금까지 말씀해 주신 내용을 기준으로 골라봤어요.',
  },
  {
    id: 'inference-delegated',
    route: 'recommendationInference',
    routeTags: ['delegated'],
    text: '맡겨 주신 답변까지 반영해서 좁혀봤어요.',
  },
  {
    id: 'inference-curious',
    route: 'recommendationInference',
    affectState: 'curious',
    text: '답변의 결을 맞춰 보니 이쪽이 가장 가까워 보여요.',
  },
  {
    id: 'inference-awkward',
    route: 'recommendationInference',
    affectState: 'awkward',
    text: '말씀의 온도는 조금 낮춰 두고, 조건에 맞는 잔만 차분히 골라봤어요.',
  },
  {
    id: 'inference-warm',
    route: 'recommendationInference',
    affectState: 'warm',
    text: '지금 흐름에는 부담 없이 이어가기 좋은 쪽이 맞아 보여요.',
  },
  {
    id: 'inference-fit',
    route: 'recommendationInference',
    text: '지금까지의 답변에서 가장 잘 맞는 쪽으로 좁혀봤어요.',
  },
]

export function formatExplicitCocktailReply(cocktail: CocktailData): string {
  return `「${cocktail.name}」을 찾으시는군요.\n${selectCocktailTalkingPoint(cocktail)}\n자세한 정보도 함께 보여드릴게요.`
}

export function formatLoreBasedOrderReply(cocktail: CocktailData): string {
  return `「${cocktail.name}」 한 잔 준비할게요.\n${selectCocktailTalkingPoint(cocktail)}`
}

export function formatRandomRecommendationReply(
  cocktail: CocktailData,
  opening = '그럼 제가 하나 골라볼게요.',
): string {
  return `${opening}\n「${cocktail.name}」은 어떠세요?\n${selectCocktailTalkingPoint(cocktail)}`
}

export function formatRecommendationReply(
  decision: RecommendationDecision,
  acknowledgement?: string | null,
  matchType: 'exact' | 'nearest' = 'exact',
): string {
  const reason = decision.reasons.find((item) => item.code !== 'context')
  const opening = acknowledgement ?? selectRecommendationOpening(decision).text
  if (matchType === 'nearest') {
    return `${opening}\n완전히 맞는 칵테일은 없어서 가장 가까운 「${decision.cocktail.name}」을 골랐어요.\n${selectCocktailTalkingPoint(decision.cocktail)}\n말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.`
  }
  const reasonLine = reason
    ? reason.detail
    : '말씀해 주신 취향을 기준으로 골랐어요.'

  const paragraph = renderParagraphPreset({
    speaker: 'karua',
    intent: 'recommend',
    state: paragraphStateForDecision(decision),
    request: paragraphRequestForDecision(decision),
    seed: `${decision.dialogue.route}:${decision.dialogue.affectState}:${decision.cocktail.id}`,
    slots: {
      cocktail_name: decision.cocktail.name,
      cocktail_name_subject: withSubjectParticle(decision.cocktail.name),
      taste_desc: reasonLine,
      reason_desc: reasonLine,
      effect_desc: reasonLine,
      closing_desc: reasonLine,
    },
  })

  const reply = `${paragraph}\n${selectCocktailTalkingPoint(decision.cocktail)}`

  return acknowledgement ? `${acknowledgement}\n${reply}` : reply
}

export function selectCocktailTalkingPoint(cocktail: CocktailData): string {
  const points = cocktail.talkingPoints?.filter((point) => point.trim().length > 0)
  if (!points?.length) return `${cocktail.name}은 오늘의 흐름에 맞춰 천천히 이야기해 보기 좋은 칵테일입니다.`

  const index = stableIndex(cocktail.id, points.length)
  return points[index]
}

function stableIndex(seed: string, length: number): number {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash % length
}

function paragraphStateForDecision(decision: RecommendationDecision): string | undefined {
  if (decision.dialogue.affectState === 'tired') return 'tired'
  return undefined
}

function paragraphRequestForDecision(decision: RecommendationDecision): string | undefined {
  if (decision.dialogue.affectState === 'tired') return 'light'
  if (decision.state.alcoholPreference === 'low') return 'light'
  return undefined
}

function withSubjectParticle(value: string): string {
  return `${value}${hasFinalConsonant(value) ? '이' : '가'}`
}

function hasFinalConsonant(value: string): boolean {
  const chars = [...value.trim()]
  const last = chars[chars.length - 1]
  if (!last) return false
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

export function selectRecommendationOpening(
  decision: RecommendationDecision,
  recentLineIds: string[] = [],
): SelectedRecommendationOpening {
  const routeLines = RECOMMENDATION_OPENING_LINES.filter(
    (line) => line.route === decision.dialogue.route,
  )
  const rankedLines = rankOpeningLines(routeLines, decision)
  const available = rankedLines.filter((line) => !recentLineIds.includes(line.id))
  const selected = available[0] ?? rankedLines[0] ?? routeLines[0] ?? RECOMMENDATION_OPENING_LINES[0]

  return {
    id: selected.id,
    text: selected.text,
  }
}

function rankOpeningLines(
  lines: RecommendationOpeningLine[],
  decision: RecommendationDecision,
): RecommendationOpeningLine[] {
  return lines
    .map((line, index) => ({
      line,
      index,
      score: openingLineScore(line, decision),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.line)
}

function openingLineScore(
  line: RecommendationOpeningLine,
  decision: RecommendationDecision,
): number {
  const { routeTags, dialogueState, affectState } = decision.dialogue
  let score = 0

  if (line.routeTags) {
    if (!line.routeTags.every((tag) => routeTags.includes(tag))) return -1
    score += line.routeTags.length * 10
  }
  if (line.affectState) {
    if (line.affectState !== affectState) return -1
    score += 4
  }
  if (line.dialogueState) {
    if (line.dialogueState !== dialogueState) return -1
    score += 2
  }

  return score
}
