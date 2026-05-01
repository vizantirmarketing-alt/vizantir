'use client';

import { Turnstile } from '@marsidev/react-turnstile';

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export function TurnstileWidget({ onVerify, onExpire, onError }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div style={{ fontSize: 13, color: '#a00' }}>
          NEXT_PUBLIC_TURNSTILE_SITE_KEY missing
        </div>
      );
    }
    return null;
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      onError={onError}
      options={{
        theme: 'light',
        size: 'flexible',
      }}
    />
  );
}
