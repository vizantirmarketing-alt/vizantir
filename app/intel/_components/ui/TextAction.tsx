'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TextActionTone = 'default' | 'destructive'

type TextActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  tone?: TextActionTone
  /** While true the action is disabled and shows pendingLabel. */
  pending?: boolean
  pendingLabel?: ReactNode
  children: ReactNode
}

/*
 * The Intel text action: a small inline button that reads as an action, not
 * as metadata.
 *   resting      full-strength text in the Intel palette: cobalt-text
 *                (#0068E3, cleared for 4.5:1 on Intel's light backgrounds) or
 *                warning-severe for destructive actions, which Intel already
 *                uses for delete
 *   hover        underline plus a soft tint of the same colour
 *   focus        a visible focus-visible ring in the Intel cobalt focus colour
 *   pending and  muted text, no underline or tint, cursor not-allowed; the
 *   disabled     button is disabled and aria-disabled, and pending also sets
 *                aria-busy
 */
const TONE_CLASS: Record<TextActionTone, string> = {
  default: 'text-cobalt-text hover:bg-cobalt-soft',
  destructive: 'text-warning-severe hover:bg-warning-severe-soft',
}

export function TextAction({
  tone = 'default',
  pending = false,
  pendingLabel,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: TextActionProps) {
  const inactive = Boolean(disabled) || pending
  return (
    <button
      type={type}
      disabled={inactive}
      aria-disabled={inactive || undefined}
      aria-busy={pending || undefined}
      className={cn(
        '-mx-1 inline-flex items-center rounded px-1 text-sm font-medium underline-offset-2 transition-colors',
        'hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-focus',
        TONE_CLASS[tone],
        'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-meta disabled:no-underline disabled:hover:bg-transparent',
        className,
      )}
      {...props}
    >
      {pending && pendingLabel !== undefined ? pendingLabel : children}
    </button>
  )
}
