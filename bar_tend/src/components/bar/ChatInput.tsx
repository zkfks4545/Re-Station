import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { RecommendationQuestion } from '../../types/recommendation.js'

interface ChatInputProps {
  onSend: (text: string) => void
  onCancelRecommendation: () => void
  activeQuestion: RecommendationQuestion | null
  disabled: boolean
  placeholder?: string
}

export default function ChatInput({
  onSend,
  onCancelRecommendation,
  activeQuestion,
  disabled,
  placeholder: placeholderOverride,
}: ChatInputProps) {
  const [val, setVal] = useState('')
  const firstChoiceRef = useRef<HTMLButtonElement>(null)
  const placeholder = disabled ? (placeholderOverride ?? '대답을 기다리는 중...') : (placeholderOverride ?? '바텐더에게 말을 걸어보세요...')

  useEffect(() => {
    if (activeQuestion && !disabled) firstChoiceRef.current?.focus()
  }, [activeQuestion, disabled])

  const submit = (text: string) => {
    const trimmed = text.trim()
    if (!disabled && trimmed) onSend(trimmed)
  }

  return (
    <div className="chat-input-shell bg-black/40 border-t border-white/5">
      {activeQuestion && (
        <div
          className="recommendation-choices"
          role="group"
          aria-label={activeQuestion.prompt}
        >
          <div className="recommendation-choices__list">
            {activeQuestion.choices.map((choice, index) => (
              <button
                key={choice.label}
                ref={index === 0 ? firstChoiceRef : undefined}
                type="button"
                className="recommendation-choice"
                disabled={disabled}
                onClick={() => submit(choice.label)}
              >
                {choice.label}
              </button>
            ))}
            <button
              type="button"
              className="recommendation-choice recommendation-choice--quiet"
              disabled={disabled}
              onClick={() => submit('잘 모르겠어요')}
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

      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          if (val.trim()) {
            submit(val)
            setVal('')
          }
        }}
      >
        <input
          type="text"
          value={val}
          onChange={(event) => setVal(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="바텐더에게 메시지 보내기"
          className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all"
          onFocus={(event) => event.currentTarget.style.borderColor = 'rgba(180, 136, 208, 0.5)'}
          onBlur={(event) => event.currentTarget.style.borderColor = ''}
        />
      </form>
    </div>
  )
}
