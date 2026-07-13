import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getCocktailById } from '../../lib/cocktails/index.js'
import { getQuestionById } from '../../lib/recommendation/question-engine.js'
import { WELCOME_DRINK_FEEDBACK_QUESTION } from '../../lib/recommendation/welcome-drink.js'
import ChatInput from './ChatInput.js'
import CocktailCard from './CocktailCard.js'
import DialogueBox from './DialogueBox.js'
import WelcomeDrinkButton from './WelcomeDrinkButton.js'
import Sidebar from '../sidebar/Sidebar.js'

describe('recommendation UI rendering contracts', () => {
  it('renders only neutral DB details and order/story actions on the recommendation card', () => {
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
    expect(markup).toContain('role="dialog"')
    expect(markup).toContain('aria-modal="true"')
    expect(markup).toContain('aria-labelledby=')
    expect(markup).toContain('aria-describedby=')
    expect(markup).toContain(cocktail!.description)
    expect(markup).toContain(cocktail!.vibe === 'Classic cocktail' ? '클래식 칵테일' : cocktail!.vibe)
    expect(markup).toContain('설명')
    expect(markup).toContain('베이스')
    expect(markup).toContain(cocktail!.base)
    expect(markup).toContain('재료')
    expect(markup).toContain(cocktail!.ingredients[0])
    expect(markup).toContain('잔')
    expect(markup).toContain('분류')
    expect(markup).toContain('맛 프로필')
    expect(markup).not.toContain(cocktail!.recipeText)
    expect(markup).not.toContain('이야깃거리')
    expect(markup).not.toContain('추천 이유')
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
    expect(markup).toContain('role="log"')
    expect(markup).toContain('aria-live="polite"')
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
    expect(markup).toContain('type="submit"')
    expect(markup).toContain('aria-label="메시지 전송"')
    expect(markup).toContain('전송')
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
    expect(markup).toContain('카루아')
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

  it('uses the native disabled contract for the welcome drink action', () => {
    const markup = renderToStaticMarkup(
      <WelcomeDrinkButton disabled hidden={false} onClick={() => undefined} />,
    )

    expect(markup).toContain('disabled=""')
    expect(markup).not.toContain('aria-disabled=')
  })

  it('exposes labelled tabs and an explicit mobile close action for the sidebar', () => {
    const markup = renderToStaticMarkup(
      <Sidebar
        unlockedIds={new Set()}
        mobileOpen={false}
        onMobileClose={() => undefined}
        onResetNight={() => undefined}
        onViewCocktail={() => undefined}
        onOrderCocktail={() => undefined}
        audio={{} as never}
      />,
    )

    expect(markup).toContain('id="bar-terminal-menu"')
    expect(markup).toContain('aria-label="바 메뉴 닫기"')
    expect(markup).toContain('role="tablist"')
    expect(markup).toContain('aria-controls="sidebar-panel-codex"')
    expect(markup).toContain('aria-labelledby="sidebar-tab-codex"')
  })
})
