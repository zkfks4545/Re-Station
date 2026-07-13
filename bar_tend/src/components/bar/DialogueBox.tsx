import { useRef, useEffect, useCallback, useState } from 'react'
import type { Message } from '../../types.js'
import type { RecommendationQuestion } from '../../types/recommendation.js'
import DialogueRenderer from './DialogueRenderer.jsx'

function getSpeakerLabel(message: Message): string | null {
  if (message.role !== 'bartender' || !message.speaker) return null
  return message.speaker === 'siesta' ? '시에스타' : '카루아'
}

export default function DialogueBox({
  messages,
  isTyping,
  onTypingComplete,
  activeQuestion,
  onSend,
  onCancelRecommendation,
  disabled,
}: {
  messages: Message[]
  isTyping: boolean
  onTypingComplete?: () => void
  activeQuestion?: RecommendationQuestion | null
  onSend?: (text: string) => void
  onCancelRecommendation?: () => void
  disabled?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setUserScrolledUp(!isNearBottom)
  }, [])

  useEffect(() => {
    if (scrollRef.current && !userScrolledUp) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping, userScrolledUp])

  const lastBartenderIndex = [...messages].reverse().findIndex((m) => m.role === 'bartender')
  const typingMsgIndex = lastBartenderIndex >= 0 ? messages.length - 1 - lastBartenderIndex : -1

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      className="flex-1 overflow-y-auto px-6 pt-6 pb-3 space-y-4"
    >
      {messages.map((msg, i) => {
        const isTypingMessage = isTyping && i === typingMsgIndex && msg.role === 'bartender'

        return (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.role === 'user'
                ? 'text-white/90'
                : 'bg-white/5 text-white/90 border border-white/10'
            }`} style={msg.role === 'user' ? { background: 'rgba(120, 80, 180, 0.08)', borderColor: 'rgba(180, 136, 208, 0.15)' } : {}}>
              {getSpeakerLabel(msg) && (
                <div className="mb-1 text-[11px] font-semibold text-amber-200/80">{getSpeakerLabel(msg)}</div>
              )}
              {isTypingMessage ? (
                <DialogueRenderer
                  fullText={msg.text}
                  active
                  onComplete={onTypingComplete}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
              )}
            </div>
          </div>
        )
      })}
      {activeQuestion && (
        <div
          className="recommendation-choices"
          role="group"
          aria-label={activeQuestion.prompt}
        >
          <div className="recommendation-choices__list">
            {activeQuestion.choices.map((choice) => (
              <button
                key={choice.label}
                type="button"
                className="recommendation-choice"
                disabled={disabled}
                onClick={() => onSend?.(choice.label)}
              >
                {choice.label}
              </button>
            ))}
            <button
              type="button"
              className="recommendation-choice recommendation-choice--quiet"
              disabled={disabled}
              onClick={() => onSend?.('잘 모르겠어요')}
            >
              잘 모르겠어요
            </button>
          </div>
          <button
            type="button"
            className="recommendation-cancel"
            disabled={disabled}
            onClick={onCancelRecommendation}
          >
            추천 질문 취소
          </button>
        </div>
      )}
    </div>
  )
}
