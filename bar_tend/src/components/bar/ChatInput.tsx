import { useState, type FormEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  placeholder?: string
}

export default function ChatInput({
  onSend,
  disabled,
  placeholder: placeholderOverride,
}: ChatInputProps) {
  const [val, setVal] = useState('')
  const placeholder = disabled ? (placeholderOverride ?? '대답을 기다리는 중...') : (placeholderOverride ?? '바텐더에게 말을 걸어보세요...')

  const submit = (text: string) => {
    const trimmed = text.trim()
    if (!disabled && trimmed) onSend(trimmed)
  }

  return (
    <div className="chat-input-shell bg-black/40 border-t border-white/5">
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
          className="w-full bg-white/5 border border-white/10 rounded-full px-6 text-white placeholder:text-white/20 focus:outline-none transition-all"
             style={{ padding: 'clamp(8px, 1.5vh, 14px) 24px' }}
          onFocus={(event) => event.currentTarget.style.borderColor = 'rgba(180, 136, 208, 0.5)'}
          onBlur={(event) => event.currentTarget.style.borderColor = ''}
        />
      </form>
    </div>
  )
}
