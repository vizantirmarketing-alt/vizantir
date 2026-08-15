import 'server-only';
import { Resend } from 'resend';
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

  return `
    <div style="font-family: 'Satoshi', system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1F1E1B;">
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
          ${rowLine('Submitted at', escapeHtml(submittedAtIso))}
        </tbody>
      </table>
      <p style="font-size: 13px; color: #6F6D66; line-height: 1.6; margin: 28px 0 0;">
        Reply to this email to respond directly to the submitter.
      </p>
    </div>
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

export async function submitContactForm(row: ContactSubmissionRow): Promise<void> {
  const supabase = createSupabaseServiceRole();

  const { error } = await supabase.from('contact_submissions').insert({
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    service: row.service,
    budget: row.budget,
    message: row.message,
    ip_hash: row.ipHash,
  });

  if (error) {
    console.error('contact_submissions insert failed:', error);
    throw new Error('Database insert failed');
  }

  const submittedAtIso = new Date().toISOString();
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !from || !apiKey) {
    console.error(
      'Resend / notification env missing (CONTACT_NOTIFICATION_EMAIL, RESEND_FROM_EMAIL, RESEND_API_KEY)'
    );
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `New contact: ${row.service} – ${row.name}`;

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: row.email,
      subject,
      html: contactNotificationHtml(row, submittedAtIso),
      text: [
        `Name: ${row.name}`,
        `Email: ${row.email}`,
        `Phone: ${row.phone ?? '—'}`,
        `Company: ${row.company ?? '—'}`,
        `Service: ${row.service}`,
        `Budget: ${row.budget ?? '—'}`,
        '',
        `Message:`,
        row.message,
        '',
        `Submitted at: ${submittedAtIso}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('Resend send failed:', err);
  }
}
