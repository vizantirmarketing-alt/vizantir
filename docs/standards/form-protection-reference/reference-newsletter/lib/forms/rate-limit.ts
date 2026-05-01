import 'server-only';
import { createHash } from 'node:crypto';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error('RATE_LIMIT_SALT not set');
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return '0.0.0.0';
}

type CheckOpts = {
  ip: string;
  formKey: string;
  windowMinutes: number;
  maxAttempts: number;
};

type CheckResult = {
  allowed: boolean;
  attempts: number;
};

export async function checkRateLimit(opts: CheckOpts): Promise<CheckResult> {
  const supabase = createSupabaseServiceRole();
  const ipHash = hashIp(opts.ip);
  const since = new Date(
    Date.now() - opts.windowMinutes * 60_000
  ).toISOString();

  const { count, error } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('form_key', opts.formKey)
    .gte('created_at', since);

  if (error) {
    // Fail closed.
    return { allowed: false, attempts: -1 };
  }

  const attempts = count ?? 0;
  if (attempts >= opts.maxAttempts) {
    return { allowed: false, attempts };
  }

  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert({ ip_hash: ipHash, form_key: opts.formKey });

  if (insertError) {
    return { allowed: false, attempts };
  }

  return { allowed: true, attempts: attempts + 1 };
}
