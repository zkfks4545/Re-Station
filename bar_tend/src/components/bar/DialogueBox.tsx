import { useRef, useEffect } from 'react'
import type { Message } from '../../types.js'
import DialogueRenderer from './DialogueRenderer.jsx'

function getSpeakerLabel(message: Message): string | null {
  if (message.role !== 'bartender' || !message.speaker) return null
  return message.speaker === 'siesta' ? '시에스타' : '칼루아'
}

export default function DialogueBox({
  messages,
  isTyping,
  onTypingComplete,
}: {
  messages: Message[]
  isTyping: boolean
  onTypingComplete?: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  const lastBartenderIndex = [...messages].reverse().findIndex((m) => m.role === 'bartender')
  const typingMsgIndex = lastBartenderIndex >= 0 ? messages.length - 1 - lastBartenderIndex : -1

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
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
    </div>
  )
}
