import { NextResponse } from 'next/server';
import { enrichContactSubmission } from '@/lib/contact/enrich';
import { handleContactPost } from '@/lib/forms/contact-handler';
import { submitContactForm } from '@/lib/forms/contact-submission';
import { checkRateLimit, getClientIp, hashIp } from '@/lib/forms/rate-limit';
import { verifyTurnstile } from '@/lib/forms/turnstile';

export async function POST(req: Request) {
  const reply = await handleContactPost(req, {
    enrich: enrichContactSubmission,
    getClientIp,
    hashIp,
    verifyTurnstile,
    checkRateLimit,
    submit: submitContactForm,
  });
  return NextResponse.json(reply.body, { status: reply.status });
}
