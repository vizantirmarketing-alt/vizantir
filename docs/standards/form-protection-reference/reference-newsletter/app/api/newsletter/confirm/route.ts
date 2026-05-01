import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  if (!token || token.length < 16) {
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }

  const supabase = createSupabaseServiceRole();

  const { data: row, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, status, token_expires_at')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }

  if (row.status === 'confirmed') {
    return NextResponse.redirect(`${siteUrl}/newsletter/confirmed`);
  }

  if (
    row.token_expires_at &&
    new Date(row.token_expires_at) < new Date()
  ) {
    return NextResponse.redirect(`${siteUrl}/newsletter/expired`);
  }

  const { error: updateError } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'confirmed',
      confirmation_token: null,
      token_expires_at: null,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  if (updateError) {
    return NextResponse.redirect(`${siteUrl}/newsletter/error`);
  }

  return NextResponse.redirect(`${siteUrl}/newsletter/confirmed`);
}
