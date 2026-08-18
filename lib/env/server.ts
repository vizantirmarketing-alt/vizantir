import { z } from 'zod'

const serverEnvSchema = z.object({
  GA4_PROPERTY_ID: z
    .string()
    .regex(/^\d+$/)
    .optional(),
  GSC_SITE_URL: z.string().url().optional(),
  CLARITY_API_TOKEN: z.string().min(1).optional(),
})

export const serverEnv = serverEnvSchema.parse({
  GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
  GSC_SITE_URL: process.env.GSC_SITE_URL,
  CLARITY_API_TOKEN: process.env.CLARITY_API_TOKEN,
})
