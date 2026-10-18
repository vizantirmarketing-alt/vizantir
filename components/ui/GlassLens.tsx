'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type GlassLensProps = {
  children: ReactNode
  /** "row" slides on left/width; "column" slides on top/height and holds one width for the whole group. */
  orientation?: 'row' | 'column'
  /** Adds the pill padding to each link, offset by an equal negative margin so layout does not move. */
  padded?: boolean
  className?: string
}

const HOVER_QUERY = '(hover: hover) and (pointer: fine)'

export default function GlassLens({
  children,
  orientation = 'row',
  padded = true,
  className,
}: GlassLensProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLSpanElement>(null)
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(HOVER_QUERY)
    const sync = () => setEnabled(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const place = useCallback(
    (link: HTMLAnchorElement, snap: boolean) => {
      const wrapper = wrapperRef.current
      const lens = lensRef.current
      if (!wrapper || !lens) return

      const wrapperRect = wrapper.getBoundingClientRect()
      const linkRect = link.getBoundingClientRect()
      let left = linkRect.left - wrapperRect.left
      let width = linkRect.width

      if (orientation === 'column') {
        // One stable width for the group so the lens only travels vertically.
        const rects = Array.from(wrapper.querySelectorAll('a')).map((a) => a.getBoundingClientRect())
        const minLeft = Math.min(...rects.map((r) => r.left))
        const maxRight = Math.max(...rects.map((r) => r.right))
        left = minLeft - wrapperRect.left
        width = maxRight - minLeft
      }

      if (snap) lens.dataset.snap = 'true'
      lens.style.left = `${left}px`
      lens.style.top = `${linkRect.top - wrapperRect.top}px`
      lens.style.width = `${width}px`
      lens.style.height = `${linkRect.height}px`
      if (snap) {
        void lens.offsetWidth
        delete lens.dataset.snap
      }
      lens.dataset.active = 'true'
    },
    [orientation],
  )

  const activate = useCallback(
    (target: EventTarget | null) => {
      const lens = lensRef.current
      if (!lens || !(target instanceof Element)) return
      const link = target.closest('a')
      if (!link || !wrapperRef.current?.contains(link)) return
      const wasActive = lens.dataset.active === 'true'
      activeLinkRef.current = link
      place(link, !wasActive)
    },
    [place],
  )

  const deactivate = useCallback(() => {
    const lens = lensRef.current
    if (!lens) return
    activeLinkRef.current = null
    delete lens.dataset.active
  }, [])

  useEffect(() => {
    if (!enabled) return
    const onResize = () => {
      if (activeLinkRef.current) place(activeLinkRef.current, true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [enabled, place])

  return (
    <div
      ref={wrapperRef}
      className={cn('glass-lens-group relative', !padded && 'glass-lens-group--flush', className)}
      onMouseOver={enabled ? (event) => activate(event.target) : undefined}
      onMouseLeave={enabled ? deactivate : undefined}
      onFocus={
        enabled
          ? (event) => {
              if (event.target instanceof Element && event.target.matches(':focus-visible')) {
                activate(event.target)
              }
            }
          : undefined
      }
      onBlur={
        enabled
          ? (event) => {
              if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) deactivate()
            }
          : undefined
      }
    >
      {children}
      {enabled ? <span ref={lensRef} className="glass-lens" aria-hidden /> : null}
    </div>
  )
}
