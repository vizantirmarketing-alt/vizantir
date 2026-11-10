'use server'

import { revalidatePath } from 'next/cache'

import { requireIntelUser } from '@/lib/auth/allowlist'
import { createGenerateDeps } from '@/lib/briefing/deps'
import { generateBriefing } from '@/lib/briefing/generate'

export type GenerateBriefingResult =
  | { ok: true; status: string; error: string | null }
  | { ok: false; error: string }

/**
 * Creates today's briefing, or regenerates it if one exists. Long running
 * (one model call with a 45 second timeout and one retry): the briefing page
 * sets maxDuration to cover it.
 */
export async function generateBriefingNow(): Promise<GenerateBriefingResult> {
  await requireIntelUser()

  try {
    const result = await generateBriefing(createGenerateDeps(), { overwrite: true })
    revalidatePath('/intel/briefing')
    return { ok: true, status: result.status, error: result.error }
  } catch {
    console.error('Briefing generation failed')
    return { ok: false, error: 'Unable to generate the briefing. Try again shortly.' }
  }
}
