'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type PanelRetryProps = {
  label?: string
}

export function PanelRetry({ label = 'Retry' }: PanelRetryProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
      className="text-sm text-cobalt-primary transition-colors hover:text-[#1E85FF] disabled:opacity-50"
    >
      {pending ? 'Retrying…' : label}
    </button>
  )
}

type PanelQueryErrorProps = {
  message: string
}

export function PanelQueryError({ message }: PanelQueryErrorProps) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-warning" role="alert">
        {message}
      </p>
      <div className="mt-2">
        <PanelRetry />
      </div>
    </div>
  )
}
