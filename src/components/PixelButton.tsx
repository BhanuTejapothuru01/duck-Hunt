interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
  disabled?: boolean
}

const variants = {
  primary: 'bg-arcade-green hover:bg-green-600 text-white',
  secondary: 'bg-arcade-sky hover:bg-blue-400 text-arcade-dark',
  danger: 'bg-arcade-red hover:bg-red-600 text-white',
}

export function PixelButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: PixelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 text-xs sm:text-sm font-[family-name:var(--font-pixel)] border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
