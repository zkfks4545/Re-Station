export type TextPresetId =
  | 'question.preference.select'
  | 'question.flow.leadIn'
  | 'question.flow.continuation'
  | 'answer.preference.applied'
  | 'answer.preference.appliedWithCaution'
  | 'answer.delegated'
  | 'answer.freeTextApplied'

export interface TextPresetRef {
  id: TextPresetId
  slots?: Record<string, string>
}

export type DialogueSpeaker = 'karua' | 'siesta'

export type DialogueParagraphIntent =
  | 'greeting'
  | 'welcome_drink'
  | 'ask_preference'
  | 'recommend'
  | 'explain'
  | 'small_talk'
  | 'joke'
  | 'comfort'
  | 'refusal'
  | 'goodbye'

export interface ParagraphPresetContext {
  speaker: DialogueSpeaker
  intent: DialogueParagraphIntent
  state?: string
  request?: string
  slots: Record<string, string | undefined>
  seed?: string
}

type TextPresetRenderer = (slots: Record<string, string>) => string

interface ParagraphPreset {
  id: string
  speaker: DialogueSpeaker
  intent: DialogueParagraphIntent
  state?: string
  request?: string
  blocks: {
    reaction: string[]
    recommend: string[]
    explanation: string[]
  }
}

const TEXT_PRESETS: Record<TextPresetId, TextPresetRenderer> = {
  'question.preference.select': ({ target }) => `선호하는 ${withObjectParticle(target)} 선택해 주세요.`,
  'question.flow.leadIn': ({ text }) => text,
  'question.flow.continuation': ({ text }) => text,
  'answer.preference.applied': ({ value, target }) => `${value}을 ${target}로 반영했습니다.`,
  'answer.preference.appliedWithCaution': ({ value, target, caution }) =>
    `${value}을 ${target}로 반영했습니다. ${caution}`,
  'answer.delegated': () => '현재까지의 응답을 기준으로 추천합니다.',
  'answer.freeTextApplied': () => '말씀해 주신 내용을 함께 볼게요.',
}

export function renderTextPreset(ref: TextPresetRef | undefined, fallback = ''): string {
  if (!ref) return fallback
  const renderer = TEXT_PRESETS[ref.id]
  if (!renderer) return fallback
  const rendered = renderer(ref.slots ?? {}).trim()
  return rendered || fallback
}

const PARAGRAPH_PRESETS: ParagraphPreset[] = [
  {
    id: 'karua.recommend.tired.light',
    speaker: 'karua',
    intent: 'recommend',
    state: 'tired',
    request: 'light',
    blocks: {
      reaction: [
        '그럼 너무 무거운 건 말고요.',
        '오늘은 좀 가볍게 가죠.',
        '연료 부족 경고등이 켜진 것 같은데요.',
        '피곤할 땐 취하는 것보다 쉬는 게 먼저긴 한데...',
        '그래도 빈손으로 보내긴 아쉽고요.',
      ],
      recommend: [
        '{cocktail_name} 괜찮겠네요.',
        '{cocktail_name} 쪽으로 드릴까요?',
        '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
      ],
      explanation: [
        '{taste_desc}',
        '{reason_desc}',
        '{effect_desc}',
        '{closing_desc}',
      ],
    },
  },
  {
    id: 'siesta.recommend.tired.light',
    speaker: 'siesta',
    intent: 'recommend',
    state: 'tired',
    request: 'light',
    blocks: {
      reaction: [
        '피곤하다는 손님은 많아.',
        '그 정도면 아직 괜찮은 편이네.',
        '연료가 바닥난 건 아니고, 예비등 정도인가.',
      ],
      recommend: [
        '{cocktail_name}으로 하지.',
        '{cocktail_name} 정도면 되겠군.',
        '오늘은 {cocktail_name} 쪽이 낫겠어.',
      ],
      explanation: [
        '억지로 기운을 내는 술은 아니야.',
        '적어도 숨 돌릴 시간은 만들어주거든.',
        '잠깐 쉬어간다는 의미론 나쁘지 않지.',
      ],
    },
  },
  {
    id: 'karua.recommend.default',
    speaker: 'karua',
    intent: 'recommend',
    blocks: {
      reaction: [
        '그럼 지금 흐름에 맞춰볼게요.',
        '좋아요, 조건은 대충 잡혔어요.',
        '이쪽이면 크게 빗나가진 않을 것 같네요.',
      ],
      recommend: [
        '{cocktail_name} 괜찮겠네요.',
        '{cocktail_name} 쪽으로 가볼게요.',
        '오늘은 {cocktail_name_subject} 어울릴 것 같아요.',
      ],
      explanation: [
        '{taste_desc}',
        '{reason_desc}',
        '{effect_desc}',
        '{closing_desc}',
      ],
    },
  },
  {
    id: 'siesta.recommend.default',
    speaker: 'siesta',
    intent: 'recommend',
    blocks: {
      reaction: [
        '조건은 충분해.',
        '그 정도면 고를 수 있겠군.',
        '복잡하게 갈 필요는 없겠어.',
      ],
      recommend: [
        '{cocktail_name}으로 하지.',
        '{cocktail_name} 정도면 되겠군.',
        '오늘은 {cocktail_name} 쪽이 낫겠어.',
      ],
      explanation: [
        '{taste_desc}',
        '{reason_desc}',
        '{effect_desc}',
        '{closing_desc}',
      ],
    },
  },
]

export function renderParagraphPreset(context: ParagraphPresetContext): string {
  const preset = selectParagraphPreset(context)
  const seed = context.seed ?? `${context.speaker}:${context.intent}:${context.state ?? ''}:${context.request ?? ''}`
  return (['reaction', 'recommend', 'explanation'] as const)
    .map((block) => renderParagraphBlock(preset.blocks[block], context.slots, `${seed}:${block}`))
    .filter(Boolean)
    .join('\n')
}

function selectParagraphPreset(context: ParagraphPresetContext): ParagraphPreset {
  return PARAGRAPH_PRESETS.find((preset) =>
    preset.speaker === context.speaker &&
    preset.intent === context.intent &&
    preset.state === context.state &&
    preset.request === context.request
  ) ?? PARAGRAPH_PRESETS.find((preset) =>
    preset.speaker === context.speaker &&
    preset.intent === context.intent &&
    !preset.state &&
    !preset.request
  ) ?? PARAGRAPH_PRESETS[0]
}

function renderParagraphBlock(
  lines: string[],
  slots: ParagraphPresetContext['slots'],
  seed: string,
): string {
  const rendered = lines
    .map((line) => interpolateSlots(line, slots).trim())
    .filter((line) => line && !/{[a-zA-Z0-9_]+}/.test(line))
  if (rendered.length === 0) return ''
  return rendered[pickIndex(seed, rendered.length)]
}

function interpolateSlots(line: string, slots: ParagraphPresetContext['slots']): string {
  return line.replace(/{([a-zA-Z0-9_]+)}/g, (_match, key: string) => slots[key] ?? '')
}

function pickIndex(seed: string, length: number): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash % length
}

function withObjectParticle(value = ''): string {
  return `${value}${hasFinalConsonant(value) ? '을' : '를'}`
}

function hasFinalConsonant(value: string): boolean {
  const chars = [...value.trim()]
  const last = chars[chars.length - 1]
  if (!last) return false
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}
