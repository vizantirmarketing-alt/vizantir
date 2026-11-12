/**
 * Outreach settings checks and the footer. Pure.
 *
 * The footer is built here, from the settings, and appended by code. The
 * model never writes it and the owner cannot edit it on a draft.
 */

import { z } from 'zod'

import {
  OPT_OUT_LINE,
  SETTINGS_ADDRESS_MAX,
  SETTINGS_TEXT_MAX,
  isValidEmail,
  normalizeEmail,
} from '@/lib/outreach/params'
import type { OutreachSettings } from '@/lib/outreach/types'

export const SETTINGS_FIELD_LABELS: Record<keyof OutreachSettings, string> = {
  senderName: 'sender name',
  studioName: 'studio name',
  replyToEmail: 'reply-to email',
  postalAddress: 'postal mailing address',
}

/** The fields still missing; empty when the settings are complete. */
export function missingSettings(settings: OutreachSettings | null): (keyof OutreachSettings)[] {
  const s = settings ?? { senderName: '', studioName: '', replyToEmail: '', postalAddress: '' }
  const missing: (keyof OutreachSettings)[] = []
  if (s.senderName.trim().length === 0) missing.push('senderName')
  if (s.studioName.trim().length === 0) missing.push('studioName')
  if (!isValidEmail(s.replyToEmail.trim())) missing.push('replyToEmail')
  if (s.postalAddress.trim().length === 0) missing.push('postalAddress')
  return missing
}

export function missingSettingsMessage(missing: readonly (keyof OutreachSettings)[]): string {
  const names = missing.map((key) => SETTINGS_FIELD_LABELS[key])
  const list = names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `Add the ${list} in Outreach settings before drafting. Every email needs a postal mailing address in its footer.`
}

const line = (max: number) =>
  z
    .string()
    .max(max, `Keep it under ${max} characters.`)
    .transform((value) => value.replace(/[\r\n\t]+/g, ' ').trim())

/** The settings form, validated at the server action boundary. */
export const settingsInputSchema = z.strictObject({
  senderName: line(SETTINGS_TEXT_MAX),
  studioName: line(SETTINGS_TEXT_MAX),
  replyToEmail: line(SETTINGS_TEXT_MAX)
    .transform(normalizeEmail)
    .refine((value) => value.length === 0 || isValidEmail(value), { message: 'Enter a valid reply-to email.' }),
  postalAddress: z
    .string()
    .max(SETTINGS_ADDRESS_MAX, `Keep the address under ${SETTINGS_ADDRESS_MAX} characters.`)
    .transform((value) =>
      value
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((part) => part.trim())
        .filter(Boolean)
        .join('\n'),
    ),
})

/** Sender name, studio name, postal address, then the opt-out line. */
export function buildFooter(settings: OutreachSettings): string {
  return [settings.senderName.trim(), settings.studioName.trim(), settings.postalAddress.trim(), '', OPT_OUT_LINE].join('\n')
}
