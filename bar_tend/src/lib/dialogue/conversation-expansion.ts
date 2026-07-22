import type { RecommendationQuestion } from '../../types/recommendation.js'
import type { ConversationTopic } from '../session/dialogue-session.js'
import { extractRecommendationSignals } from '../recommendation/state.js'
import { classifyRecommendationQuestionInput } from '../recommendation/question-context.js'

export interface ConversationInterruption {
  topic: Exclude<ConversationTopic, 'none' | 'recommendation' | 'safety'>
  contractReply?: string
}

export function classifyRecommendationInterruption(
  input: string,
  question: RecommendationQuestion,
): ConversationInterruption | null {
  const text = input.trim().toLowerCase()
  if (!text || classifyRecommendationQuestionInput(text) || matchesChoice(text, question)) return null

  if (/카루아|칼루아/.test(text) && /왜|이름|누구|뭐\s*하는/.test(text)) {
    return {
      topic: 'character',
      contractReply: '카루아예요. 좋아해서 붙인 이름인데, 더 깊은 뜻은 나중에 생길지도 모르죠.',
    }
  }
  if (/시에스타|사장님|사장은|너는|당신은/.test(text)) {
    return { topic: 'character' }
  }
  if (/re:station|리스테이션|환상주점|이\s*바|여긴|여기.*(?:곳|세계)|세계관/.test(text)) {
    return { topic: 'world-building' }
  }
  if (/인생|행복|사랑|운명|후회|꿈은|삶은|사는\s*이유/.test(text) && /뭐|왜|어떻게|생각|의미|뜻|인가/.test(text)) {
    return {
      topic: 'worldview',
      contractReply: '정답이 있으면 벌써 메뉴 이름으로 붙었겠죠. 저는 아직 잔 닦는 쪽이에요.',
    }
  }
  if (/칵테일|레시피|재료|유래|도수|베이스|누가.*(?:만들|마시)|왜.*이름|어떤\s*술/.test(text)
    && /뭐|왜|어떻게|알려|설명|궁금|이야기|뜻|누가|어떤/.test(text)) {
    return { topic: 'cocktail-info' }
  }
  if (/피곤|지쳤|퇴근|졸려|힘들|우울|슬퍼|외롭|스트레스|속상|답답|좋은\s*일|기쁘|날씨|비가|눈이|춥|더워/.test(text)
    && !extractRecommendationSignals(text).some((signal) =>
      signal.field.startsWith('taste.')
      || signal.field === 'alcoholPreference'
      || signal.field === 'preferredIngredients'
      || signal.field === 'excludedIngredients')) {
    return { topic: 'daily-life' }
  }
  if (/[?？]|(?:뭐야|뭔데|왜|어떻게|알려\s*줘|무슨\s*뜻|차이가)/.test(text)) {
    return {
      topic: 'knowledge',
      contractReply: '그건 제 메뉴판 밖이라 아는 척하면 잔이 먼저 깨져요. 칵테일 이야기라면 제대로 이어갈게요.',
    }
  }
  return null
}

export function appendRecommendationResume(
  reply: string,
  question: RecommendationQuestion,
): string {
  const prompt = question.prompt.replace(/[.?!。？！]+$/, '')
  return `${reply}\n그 얘기는 여기 두고, 아까 질문인 “${prompt}”로 돌아가 볼까요?`
}

function matchesChoice(input: string, question: RecommendationQuestion): boolean {
  const normalized = input.replace(/\s/g, '')
  return question.choices.some((choice) => {
    const label = choice.label.toLowerCase().replace(/\s/g, '')
    return normalized === label || normalized.includes(label)
  })
}
