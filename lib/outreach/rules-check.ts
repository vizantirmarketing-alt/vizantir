/**
 * The hard voice rules, checked against a draft's text whatever wrote it (the
 * model, an edit, or the owner by hand). Approve and send refuse a draft that
 * breaks one (writingRulesRefusal). Saving never refuses on them: the save
 * goes through and the problems come back with it (writingRulesFinding), so
 * the owner sees what to change before approving. The draft page shows the
 * same notice on load (rulesNotice). Pure: the check itself is injected
 * (checkDraftRules in gmail/deps.ts runs voice.ts against the lead as it is
 * now). A lead that can no longer be loaded cannot be checked, so approve and
 * send are refused.
 */

import type { OutreachDraft } from '@/lib/outreach/types'

/** The text checked, and the lead it is checked against. */
export type DraftText = Pick<OutreachDraft, 'subjectType' | 'subjectRef' | 'leadId' | 'subject' | 'body'>

/** The hard rules the text breaks, in plain words; empty when it passes; null when the lead cannot be loaded. */
export type RuleCheck = (draft: DraftText) => Promise<string[] | null>

/** The steps that refuse a draft breaking a hard rule. */
export type RuleStep = 'approved' | 'sent'

/** What the check found: the problems in plain words (empty when it passes), or unchecked when the lead cannot be loaded. */
export type RulesFinding = { checked: true; problems: string[] } | { checked: false }

const UNLOADABLE = 'This lead can no longer be loaded, so the email cannot be checked against the writing rules.'

const NOT_DONE: Record<RuleStep, string> = {
  approved: 'It was not approved.',
  sent: 'Nothing was sent.',
}

const NEXT: Record<RuleStep, string> = {
  approved: 'Edit it before approving.',
  sent: 'Nothing was sent. Edit it before sending.',
}

/** The hard rules the text breaks, or unchecked when the lead cannot be loaded. */
export async function writingRulesFinding(check: RuleCheck, draft: DraftText): Promise<RulesFinding> {
  const reasons = await check(draft)
  return reasons === null ? { checked: false } : { checked: true, problems: reasons }
}

/** The refusal for approve or send, or null when the text meets every hard rule. */
export async function writingRulesRefusal(check: RuleCheck, draft: DraftText, step: RuleStep): Promise<string | null> {
  const finding = await writingRulesFinding(check, draft)
  if (!finding.checked) return `${UNLOADABLE} ${NOT_DONE[step]}`
  if (finding.problems.length === 0) return null
  return `This email does not meet the writing rules: ${finding.problems.join(' ')} ${NEXT[step]}`
}

/**
 * The check after a save. A check that fails outright counts as unchecked,
 * so a save that went through is never reported as failed.
 */
export async function findingAfterSave(check: RuleCheck, draft: DraftText): Promise<RulesFinding> {
  try {
    return await writingRulesFinding(check, draft)
  } catch {
    return { checked: false }
  }
}

export type RulesNotice = { lead: string; problems: string[] }

/**
 * The notice on the draft page: after a save (saved), or on load for a draft
 * in review. Null when there is nothing to say.
 */
export function rulesNotice(finding: RulesFinding, saved: boolean): RulesNotice | null {
  const prefix = saved ? 'Saved. ' : ''
  if (!finding.checked) return { lead: `${prefix}${UNLOADABLE} It cannot be approved or sent until it can be checked.`, problems: [] }
  if (finding.problems.length > 0) return { lead: `${prefix}Before this can be approved, change the following:`, problems: finding.problems }
  return saved ? { lead: 'Saved.', problems: [] } : null
}
