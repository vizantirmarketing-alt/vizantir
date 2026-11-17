/**
 * The briefing's Outreach panel, built from counts only. Pure; no model
 * text. Every line links to the Outreach page.
 */

import type { BriefingOutreach } from '@/lib/briefing/context'

export const OUTREACH_PAGE_HREF = '/intel/outreach'

function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`
}

/** One line per count, in a fixed order, zeros included. */
export function outreachPanelLines(outreach: BriefingOutreach): { key: keyof BriefingOutreach; text: string; href: string }[] {
  return [
    { key: 'acceptedWaiting', text: `${plural(outreach.acceptedWaiting, 'accepted lead', 'accepted leads')} waiting for an email` },
    { key: 'needsReview', text: `${plural(outreach.needsReview, 'draft needs', 'drafts need')} review` },
    { key: 'approvedNotSent', text: `${plural(outreach.approvedNotSent, 'approved email', 'approved emails')} not sent yet` },
    { key: 'toCall', text: `${plural(outreach.toCall, 'lead', 'leads')} to call` },
    { key: 'sentYesterday', text: `${plural(outreach.sentYesterday, 'email', 'emails')} sent yesterday` },
  ].map((line) => ({ ...line, key: line.key as keyof BriefingOutreach, href: OUTREACH_PAGE_HREF }))
}
