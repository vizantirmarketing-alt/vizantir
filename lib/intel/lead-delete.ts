import 'server-only'

import type { LeadsDb } from '@/lib/intel/leads'

/**
 * The one delete path for inquiries. Only spam can be deleted, and that is
 * enforced in the delete query itself (status = spam), not by an earlier
 * read, so a row whose status changed in the meantime is left alone. Status
 * history rows go with their inquiry through the foreign key's cascade
 * (migration 0008).
 */
export type SpamDeleteScope = { id: string } | { all: true }

export type SpamDeleteResult = { ok: true; deletedIds: string[] } | { ok: false }

function readIds(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.flatMap((row) => {
    if (typeof row !== 'object' || row === null) {
      return []
    }
    const id = Reflect.get(row, 'id')
    return typeof id === 'string' && id.length > 0 ? [id] : []
  })
}

export async function deleteSpamLeads(
  supabase: LeadsDb,
  scope: SpamDeleteScope,
): Promise<SpamDeleteResult> {
  let query = supabase
    .from('contact_submissions')
    .delete()
    .eq('status', 'spam')
  if ('id' in scope) {
    query = query.eq('id', scope.id)
  }
  const { data, error } = await query.select('id')
  if (error) {
    return { ok: false }
  }
  return { ok: true, deletedIds: readIds(data) }
}
