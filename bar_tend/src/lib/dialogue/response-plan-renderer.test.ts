import { describe, expect, it } from 'vitest'
import {
  renderExactRecommendationResponsePlan,
  renderFarewellBlockResponsePlan,
  renderFarewellConversationResponsePlan,
  renderNearestRecommendationResponsePlan,
  renderRecommendationQuestionResponsePlan,
  renderRandomPickResponsePlan,
  renderRecommendationFormatterLine,
  renderReturnHomeResponsePlan,
  renderStandardFarewellEntryResponsePlan,
  renderWelcomeDrinkFeedbackResponsePlan,
  renderWelcomeDrinkResponsePlan,
  renderWelcomeFarewellXyzResponsePlan,
  renderWelcomeXyzClarificationResponsePlan,
  renderXyzFarewellResponsePlan,
} from './response-plan-renderer.js'

describe('recommendation formatter slot renderer', () => {
  it('허용된 recommendation formatter slot만 치환한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '「{cocktail_name}」은 어떠세요?\n{talking_point}',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
      talking_point: '짧고 또렷한 잔이에요.',
    })).toEqual({
      text: '「마티니」은 어떠세요?\n짧고 또렷한 잔이에요.',
      expression: 'smirk',
    })
  })

  it('허용되지 않은 slot을 거부한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '{opening}\n「{cocktail_name}」은 어떠세요?',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
    })).toBeNull()
  })

  it('필수 slot 값이 없으면 거부한다', () => {
    expect(renderRecommendationFormatterLine({
      text: '「{cocktail_name}」은 어떠세요?\n{talking_point}',
      expression: 'smirk',
    }, {
      cocktail_name: '마티니',
    })).toBeNull()
  })

  it('선택된 opening을 slot 처리 없이 최종 본문 앞에 보존한다', () => {
    expect(renderRandomPickResponsePlan('이번에는 제가 골라봤어요.', '마티니', '짧고 또렷한 잔이에요.')).toEqual({
      text: '이번에는 제가 골라봤어요.\n「마티니」은 어떠세요?\n짧고 또렷한 잔이에요.',
      expression: 'smirk',
    })
  })

  it('이미 결정된 exact recommendation 값만 최종 본문에 치환한다', () => {
    const rendered = renderExactRecommendationResponsePlan('neutral', 'fixed-seed', {
      cocktail_name: '마티니',
      cocktail_name_subject: '마티니가',
      reason: '드라이한 취향과 잘 맞아요.',
      talking_point: '짧고 또렷한 잔이에요.',
    })

    expect(rendered?.text).toContain('마티니')
    expect(rendered?.text).toContain('드라이한 취향과 잘 맞아요.')
    expect(rendered?.text).toContain('짧고 또렷한 잔이에요.')
    expect(rendered?.expression).toBe('smirk')
  })

  it('이미 결정된 nearest fallback 값만 최종 본문에 치환한다', () => {
    expect(renderNearestRecommendationResponsePlan('concerned', {
      cocktail_name: '마티니',
      fallback_reason: '말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.',
      talking_point: '짧고 또렷한 잔이에요.',
    })).toEqual({
      text: '완전히 맞는 칵테일은 없어서 가장 가까운 「마티니」을 골랐어요.\n짧고 또렷한 잔이에요.\n말씀하신 조건과 조금 다른 부분이 있을 수 있습니다.',
      expression: 'sympathy',
    })
  })

  it('renders recommendation question lead-in with already-selected slots', () => {
    expect(renderRecommendationQuestionResponsePlan(false, {
      lead_in: 'lead',
      question_label: 'question',
    })).toEqual({
      text: 'lead\nquestion',
      expression: 'thinking',
    })
  })

  it('renders recommendation question continuation with already-selected slots', () => {
    expect(renderRecommendationQuestionResponsePlan(true, {
      acknowledgement: 'ack',
      continuation: 'continue',
      question_label: 'question',
    })).toEqual({
      text: 'ack\ncontinue\nquestion',
      expression: 'thinking',
    })
  })

  it('renders welcome drink body with already-selected slots', () => {
    const rendered = renderWelcomeDrinkResponsePlan('first', 'cocktail', 'point')

    expect(rendered).toEqual({
      text: '웰컴드링크로는 cocktail로 드릴게요.\n첫 잔이라 짧게 이야기 하나 얹어드릴게요.\npoint',
      expression: 'smirk',
    })
  })

  it('renders welcome feedback without semantic slots', () => {
    expect(renderWelcomeDrinkFeedbackResponsePlan('positive')).toEqual({
      text: '좋았어요. 그럼 이쪽 밸런스는 기억해둘게요.',
      expression: 'smirk',
    })
  })

  it('renders standard farewell entry without semantic slots', () => {
    expect(renderStandardFarewellEntryResponsePlan()).toEqual({
      text: '오늘은 잔을 더 놓지 않고 여기서 마무리할게요.\n잠깐 숨을 고른 뒤 조심히 돌아가실 수 있게 배웅하겠습니다.',
      expression: 'sympathy',
    })
  })

  it('renders welcome XYZ clarification without semantic slots', () => {
    expect(renderWelcomeXyzClarificationResponsePlan()).toEqual({
      text: '그런 뜻은 아니에요.',
      expression: 'smirk',
    })
  })

  it('renders XYZ farewell body with the already-selected cocktail name', () => {
    expect(renderXyzFarewellResponsePlan('XYZ')).toEqual({
      text: '오늘의 마지막 서비스입니다. XYZ로 마무리할게요.\n이 이상 주문은 더 받지 않을게요. 천천히 드시고, 곧 귀가 준비하겠습니다.',
      expression: 'smirk',
    })
  })

  it('renders welcome-farewell XYZ body with the already-selected cocktail name', () => {
    expect(renderWelcomeFarewellXyzResponsePlan('XYZ')).toEqual({
      text: '웰컴드링크를 건너뛴 채 마무리할 뻔했네요.\n첫 잔과 마지막 잔을 겸해서 XYZ를 드릴게요. 오늘 주문은 이 잔으로 닫겠습니다.',
      expression: 'smirk',
    })
  })

  it('renders farewell conversation without semantic slots', () => {
    expect(renderFarewellConversationResponsePlan('xyz-why')).toEqual({
      text: 'XYZ는 오늘의 마지막 잔이라는 표시예요.\n더 밀어붙이지 않고 여기서 마무리하자는 뜻입니다. 잔은 아직 남아 있으니까 급하게 일어날 필요는 없고요.',
      expression: 'thinking',
    })
  })

  it('renders farewell block without semantic slots', () => {
    expect(renderFarewellBlockResponsePlan()).toEqual({
      text: '오늘 주문은 여기까지 받을게요.\n이 구간은 더 추천하기보다 마무리 시간이에요. 방금 드신 것에 대한 이야기나 오늘 마신 것 정리는 들어볼게요.',
      expression: 'smirk',
    })
  })

  it('renders return-home without semantic slots', () => {
    expect(renderReturnHomeResponsePlan()).toEqual({
      text: '오늘도 거의 비웠어요.\n오늘은 여기까지 하시죠. 조심히 들어가세요.',
      expression: 'idle',
    })
  })
})
