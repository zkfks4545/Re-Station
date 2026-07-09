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
    expect(markup.match(/type="button"/g)).toHaveLength(3)
  })

  it('renders recommendation choices inside dialogue box', () => {
    const activeQuestion = getQuestionById('flavor-profile')
    expect(activeQuestion).not.toBeNull()

    const markup = renderToStaticMarkup(
      <DialogueBox
        messages={[]}
        isTyping={false}
        activeQuestion={activeQuestion}
        onSend={() => undefined}
        onCancelRecommendation={() => undefined}
        disabled={false}
      />,
    )

    expect(markup).toContain('role="group"')
    expect(markup).toContain(activeQuestion!.prompt)
    expect(markup).toContain(activeQuestion!.choices[0].label)
    expect(markup).toContain('잘 모르겠어요')
    expect(markup).toContain('추천 질문 취소')
  })

  it('renders welcome drink feedback as a one-step choice prompt', () => {
    const markup = renderToStaticMarkup(
      <DialogueBox
        messages={[]}
        isTyping={false}
        activeQuestion={WELCOME_DRINK_FEEDBACK_QUESTION}
        onSend={() => undefined}
        onCancelRecommendation={() => undefined}
        disabled={false}
      />,
    )

    expect(markup).toContain('웰컴드링크는 괜찮으셨나요?')
    expect(markup).toContain('좋았어요')
    expect(markup).toContain('조금 더 가볍게')
  })

  it('does not render recommendation controls outside an active question', () => {
    const markup = renderToStaticMarkup(
      <DialogueBox
        messages={[]}
        isTyping={false}
        activeQuestion={null}
        onSend={() => undefined}
        onCancelRecommendation={() => undefined}
        disabled={false}
      />,
    )

    expect(markup).not.toContain('추천 질문 취소')
    expect(markup).not.toContain('잘 모르겠어요')
  })

  it('keeps recommendation choice controls disabled while processing', () => {
    const activeQuestion = getQuestionById('flavor-profile')
    expect(activeQuestion).not.toBeNull()

    const markup = renderToStaticMarkup(
      <DialogueBox
        messages={[]}
        isTyping={false}
        activeQuestion={activeQuestion}
        onSend={() => undefined}
        onCancelRecommendation={() => undefined}
        disabled
      />,
    )

    expect(markup).toContain('disabled=""')
  })

  it('renders ChatInput without choice controls', () => {
    const markup = renderToStaticMarkup(
      <ChatInput
        disabled={false}
        onSend={() => undefined}
      />,
    )

    expect(markup).toContain('바텐더에게 말을 걸어보세요...')
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
