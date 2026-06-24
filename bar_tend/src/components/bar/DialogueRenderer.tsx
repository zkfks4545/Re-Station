import { useEffect, useMemo, useRef, useState } from 'react'

const BASE_DELAY_MS = 26
const SPACE_DELAY_MS = 34
const PUNCTUATION_DELAY_MS = 150
const ELLIPSIS_DELAY_MS = 220

function getDelayForToken(token: string): number {
  if (token === '\n') return PUNCTUATION_DELAY_MS
  if (token.trim().length === 0) return SPACE_DELAY_MS
  if (token === '…') return ELLIPSIS_DELAY_MS
  if (/[,.!?，。！？]/.test(token)) return PUNCTUATION_DELAY_MS
  return BASE_DELAY_MS
}

export default function DialogueRenderer({
  fullText,
  active,
  onTypingChange,
  onComplete,
}: {
  fullText: string
  active: boolean
  onTypingChange?: (isTyping: boolean) => void
  onComplete?: () => void
}) {
  const tokens = useMemo(() => Array.from(fullText), [fullText])
  const [displayedText, setDisplayedText] = useState(active ? '' : fullText)
  const [index, setIndex] = useState(active ? 0 : tokens.length)
  const didReportStartRef = useRef(false)
  const didReportCompleteRef = useRef(false)
  const isTyping = active && index < tokens.length

  useEffect(() => {
    if (!active || !isTyping || didReportStartRef.current) return
    didReportStartRef.current = true
    onTypingChange?.(true)
  }, [active, isTyping, onTypingChange])

  useEffect(() => {
    if (!active || index >= tokens.length) return

    const currentToken = tokens[index]
    const timeoutId = window.setTimeout(() => {
      setDisplayedText((current) => current + currentToken)
      setIndex((current) => current + 1)
    }, getDelayForToken(currentToken))

    return () => window.clearTimeout(timeoutId)
  }, [active, index, tokens])

  useEffect(() => {
    if (!active || index !== tokens.length || didReportCompleteRef.current) return
    didReportCompleteRef.current = true
    onTypingChange?.(false)
    onComplete?.()
  }, [active, fullText, index, onComplete, onTypingChange, tokens.length])

  const skipToEnd = () => {
    if (!isTyping) return
    setDisplayedText(fullText)
    setIndex(tokens.length)
  }

  return (
    <pre className="whitespace-pre-wrap font-sans" onClick={skipToEnd}>
      {displayedText}
    </pre>
  )
}
