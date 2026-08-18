import { z } from 'zod'

const clientEnvSchema = z.object({
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .optional(),
  NEXT_PUBLIC_CLARITY_PROJECT_ID: z.string().min(1).optional(),
})

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
})
