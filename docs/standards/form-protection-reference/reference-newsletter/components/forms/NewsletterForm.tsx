'use client';

import { useState } from 'react';
import { Honeypot } from './Honeypot';
import { TurnstileWidget } from './TurnstileWidget';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!turnstileToken) {
      setStatus({
        kind: 'error',
        message: 'Please complete the verification.',
      });
      return;
    }

    setStatus({ kind: 'submitting' });

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          website, // honeypot — server checks this
          turnstileToken,
        }),
      });

      if (res.status === 429) {
        setStatus({
          kind: 'error',
          message: 'Too many attempts. Please try again later.',
        });
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setStatus({ kind: 'success' });
      } else {
        setStatus({
          kind: 'error',
          message: data.error || 'Something went wrong. Please try again.',
        });
      }
    } catch {
      setStatus({
        kind: 'error',
        message: 'Network error. Please try again.',
      });
    }
  }

  if (status.kind === 'success') {
    return (
      <div className="font-[Satoshi] text-[15px] leading-relaxed text-stone-700">
        <p className="mb-2 text-stone-900 font-medium">Check your email.</p>
        <p>
          We sent a confirmation link to{' '}
          <span className="text-stone-900">{email}</span>. Click it to complete
          your subscription. The link expires in 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="font-[Satoshi] flex flex-col gap-4"
      noValidate
    >
      <Honeypot value={website} onChange={setWebsite} />

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-[13px] tracking-wide uppercase text-stone-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status.kind === 'submitting'}
          className="border-b border-stone-300 bg-transparent py-2 text-[15px] text-stone-900 outline-none focus:border-stone-900 disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <TurnstileWidget
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
      />

      {status.kind === 'error' && (
        <p className="text-[13px] text-red-700" role="alert">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.kind === 'submitting' || !turnstileToken}
        className="self-start bg-stone-900 px-6 py-3 text-[14px] tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status.kind === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  );
}
