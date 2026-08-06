import { cn } from '@/lib/utils'

type StageProps = {
  children: React.ReactNode
  className?: string
}

export function Stage({ children, className }: StageProps) {
  return (
    <div
      className={cn('relative rounded-[20px] p-10 md:p-14', className)}
      style={{ background: 'var(--secondary)' }}
    >
      {children}
    </div>
  )
}
