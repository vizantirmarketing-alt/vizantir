/**
 * The command center's catalog (Phase 3, docs/intel/PLAN.md section 8): the
 * only things an instruction can become. Pure; safe for client components.
 *
 * Each command either reads data the application already stores or, for
 * find_prospects and research_prospect, is recognized but not run in this
 * slice. Prospect references are the owner's words (a name or a domain); code
 * resolves them against the database and never trusts an id from the model.
 */

import { z } from 'zod'

import { RUN_TARGET_COUNT_MAX, RUN_TEXT_MAX } from '@/lib/prospects/params'

export const COMMANDS = [
  'summarize_briefing',
  'explain_score',
  'compare_prospects',
  'review_inquiries',
  'summarize_findings',
  'find_prospects',
  'research_prospect',
] as const
export type CommandName = (typeof COMMANDS)[number]

/** Commands recognized but not run from this page yet. */
export const NOT_AVAILABLE_COMMANDS: readonly CommandName[] = ['find_prospects', 'research_prospect']

/** Longest instruction accepted, in characters. */
export const INSTRUCTION_MAX = 500
/** Longest prospect reference, in characters. */
export const PROSPECT_REF_MAX = 200
export const COMPARE_MIN = 2
export const COMPARE_MAX = 5
export const FINDINGS_LIMIT_MAX = 20
export const FINDINGS_LIMIT_DEFAULT = 10
/** Instructions per signed-in user per hour. */
export const ASSISTANT_MAX_PER_HOUR = 30
export const ASSISTANT_RATE_LIMIT_KEY = 'intel-assistant'

const prospectRef = z.string().trim().min(1).max(PROSPECT_REF_MAX)
const text = z.string().trim().min(1).max(RUN_TEXT_MAX)

/** Every command with its validated parameters. Unknown keys refuse. */
export const commandSchema = z.discriminatedUnion('command', [
  z.strictObject({ command: z.literal('summarize_briefing'), params: z.strictObject({}).default({}) }),
  z.strictObject({ command: z.literal('explain_score'), params: z.strictObject({ prospect: prospectRef }) }),
  z.strictObject({
    command: z.literal('compare_prospects'),
    params: z.strictObject({ prospects: z.array(prospectRef).min(COMPARE_MIN).max(COMPARE_MAX) }),
  }),
  z.strictObject({ command: z.literal('review_inquiries'), params: z.strictObject({}).default({}) }),
  z.strictObject({
    command: z.literal('summarize_findings'),
    params: z.strictObject({ limit: z.number().int().min(1).max(FINDINGS_LIMIT_MAX).optional() }).default({}),
  }),
  z.strictObject({
    command: z.literal('find_prospects'),
    params: z.strictObject({ market: text, industry: text, count: z.number().int().min(1).max(RUN_TARGET_COUNT_MAX) }),
  }),
  z.strictObject({ command: z.literal('research_prospect'), params: z.strictObject({ prospect: prospectRef }) }),
])
export type Command = z.infer<typeof commandSchema>

/** What the interpreting call may return: one command, or unsupported. */
export const interpretationSchema = z.union([commandSchema, z.strictObject({ command: z.literal('unsupported') })])
export type Interpretation = z.infer<typeof interpretationSchema>

export const COMMAND_LABELS: Record<CommandName, string> = {
  summarize_briefing: 'Summarize the latest briefing',
  explain_score: 'Explain a prospect score',
  compare_prospects: 'Compare prospects',
  review_inquiries: 'Review inbound inquiries',
  summarize_findings: 'Summarize open findings',
  find_prospects: 'Find new prospects',
  research_prospect: 'Research a prospect further',
}

/** The quiet line above an answer: how the instruction was read, from the validated command only. */
export function understoodAs(command: Command): string {
  const label = COMMAND_LABELS[command.command]
  switch (command.command) {
    case 'explain_score':
    case 'research_prospect':
      return `${label}: ${command.params.prospect}`
    case 'compare_prospects':
      return `${label}: ${command.params.prospects.join(', ')}`
    case 'summarize_findings':
      return command.params.limit === undefined ? label : `${label}, up to ${command.params.limit}`
    case 'find_prospects':
      return `${label}: ${command.params.count} ${command.params.industry} in ${command.params.market}`
    default:
      return label
  }
}

/** The empty state: example instructions. prefill fills the input; text is shown. */
export const EXAMPLES: readonly { text: string; prefill: string }[] = [
  { text: 'Summarize the latest briefing', prefill: 'Summarize the latest briefing' },
  { text: 'Explain the score for a prospect, by name or domain', prefill: 'Explain the score for ' },
  { text: 'Compare two to five prospects', prefill: 'Compare ' },
  { text: 'Which inquiries should I follow up first?', prefill: 'Which inquiries should I follow up first?' },
  { text: 'Summarize the open findings', prefill: 'Summarize the open findings' },
]

export const UNSUPPORTED_MESSAGE =
  'This page answers from data the dashboard already stores. It can summarize the latest briefing, explain a prospect score, compare two to five prospects, review open inbound inquiries, and summarize open findings. Starting new research is not available here yet: use Prospect Research.'
