'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type InfoTooltipProps = {
  /** Accessible name for the trigger, e.g. "More information about quarterly website health review" */
  label: string
  children: string
}

const VIEWPORT_PAD = 8
const PANEL_VIEWPORT_INSET = 16
const GAP = 6

export function InfoTooltip({ label, children }: InfoTooltipProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, maxWidth: 240 })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const openedByHover = useRef(false)

  const updatePosition = useCallback(() => {
    const wrap = wrapRef.current
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!wrap || !trigger || !tooltip) return

    const card = trigger.closest('[data-tooltip-boundary]')
    const cardRect = card?.getBoundingClientRect()
    const wrapRect = wrap.getBoundingClientRect()
    const triggerRect = trigger.getBoundingClientRect()

    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight

    const clipLeft = Math.max(VIEWPORT_PAD, cardRect?.left ?? VIEWPORT_PAD)
    const clipRight = Math.min(
      viewportWidth - VIEWPORT_PAD,
      cardRect?.right ?? viewportWidth - VIEWPORT_PAD,
    )
    const clipTop = Math.max(VIEWPORT_PAD, cardRect?.top ?? VIEWPORT_PAD)
    const clipBottom = Math.min(
      viewportHeight - VIEWPORT_PAD,
      cardRect?.bottom ?? viewportHeight - VIEWPORT_PAD,
    )

    const available = clipRight - clipLeft
    const viewportCap = viewportWidth - PANEL_VIEWPORT_INSET * 2
    const maxWidth = Math.max(160, Math.min(280, available, viewportCap))
    tooltip.style.maxWidth = `min(${maxWidth}px, calc(100vw - 2rem))`

    const tipRect = tooltip.getBoundingClientRect()
    const height = tipRect.height
    const width = Math.min(tipRect.width, maxWidth)

    let top = triggerRect.bottom + GAP
    if (top + height > clipBottom && triggerRect.top - GAP - height >= clipTop) {
      top = triggerRect.top - GAP - height
    } else {
      top = Math.min(Math.max(top, clipTop), Math.max(clipTop, clipBottom - height))
    }

    let left = triggerRect.left
    if (left + width > clipRight) left = clipRight - width
    if (left < clipLeft) left = clipLeft

    const relTop = top - wrapRect.top
    const relLeft = left - wrapRect.left

    setCoords((prev) => {
      if (prev.top === relTop && prev.left === relLeft && prev.maxWidth === maxWidth) return prev
      return { top: relTop, left: relLeft, maxWidth }
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition, children])

  useEffect(() => {
    if (!open) return

    const closeIfOutside = (event: Event) => {
      const target = event.target as Node | null
      if (target && wrapRef.current?.contains(target)) return
      openedByHover.current = false
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      openedByHover.current = false
      setOpen(false)
      triggerRef.current?.focus()
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', closeIfOutside)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', closeIfOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, updatePosition])

  return (
    <span ref={wrapRef} className="relative ml-1.5 inline-flex align-text-bottom">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'mouse') return
          openedByHover.current = true
          setOpen(true)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'mouse') return
          openedByHover.current = false
          setOpen(false)
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (wrapRef.current?.contains(event.relatedTarget as Node)) return
          openedByHover.current = false
          setOpen(false)
        }}
        onClick={() => {
          if (openedByHover.current) return
          setOpen((prev) => !prev)
        }}
        className="-my-0.5 inline-flex size-5 shrink-0 scroll-mt-24 items-center justify-center rounded-sm text-body transition-colors hover:text-cobalt-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-1"
      >
        <Info className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        className={cn(
          'absolute z-50 w-max max-w-[calc(100vw-2rem)] rounded-lg border border-cobalt-muted-border bg-background px-3 py-2 text-left text-[13px] leading-snug text-muted-foreground shadow-[0_4px_16px_rgba(0,112,243,0.08)]',
          open ? 'visible opacity-100' : 'pointer-events-none hidden',
        )}
        style={{
          top: coords.top,
          left: coords.left,
          maxWidth: `min(${coords.maxWidth}px, calc(100vw - 2rem))`,
        }}
      >
        {children}
      </span>
    </span>
  )
}
