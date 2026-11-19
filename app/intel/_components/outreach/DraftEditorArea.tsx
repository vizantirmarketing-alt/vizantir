'use client'

import { useEffect, useState, type ComponentProps } from 'react'

import { OutreachDraftEditor } from '@/app/intel/_components/outreach/OutreachDraftEditor'
import { rulesNotice, type RulesFinding } from '@/lib/outreach/rules-check'

/**
 * The editor and the writing rules notice. The editor remounts whenever the
 * draft changes on the server, so the notice for a save is kept here, where it
 * survives the refresh that follows the save.
 */
export function DraftEditorArea({
  rules,
  justSaved,
  ...editor
}: Omit<ComponentProps<typeof OutreachDraftEditor>, 'rulesNotice' | 'onSaved'> & {
  /** What the hard rules find in the stored text of a draft in review; null for any other status. */
  rules: RulesFinding | null
  /** The page was opened by the first save of a hand-written draft. */
  justSaved: boolean
}) {
  const [saved, setSaved] = useState<RulesFinding | null>(justSaved ? rules : null)

  // Drop the marker from the address, so reloading the page does not say "Saved." again.
  useEffect(() => {
    if (!justSaved) return
    const url = new URL(window.location.href)
    url.searchParams.delete('saved')
    window.history.replaceState(window.history.state, '', url)
  }, [justSaved])

  const notice = rules === null ? null : saved !== null ? rulesNotice(saved, true) : rulesNotice(rules, false)
  return <OutreachDraftEditor key={editor.draft.updatedAt} {...editor} rulesNotice={notice} onSaved={setSaved} />
}
