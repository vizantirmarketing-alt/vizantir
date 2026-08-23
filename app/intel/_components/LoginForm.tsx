'use client'

import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type LoginFormProps = {
  initialError?: boolean
}

type FormStatus = 'idle' | 'submitting' | 'sent' | 'error'

const SENT_MESSAGE =
  'Check your email for a sign-in link. If it does not arrive, you can request another.'
const ERROR_MESSAGE = 'Unable to complete sign-in. Try again shortly.'

export function LoginForm({ initialError = false }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<FormStatus>(initialError ? 'error' : 'idle')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')

    try {
      const supabase = createSupabaseBrowserClient()
      const emailRedirectTo = `${window.location.origin}/intel/auth/callback`

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo,
          shouldCreateUser: false,
        },
      })

      if (error) {
        console.error('Intel magic-link request failed', error)
        setStatus('error')
        return
      }

      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <p className="text-base leading-relaxed text-body" role="status">
        {SENT_MESSAGE}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {status === 'error' ? (
        <p className="text-sm text-body" role="alert">
          {ERROR_MESSAGE}
        </p>
      ) : null}

      <div>
        <label htmlFor="intel-email" className="mb-2 block text-sm font-medium text-body">
          Email
        </label>
        <input
          id="intel-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === 'submitting'}
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus"
        />
      </div>

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="h-11 bg-cobalt-primary px-6 text-white hover:bg-[#1E85FF]"
      >
        {status === 'submitting' ? 'Sending…' : 'Send magic link'}
      </Button>
    </form>
  )
}
