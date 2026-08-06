'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type StageProps = {
  children: React.ReactNode
  className?: string
  background?: string
}

export function Stage({ children, className, background }: StageProps) {
  const [revealed, setRevealed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isFinePointer, setIsFinePointer] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    setIsFinePointer(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsFinePointer(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div
      className={cn(
        'relative max-w-full overflow-hidden rounded-[20px] p-6 md:p-14',
        className,
      )}
      style={
        background
          ? {
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitTouchCallout: 'none',
            }
          : { background: 'var(--secondary)' }
      }
      {...(background && isFinePointer
        ? {
            onPointerDown: () => setRevealed(true),
            onPointerUp: () => setRevealed(false),
            onPointerLeave: () => setRevealed(false),
            onPointerCancel: () => setRevealed(false),
          }
        : {})}
      onContextMenu={background ? (e) => e.preventDefault() : undefined}
    >
      {background ? (
        <>
          <Image
            src={`/analytir/${background}`}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority={false}
            className="z-0"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 25%',
              ...(reducedMotion
                ? {}
                : {
                    transform: revealed ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 520ms cubic-bezier(.2,.7,.3,1)',
                  }),
            }}
          />
          <div
            className="relative z-[2]"
            style={{
              opacity: revealed ? 0 : 1,
              pointerEvents: revealed ? 'none' : 'auto',
              ...(reducedMotion
                ? {}
                : {
                    transform: revealed ? 'scale(0.97)' : 'scale(1)',
                    transition:
                      'opacity 320ms cubic-bezier(.2,.7,.3,1), transform 320ms cubic-bezier(.2,.7,.3,1)',
                  }),
            }}
          >
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  )
}
