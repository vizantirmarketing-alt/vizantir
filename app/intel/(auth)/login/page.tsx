import type { Metadata } from 'next'

import { LoginForm } from '@/app/intel/_components/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

type IntelLoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>
}

export default async function IntelLoginPage({ searchParams }: IntelLoginPageProps) {
  const params = await searchParams
  const errorParam = params.error
  const initialError =
    typeof errorParam === 'string'
      ? errorParam.length > 0
      : Array.isArray(errorParam) && errorParam.length > 0

  return (
    <div className="flex min-h-screen items-center bg-background">
      <div className="mx-auto w-full max-w-md px-6 py-24">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cobalt-primary">
          Intel
        </p>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-4 mb-10 text-base leading-relaxed text-body">
          Enter your email to receive a sign-in link.
        </p>
        <LoginForm initialError={initialError} />
      </div>
    </div>
  )
}
