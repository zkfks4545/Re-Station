interface WelcomeDrinkButtonProps {
  disabled: boolean
  hidden: boolean
  onClick: () => void
}

export default function WelcomeDrinkButton({
  disabled,
  hidden,
  onClick,
}: WelcomeDrinkButtonProps) {
  if (hidden) return null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      className="welcome-drink-btn text-xs transition-all duration-200 cursor-pointer select-none flex items-center gap-1"
      aria-label="웰컴드링크 받기"
    >
      <span className="opacity-60">[</span>
      웰컴드링크
      <span className="opacity-60">]</span>
    </button>
  )
}
