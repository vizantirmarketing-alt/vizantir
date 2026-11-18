/**
 * What the briefing's Inbound inquiries panel says, from the stored content
 * only. Pure. Every delivery-issue figure here comes from the deterministic
 * content, never from the narrative.
 */

import { INQUIRY_RECENT_DAYS, type BriefingContent, type BriefingDeliveryIssue } from '@/lib/briefing/context'

/** "3 new inquiries in the last 30 days, newest 2 shown." or "No new inquiries in the last 30 days." */
export function inquirySummaryLine(inquiries: Pick<BriefingContent['inquiries'], 'recentTotal' | 'recent'>): string {
  if (inquiries.recentTotal === 0) return `No new inquiries in the last ${INQUIRY_RECENT_DAYS} days.`
  const noun = inquiries.recentTotal === 1 ? 'inquiry' : 'inquiries'
  const shown = inquiries.recent.length < inquiries.recentTotal ? `, newest ${inquiries.recent.length} shown` : ''
  return `${inquiries.recentTotal} new ${noun} in the last ${INQUIRY_RECENT_DAYS} days${shown}.`
}

export type DeliveryIssueView =
  /** Recent issues, each tied to its inquiry, and a count of older ones. */
  | { kind: 'listed'; recent: BriefingDeliveryIssue[]; olderCount: number }
  /** The delivery-issue loader failed for this briefing. */
  | { kind: 'unavailable' }
  /** A briefing saved before the fix: only an all-time count, tied to no inquiry. */
  | { kind: 'legacy'; count: number }
  /** Nothing to say. */
  | { kind: 'none' }

export function deliveryIssueView(inquiries: BriefingContent['inquiries'], unavailable: ReadonlySet<string>): DeliveryIssueView {
  if (unavailable.has('deliveryIssues')) return { kind: 'unavailable' }
  if (inquiries.recentDeliveryIssues !== undefined) {
    const olderCount = inquiries.olderDeliveryIssueCount ?? 0
    if (inquiries.recentDeliveryIssues.length === 0 && olderCount === 0) return { kind: 'none' }
    return { kind: 'listed', recent: inquiries.recentDeliveryIssues, olderCount }
  }
  if (inquiries.deliveryIssues !== null && inquiries.deliveryIssues > 0) return { kind: 'legacy', count: inquiries.deliveryIssues }
  return { kind: 'none' }
}

/** "2 older new inquiries also have notification delivery issues." */
export function olderDeliveryIssueLine(count: number): string {
  return count === 1
    ? '1 older new inquiry also has a notification delivery issue.'
    : `${count.toLocaleString('en-US')} older new inquiries also have notification delivery issues.`
}

/** For a briefing saved before the fix: the count it stored, worded so it is tied to no recent inquiry. */
export function legacyDeliveryIssueLine(count: number): string {
  return `When this briefing was made, ${count.toLocaleString('en-US')} ${count === 1 ? 'inquiry' : 'inquiries'} of any age had notification delivery issues.`
}
