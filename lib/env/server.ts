import { z } from 'zod'

const serverEnvSchema = z.object({
  GA4_PROPERTY_ID: z
    .string()
    .regex(/^\d+$/)
    .optional(),
  GSC_SITE_URL: z.string().url().optional(),
  /** Base64-encoded service account JSON. GSC: webmasters.readonly. GA4: analytics.readonly. */
  GSC_SERVICE_ACCOUNT_KEY: z.string().min(1).optional(),
  CLARITY_API_TOKEN: z.string().min(1).optional(),
  /** Chrome UX Report API key. Query param for records:queryRecord. */
  CRUX_API_KEY: z.string().min(1).optional(),
  /** UptimeRobot API key for getMonitors. */
  UPTIMEROBOT_API_KEY: z.string().min(1).optional(),
  /** Comma-separated Intel allowlist. Documented value: vizantirmarketing@gmail.com */
  INTEL_ALLOWED_EMAILS: z.string().min(1).optional(),
  /** Dedicated Resend from-address for report delivery. Do not reuse RESEND_FROM_EMAIL. */
  REPORTS_FROM_EMAIL: z.string().min(1).optional(),
})

export const serverEnv = serverEnvSchema.parse({
  GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
  GSC_SITE_URL: process.env.GSC_SITE_URL,
  GSC_SERVICE_ACCOUNT_KEY: process.env.GSC_SERVICE_ACCOUNT_KEY,
  CLARITY_API_TOKEN: process.env.CLARITY_API_TOKEN,
  CRUX_API_KEY: process.env.CRUX_API_KEY,
  UPTIMEROBOT_API_KEY: process.env.UPTIMEROBOT_API_KEY,
  INTEL_ALLOWED_EMAILS: process.env.INTEL_ALLOWED_EMAILS,
  REPORTS_FROM_EMAIL: process.env.REPORTS_FROM_EMAIL,
})
