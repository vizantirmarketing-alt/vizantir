import 'server-only';
import { Resend } from 'resend';
import { randomBytes } from 'node:crypto';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

type StartOptInResult = {
  ok: boolean;
  alreadyConfirmed: boolean;
};

export async function startNewsletterOptIn(
  email: string
): Promise<StartOptInResult> {
  const supabase = createSupabaseServiceRole();

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  // If already confirmed, succeed silently. Don't reveal subscription state
  // to attackers probing for which addresses are on the list.
  if (existing?.status === 'confirmed') {
    return { ok: true, alreadyConfirmed: true };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: upsertError } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        status: 'pending',
        confirmation_token: token,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (upsertError) {
    console.error('Newsletter upsert failed:', upsertError);
    return { ok: false, alreadyConfirmed: false };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Confirm your subscription',
      html: confirmationEmailHtml(confirmUrl),
      text: `Confirm your subscription: ${confirmUrl}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.`,
    });
  } catch (err) {
    console.error('Resend send failed:', err);
    // Don't bubble up — pending row exists, user can retry.
    return { ok: false, alreadyConfirmed: false };
  }

  return { ok: true, alreadyConfirmed: false };
}

function confirmationEmailHtml(url: string): string {
  // Editorial, restrained. Adjust per-project brand.
  return `
    <div style="font-family: 'Satoshi', system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
      <h1 style="font-size: 22px; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 24px;">
        Confirm your subscription
      </h1>
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
        Click the link below to confirm. This link expires in 24 hours.
      </p>
      <p style="margin: 0 0 32px;">
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #1a1a1a; color: #fff; text-decoration: none; font-size: 14px; letter-spacing: 0.02em;">
          Confirm subscription
        </a>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 0 0 24px;">
        Or paste this link into your browser:<br>
        <span style="word-break: break-all; color: #999;">${url}</span>
      </p>
      <p style="font-size: 13px; color: #666; line-height: 1.6; margin: 0;">
        If you didn't request this, ignore this email and you won't be subscribed.
      </p>
    </div>
  `;
}
