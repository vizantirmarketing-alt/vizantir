'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

import { AccordionIndicator } from '@/components/ui/AccordionIndicator'
import { cn } from '@/lib/utils'

interface AccordionItemProps
  extends Omit<HTMLMotionProps<'div'>, 'children' | 'className' | 'style' | 'onToggle'> {
  triggerId: string
  panelId: string
  question: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  /** Wrap the trigger in a heading. Omit when the surrounding page owns heading structure. */
  headingAs?: 'h2' | 'h3'
  /** Surface (border, background). Spacing is owned by this component. */
  className?: string
  style?: React.CSSProperties
  questionClassName?: string
  questionStyle?: React.CSSProperties
  children: React.ReactNode
}

/**
 * The one accordion row. Trigger padding px-5 py-4, px-6 py-5 at md+; the answer
 * panel lines up with it. Stack rows with space-y-[var(--stack)].
 */
function AccordionItem({
  triggerId,
  panelId,
  question,
  isOpen,
  onToggle,
  headingAs,
  className,
  style,
  questionClassName,
  questionStyle,
  children,
  ...motionProps
}: AccordionItemProps) {
  const Heading = headingAs
  const trigger = (
    <button
      id={triggerId}
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-foreground transition-colors hover:bg-[#F9FAFB] md:px-6 md:py-5"
    >
      <span
        className={cn('pr-4 text-lg font-semibold', questionClassName)}
        style={questionStyle}
      >
        {question}
      </span>
      <AccordionIndicator
        isOpen={isOpen}
        className="h-5 w-5 flex-shrink-0"
        style={{ color: 'var(--cobalt-text)' }}
      />
    </button>
  )

  return (
    <motion.div
      className={cn('overflow-hidden rounded-xl border transition-all duration-300', className)}
      style={style}
      {...motionProps}
    >
      {Heading ? <Heading className="m-0">{trigger}</Heading> : trigger}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4 text-[16px] leading-[1.5] md:px-6 md:pb-5 md:text-[length:inherit] md:leading-[inherit]">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export { AccordionItem }
