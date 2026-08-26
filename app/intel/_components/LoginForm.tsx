'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type LoginFormProps = {
  initialError?: boolean
}

type FormStatus = 'idle' | 'submitting' | 'error'

const ERROR_MESSAGE = 'Unable to complete sign-in. Try again shortly.'

export function LoginForm({ initialError = false }: LoginFormProps) {
  const [status, setStatus] = useState<FormStatus>(initialError ? 'error' : 'idle')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')

    try {
      const supabase = createSupabaseBrowserClient()
      const redirectTo = `${window.location.origin}/intel/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) {
        console.error('Intel Google sign-in failed', error)
        setStatus('error')
        return
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status === 'error' ? (
        <p className="text-sm text-body" role="alert">
          {ERROR_MESSAGE}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="h-11 w-full bg-cobalt-primary px-6 text-white hover:bg-[#1E85FF]"
      >
        {status === 'submitting' ? 'Continuing…' : 'Continue with Google'}
      </Button>
    </form>
  )
}
