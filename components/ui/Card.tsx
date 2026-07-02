import * as React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardSurfaceVariants = cva(
  'relative flex h-full flex-col rounded-xl p-7 transition-colors duration-300 md:p-8',
  {
    variants: {
      variant: {
        glass: 'card-surface-glass',
        'muted-30': 'border',
        'muted-20': 'border',
      },
      featured: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'glass', featured: true, class: 'card-surface-glass-featured' },
      {
        variant: 'muted-30',
        featured: false,
        class: 'border-border bg-muted/30 hover:border-cobalt-muted-border hover:bg-muted/50',
      },
      {
        variant: 'muted-30',
        featured: true,
        class:
          'border-cobalt-muted-border bg-cobalt-muted-subtle hover:border-cobalt-muted hover:bg-[rgba(0,112,243,0.1)]',
      },
      {
        variant: 'muted-20',
        featured: false,
        class: 'border-border bg-muted/20 hover:border-cobalt-muted-border hover:bg-muted/40',
      },
      {
        variant: 'muted-20',
        featured: true,
        class:
          'border-cobalt-muted-border bg-cobalt-muted-subtle hover:border-cobalt-muted hover:bg-[rgba(0,112,243,0.1)]',
      },
    ],
    defaultVariants: {
      variant: 'muted-30',
      featured: false,
    },
  },
)

type CardElement = 'div' | 'article'

interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Surface treatment — not page/business context */
  variant?: 'glass' | 'muted-30' | 'muted-20'
  /** Applies featured surface (cobalt tint). Default badge: "Popular" */
  featured?: boolean
  /**
   * Badge override. Omit + featured → "Popular".
   * `false` → no badge. string → custom label.
   */
  badge?: string | false
  /** Semantic root element. Blog/Chatbot use "article". Default: "div" */
  as?: CardElement
  className?: string
  children: React.ReactNode
}

function Card({
  variant = 'muted-30',
  featured = false,
  badge,
  as: Component = 'div',
  className,
  children,
  ...props
}: CardProps) {
  const showBadge = featured && badge !== false
  const badgeLabel = typeof badge === 'string' ? badge : 'Popular'

  return (
    <Component
      className={cn(cardSurfaceVariants({ variant, featured }), className)}
      {...props}
    >
      {showBadge ? <CardBadge>{badgeLabel}</CardBadge> : null}
      {children}
    </Component>
  )
}

interface CardBadgeProps {
  className?: string
  children: React.ReactNode
}

function CardBadge({ className, children }: CardBadgeProps) {
  return (
    <span
      className={cn(
        'absolute -top-2 right-4 rounded-full bg-cobalt-gradient px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white',
        className,
      )}
    >
      {children}
    </span>
  )
}

interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn('mb-2 flex items-baseline justify-between gap-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  className?: string
  children: React.ReactNode
}

function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-xl font-bold tracking-tight text-foreground md:text-[22px]',
        className,
      )}
    >
      {children}
    </h3>
  )
}

interface CardPriceProps {
  className?: string
  children: React.ReactNode
}

function CardPrice({ className, children }: CardPriceProps) {
  return (
    <p
      className={cn(
        'whitespace-nowrap text-xl font-bold text-cobalt-accent md:text-[22px]',
        className,
      )}
    >
      {children}
    </p>
  )
}

interface CardDescriptionProps {
  /** sm = body copy; xs = meta line (cadence, conversation count) */
  size?: 'sm' | 'xs'
  /** Bottom border divider — only applies when size="sm" */
  bordered?: boolean
  className?: string
  children: React.ReactNode
}

function CardDescription({
  size = 'sm',
  bordered = false,
  className,
  children,
}: CardDescriptionProps) {
  if (process.env.NODE_ENV === 'development' && bordered && size === 'xs') {
    console.warn('[CardDescription] `bordered` is ignored when size="xs".')
  }

  return (
    <p
      className={cn(
        size === 'sm' && 'text-sm leading-relaxed text-muted-foreground',
        size === 'xs' && 'text-[13px] text-muted-foreground',
        bordered && size === 'sm' && 'mb-6 border-b border-border pb-6',
        className,
      )}
    >
      {children}
    </p>
  )
}

interface CardTaglineProps {
  className?: string
  children: React.ReactNode
}

function CardTagline({ className, children }: CardTaglineProps) {
  return (
    <p className={cn('mb-4 text-sm font-semibold text-cobalt-accent', className)}>
      {children}
    </p>
  )
}

interface CardPriceBlockProps {
  compareAt: React.ReactNode
  price: React.ReactNode
  suffix?: React.ReactNode
  className?: string
}

function CardPriceBlock({ compareAt, price, suffix, className }: CardPriceBlockProps) {
  return (
    <div className={cn('mb-5 border-y border-border py-5', className)}>
      <div className="mb-1 text-sm text-muted-foreground line-through">{compareAt}</div>
      <div className="text-[28px] font-bold leading-none text-cobalt-accent">
        {price}
        {suffix ? (
          <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
    </div>
  )
}

interface CardCheckListProps {
  className?: string
  children: React.ReactNode
}

function CardCheckList({ className, children }: CardCheckListProps) {
  return <ul className={cn('mb-7 flex-1 space-y-2.5', className)}>{children}</ul>
}

interface CardCheckItemProps {
  children: React.ReactNode
}

function CardCheckItem({ children }: CardCheckItemProps) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground/80">
      <CheckCircle2
        className="mt-[2px] h-4 w-4 flex-shrink-0 text-cobalt-accent"
        aria-hidden
      />
      {children}
    </li>
  )
}

interface CardBodyProps {
  className?: string
  children: React.ReactNode
}

function CardBody({ className, children }: CardBodyProps) {
  return <div className={cn('flex flex-1 flex-col', className)}>{children}</div>
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

function CardFooter({ className, children }: CardFooterProps) {
  return <div className={cn(className)}>{children}</div>
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardPrice,
  CardDescription,
  CardTagline,
  CardPriceBlock,
  CardCheckList,
  CardCheckItem,
  CardBody,
}
