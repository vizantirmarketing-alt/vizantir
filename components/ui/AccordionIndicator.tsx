import type { CSSProperties } from 'react'

type Props = {
  isOpen: boolean
  className?: string
  style?: CSSProperties
}

export function AccordionIndicator({ isOpen, className = '', style }: Props) {
  return (
    <div
      className={`relative w-4 h-4 flex-shrink-0 ${className}`}
      style={style}
    >
      <span
        aria-hidden
        className="absolute left-0 right-0 top-1/2 h-px"
        style={{
          backgroundColor: 'currentColor',
          transform: 'translateY(-50%)',
        }}
      />
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-1/2 w-px transition-transform duration-300 ease-out"
        style={{
          backgroundColor: 'currentColor',
          transform: `translateX(-50%) rotate(${isOpen ? 90 : 0}deg)`,
        }}
      />
    </div>
  )
}
