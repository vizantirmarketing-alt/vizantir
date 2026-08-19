import type { ReactNode } from 'react'

type StatStripProps = {
  children: ReactNode
}

export function StatStrip({ children }: StatStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}
