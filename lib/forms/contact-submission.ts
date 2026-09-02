import 'server-only';
import { Resend } from 'resend';
import type { ContactEnrichment } from '@/lib/contact/enrich';
import { emptyToNull } from '@/lib/forms/attribution';
import { createSupabaseServiceRole } from '@/lib/supabase/service';

export type ContactSubmissionRow = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string;
  budget: string | null;
  message: string;
  ipHash: string;
  landingPage: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  initialChannel: string | null;
  enrichment: ContactEnrichment;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function contactNotificationHtml(row: ContactSubmissionRow, submittedAtIso: string): string {
  const dash = '—';
  const phone = row.phone?.trim() ? escapeHtml(row.phone) : dash;
  const company = row.company?.trim() ? escapeHtml(row.company) : dash;
  const budget = row.budget?.trim() ? escapeHtml(row.budget) : dash;

  const flagged =
    row.enrichment.isSuspect && row.enrichment.suspectReason
      ? `<p style="margin: 0 0 20px; color: #DC2626; font-weight: 600;">Flagged: ${escapeHtml(row.enrichment.suspectReason)}</p>`
      : '';

  return `
    <div style="font-family: 'Satoshi', system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1F1E1B;">
      ${flagged}
      <h1 style="font-size: 22px; font-weight: 500; letter-spacing: -0.01em; margin: 0 0 28px;">
        New contact submission
      </h1>
      <table style="width: 100%; font-size: 15px; line-height: 1.65; border-collapse: collapse;">
        <tbody>
          ${rowLine('Name', escapeHtml(row.name))}
          ${rowLine('Email', escapeHtml(row.email))}
          ${rowLine('Phone', phone)}
          ${rowLine('Company', company)}
          ${rowLine('Service', escapeHtml(row.service))}
          ${rowLine('Budget', budget)}
          ${rowLineBlock('Message', escapeHtml(row.message))}
          ${submissionDetailsRows(row.enrichment)}
          ${rowLine('Submitted at', escapeHtml(submittedAtIso))}
        </tbody>
      </table>
      <p style="font-size: 13px; color: #6F6D66; line-height: 1.6; margin: 28px 0 0;">
        Reply to this email to respond directly to the submitter.
      </p>
    </div>
  `;
}

function contactNotificationText(
  row: ContactSubmissionRow,
  submittedAtIso: string
): string {
  const dash = '—';
  const enrichment = row.enrichment;
  const location = [enrichment.country, enrichment.region, enrichment.city]
    .filter((part): part is string => part != null && part.length > 0)
    .join(', ');
  const mxLabel =
    enrichment.mxValid === true ? 'yes' : enrichment.mxValid === false ? 'no' : dash;

  const lines = [
    ...(enrichment.isSuspect && enrichment.suspectReason
      ? [`Flagged: ${enrichment.suspectReason}`, '']
      : []),
    `Name: ${row.name}`,
    `Email: ${row.email}`,
    `Phone: ${row.phone ?? dash}`,
    `Company: ${row.company ?? dash}`,
    `Service: ${row.service}`,
    `Budget: ${row.budget ?? dash}`,
    '',
    `Message:`,
    row.message,
    '',
  ];

  lines.push(`Submission details`);

  lines.push(
    `Location: ${location.length > 0 ? location : dash}`,
    `Device: ${enrichment.deviceSummary ?? dash}`,
    `IP: ${enrichment.ip ?? dash}`,
    `MX valid: ${mxLabel}`,
    '',
    `Submitted at: ${submittedAtIso}`
  );

  return lines.join('\n');
}

function submissionDetailsRows(enrichment: ContactEnrichment): string {
  const dash = '—';
  const location = [enrichment.country, enrichment.region, enrichment.city]
    .filter((part): part is string => part != null && part.length > 0)
    .join(', ');
  const mxLabel =
    enrichment.mxValid === true ? 'yes' : enrichment.mxValid === false ? 'no' : dash;

  return `
    <tr>
      <td colspan="2" style="padding: 16px 0 8px; color: #6F6D66; font-weight: 500;">Submission details</td>
    </tr>
    ${rowLine('Location', escapeHtml(location.length > 0 ? location : dash))}
    ${rowLine('Device', escapeHtml(enrichment.deviceSummary ?? dash))}
    ${rowLine('IP', escapeHtml(enrichment.ip ?? dash))}
    ${rowLine('MX valid', escapeHtml(mxLabel))}
  `;
}

function rowLine(label: string, value: string): string {
  return `
    <tr>
      <td style="vertical-align: top; padding: 10px 16px 10px 0; color: #6F6D66; width: 140px; font-weight: 500;">${escapeHtml(label)}</td>
      <td style="vertical-align: top; padding: 10px 0; color: #1F1E1B;">${value}</td>
    </tr>
  `;
}

function rowLineBlock(label: string, value: string): string {
  return `
    <tr>
      <td colspan="2" style="padding: 16px 0 8px; color: #6F6D66; font-weight: 500;">${escapeHtml(label)}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding: 0 0 16px; color: #1F1E1B; white-space: pre-wrap;">${value}</td>
    </tr>
  `;
}

type NotifyStatus = 'sent' | 'failed' | 'not_configured';

type NotifyOutcome = {
  notify_status: NotifyStatus;
  notified_at: string | null;
  notify_error: string | null;
};

function readInsertedId(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return null;
  }
  const id = value.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function truncateNotifyError(message: string): string {
  return message.length > 500 ? message.slice(0, 500) : message;
}

function notifyErrorFromUnknown(err: unknown, row: ContactSubmissionRow): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return sanitizeNotifyError(err.message, row);
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return sanitizeNotifyError(err, row);
  }
  return 'Notification send failed';
}

function sanitizeNotifyError(message: string, row: ContactSubmissionRow): string {
  let out = message.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted]');
  const pii = [row.email, row.name, row.phone, row.company, row.message];
  for (const value of pii) {
    const trimmed = value?.trim();
    if (!trimmed || trimmed.length < 3) {
      continue;
    }
    out = out.split(trimmed).join('[redacted]');
  }
  return truncateNotifyError(out);
}

async function recordNotifyOutcome(
  supabase: ReturnType<typeof createSupabaseServiceRole>,
  id: string | null,
  outcome: NotifyOutcome
): Promise<void> {
  if (!id) {
    return;
  }
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .update({
        notify_status: outcome.notify_status,
        notified_at: outcome.notified_at,
        notify_error: outcome.notify_error,
      })
      .eq('id', id);
    if (error) {
      console.error('contact_submissions notify status update failed:', error);
    }
  } catch {
    // Recording notify status must never break a saved submission.
  }
}

export async function submitContactForm(row: ContactSubmissionRow): Promise<void> {
  const supabase = createSupabaseServiceRole();

  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      service: row.service,
      budget: row.budget,
      message: row.message,
      ip_hash: row.ipHash,
      landing_page: emptyToNull(row.landingPage),
      referrer:
        emptyToNull(row.referrer) ?? emptyToNull(row.enrichment.httpReferrer),
      utm_source: emptyToNull(row.utmSource),
      utm_medium: emptyToNull(row.utmMedium),
      utm_campaign: emptyToNull(row.utmCampaign),
      initial_channel: emptyToNull(row.initialChannel),
      ip: row.enrichment.ip,
      country: row.enrichment.country,
      region: row.enrichment.region,
      city: row.enrichment.city,
      timezone: row.enrichment.timezone,
      browser: row.enrichment.browser,
      browser_version: row.enrichment.browserVersion,
      os: row.enrichment.os,
      os_version: row.enrichment.osVersion,
      device_type: row.enrichment.deviceType,
      user_agent: row.enrichment.userAgent,
      accept_language: row.enrichment.acceptLanguage,
      mx_valid: row.enrichment.mxValid,
      is_suspect: row.enrichment.isSuspect,
      suspect_reason: row.enrichment.suspectReason,
      submit_duration_ms: row.enrichment.submitDurationMs,
    })
    .select('id')
    .single();

  if (error) {
    console.error('contact_submissions insert failed:', error);
    throw new Error('Database insert failed');
  }

  const submissionId = readInsertedId(data);
  const submittedAtIso = new Date().toISOString();
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !from || !apiKey) {
    const missing: string[] = [];
    if (!to) missing.push('CONTACT_NOTIFICATION_EMAIL');
    if (!from) missing.push('RESEND_FROM_EMAIL');
    if (!apiKey) missing.push('RESEND_API_KEY');
    console.error(`Resend / notification env missing (${missing.join(', ')})`);
    await recordNotifyOutcome(supabase, submissionId, {
      notify_status: 'not_configured',
      notified_at: null,
      notify_error: `Missing env: ${missing.join(', ')}`,
    });
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `New contact: ${row.service} – ${row.name}`;

  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo: row.email,
      subject,
      html: contactNotificationHtml(row, submittedAtIso),
      text: contactNotificationText(row, submittedAtIso),
    });

    if (result.error) {
      console.error('Resend send failed:', result.error.name);
      await recordNotifyOutcome(supabase, submissionId, {
        notify_status: 'failed',
        notified_at: null,
        notify_error: sanitizeNotifyError(
          `${result.error.name}: ${result.error.message}`,
          row
        ),
      });
      return;
    }

    await recordNotifyOutcome(supabase, submissionId, {
      notify_status: 'sent',
      notified_at: new Date().toISOString(),
      notify_error: null,
    });
  } catch (err) {
    console.error('Resend send failed');
    await recordNotifyOutcome(supabase, submissionId, {
      notify_status: 'failed',
      notified_at: null,
      notify_error: notifyErrorFromUnknown(err, row),
    });
  }
}
