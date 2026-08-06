import { cn } from '@/lib/utils'

type WindowProps = {
  title: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Window({ title, children, className, style }: WindowProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 1px rgba(0,0,0,.10), 0 28px 70px rgba(0,0,0,.22)',
        fontFamily: 'var(--font-analytir-sans)',
        ...style,
      }}
    >
      <div
        className="relative flex items-center px-3.5"
        style={{
          height: 38,
          background: '#f6f6f7',
          borderBottom: '1px solid #e8e8ea',
        }}
      >
        <div className="flex" style={{ gap: 7 }}>
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: '#d9d9dd' }}
          />
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: '#d9d9dd' }}
          />
          <span
            className="rounded-full"
            style={{ width: 10, height: 10, background: '#d9d9dd' }}
          />
        </div>
        <span
          className="pointer-events-none absolute"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12.5,
            color: '#71717a',
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}
