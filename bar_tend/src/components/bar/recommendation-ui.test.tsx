import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../../lib/cocktails/database.js'
import { getQuestionById } from '../../lib/recommendation/question-engine.js'
import { WELCOME_DRINK_FEEDBACK_QUESTION } from '../../lib/recommendation/welcome-drink.js'
import ChatInput from './ChatInput.js'
import CocktailCard from './CocktailCard.js'
import DialogueBox from './DialogueBox.js'
import WelcomeDrinkButton from './WelcomeDrinkButton.js'

describe('recommendation UI rendering contracts', () => {
  it('renders the recommendation card with details and order/story actions', () => {
    const cocktail = getCocktailById('cocktail_classic_001')
    expect(cocktail).not.toBeNull()

    const markup = renderToStaticMarkup(
      <CocktailCard
        cocktail={cocktail!}
        onClose={() => undefined}
        onOrder={() => undefined}
        onStory={() => undefined}
      />,
    )

    expect(markup).toContain(cocktail!.name)
    expect(markup).toContain(cocktail!.description)
    expect(markup).toContain('설명')
    expect(markup).toContain('레시피')
    expect(markup).toContain('주문하기')
    expect(markup).toContain('이야기하기')
  })

  it('renders recommendation choices, unknown answer and cancel affordance', () => {
    const activeQuestion = getQuestionById('flavor-profile')
    expect(activeQuestion).not.toBeNull()

    const markup = renderToStaticMarkup(
      <ChatInput
        activeQuestion={activeQuestion}
        disabled={false}
        onCancelRecommendation={() => undefined}
        onSend={() => undefined}
      />,
    )

    expect(markup).toContain('role="group"')
    expect(markup).toContain(activeQuestion!.prompt)
    expect(markup).toContain(activeQuestion!.choices[0].label)
    expect(markup).toContain('잘 모르겠어요')
    expect(markup).toContain('추천 질문 취소')
    expect(markup).toContain('바텐더에게 메시지 보내기')
  })

  it('renders welcome drink feedback as a one-step choice prompt', () => {
    const markup = renderToStaticMarkup(
      <ChatInput
        activeQuestion={WELCOME_DRINK_FEEDBACK_QUESTION}
        disabled={false}
        onCancelRecommendation={() => undefined}
        onSend={() => undefined}
      />,
    )

    expect(markup).toContain('웰컴드링크는 괜찮으셨나요?')
    expect(markup).toContain('좋았어요')
    expect(markup).toContain('조금 더 가볍게')
  })

  it('does not render recommendation-only controls outside an active question', () => {
    const markup = renderToStaticMarkup(
      <ChatInput
        activeQuestion={null}
        disabled={false}
        onCancelRecommendation={() => undefined}
        onSend={() => undefined}
      />,
    )

    expect(markup).not.toContain('추천 질문 취소')
    expect(markup).not.toContain('잘 모르겠어요')
    expect(markup).toContain('바텐더에게 말을 걸어보세요...')
  })

  it('keeps recommendation choice controls disabled while processing', () => {
    const activeQuestion = getQuestionById('flavor-profile')
    expect(activeQuestion).not.toBeNull()

    const markup = renderToStaticMarkup(
      <ChatInput
        activeQuestion={activeQuestion}
        disabled
        onCancelRecommendation={() => undefined}
        onSend={() => undefined}
      />,
    )

    expect(markup).toContain('disabled=""')
    expect(markup).toContain('대답을 기다리는 중...')
  })

  it('hides the order/story actions when the flow does not provide them', () => {
    const cocktail = getCocktailById('cocktail_classic_001')
    expect(cocktail).not.toBeNull()

    const markup = renderToStaticMarkup(
      <CocktailCard
        cocktail={cocktail!}
        onClose={() => undefined}
      />,
    )

    expect(markup).toContain(cocktail!.name)
    expect(markup).not.toContain('주문하기')
    expect(markup).not.toContain('이야기하기')
  })

  it('renders distinct speaker labels for Siesta banter messages', () => {
    const markup = renderToStaticMarkup(
      <DialogueBox
        isTyping={false}
        messages={[
          { role: 'bartender', speaker: 'siesta', text: '잘 골랐네.' },
          { role: 'bartender', speaker: 'karua', text: '제가 골랐는데요?' },
          { role: 'user', text: '좋아요' },
        ]}
      />,
    )

    expect(markup).toContain('시에스타')
    expect(markup).toContain('칼루아')
    expect(markup).toContain('잘 골랐네.')
    expect(markup).not.toContain('좋아요</div>')
  })

  it('renders the one-time welcome drink action when available', () => {
    const markup = renderToStaticMarkup(
      <WelcomeDrinkButton
        disabled={false}
        hidden={false}
        onClick={() => undefined}
      />,
    )

    expect(markup).toContain('웰컴드링크')
    expect(markup).toContain('aria-label="웰컴드링크 받기"')
  })

  it('hides the welcome drink action after it is no longer available', () => {
    const markup = renderToStaticMarkup(
      <WelcomeDrinkButton
        disabled={false}
        hidden
        onClick={() => undefined}
      />,
    )

    expect(markup).toBe('')
  })
})
