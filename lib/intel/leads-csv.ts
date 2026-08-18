import 'server-only'

import { csvRawField, csvTextField, encodeCsv } from '@/lib/intel/csv'
import type { LeadExportRecord } from '@/lib/intel/leads'

const LEAD_CSV_HEADER = [
  'submitted_at',
  'name',
  'email',
  'phone',
  'company',
  'service',
  'budget',
  'message',
  'status',
  'estimated_value_dollars',
  'notes',
  'landing_page',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'initial_channel',
  'notify_status',
  'notified_at',
] as const

function leadCsvRow(record: LeadExportRecord): string[] {
  return [
    csvRawField(record.submitted_at),
    csvTextField(record.name),
    csvTextField(record.email),
    csvTextField(record.phone),
    csvTextField(record.company),
    csvTextField(record.service),
    csvTextField(record.budget),
    csvTextField(record.message),
    csvTextField(record.status),
    csvRawField(record.estimated_value_dollars),
    csvTextField(record.notes),
    csvTextField(record.landing_page),
    csvTextField(record.referrer),
    csvTextField(record.utm_source),
    csvTextField(record.utm_medium),
    csvTextField(record.utm_campaign),
    csvTextField(record.initial_channel),
    csvTextField(record.notify_status),
    csvRawField(record.notified_at),
  ]
}

export function encodeLeadsCsv(records: readonly LeadExportRecord[]): string {
  return encodeCsv([LEAD_CSV_HEADER, ...records.map(leadCsvRow)])
}
