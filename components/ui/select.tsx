import * as React from 'react'

import { cn } from '@/lib/utils'

const selectClassName = cn(
  'appearance-none bg-no-repeat',
  'rounded-lg border border-black/10 bg-white',
  'py-2.5 pl-3 pr-9',
  'text-sm text-foreground transition-all',
  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus',
  'bg-size-[calc(0.875rem*14/24)_calc(0.875rem*8/24)]',
  'bg-position-[right_12px_center]',
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2014%208%27%20fill%3D%27none%27%20stroke%3D%27oklch%280.5%200.005%2085%29%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27m1%201%206%206%206-6%27%2F%3E%3C%2Fsvg%3E')]",
)

function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="select"
      className={cn(selectClassName, className)}
      {...props}
    />
  )
}

export { Select }
