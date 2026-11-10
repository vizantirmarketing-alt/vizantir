import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { ProspectMeasureButton } from '@/app/intel/_components/prospects/ProspectMeasureButton'
import { ProspectReviewControls } from '@/app/intel/_components/prospects/ProspectReviewControls'
import { Panel } from '@/app/intel/_components/ui/Panel'
import {
  ProspectConfidenceChip,
  ProspectReviewChip,
} from '@/app/intel/_components/ui/StatusChip'
import { requireIntelUser } from '@/lib/auth/allowlist'
import {
  fetchProspectDetail,
  type ProspectDetail,
  type ProspectEvidenceRow,
} from '@/lib/prospects/load'
import {
  EVIDENCE_KIND_LABELS,
  formatProspectTimestamp,
  formatScore,
  formatShortDate,
  isUuid,
} from '@/lib/prospects/params'
import {
  FACTOR_DEFINITIONS,
  PROSPECT_RATING_LABELS,
  RUBRIC_VERSION,
  computeScore,
  isProspectFactor,
  type ScoreBreakdown,
  type ScoreKind,
} from '@/lib/prospects/rubric'

// Measure performance runs a PageSpeed Insights test through a server action
// on this route. The fetcher allows 90 seconds plus one quick retry, and the
// runner measure route allows 120, so this matches it.
export const maxDuration = 120

export const metadata: Metadata = {
  title: 'Prospect',
  robots: { index: false, follow: false },
}

type ProspectDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function IntelProspectDetailPage({
  params,
}: ProspectDetailPageProps) {
  await requireIntelUser()

  const { id } = await params
  if (!isUuid(id)) {
    notFound()
  }

  const result = await fetchProspectDetail(id)
  if (!result.ok && result.reason === 'not_found') {
    notFound()
  }

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <Panel>
          <p className="text-sm leading-relaxed text-body" role="alert">
            Unable to load this prospect. Try again shortly.
          </p>
        </Panel>
      </div>
    )
  }

  const { prospect, evidence } = result

  return (
    <div className="flex flex-col gap-4">
      <BackLink />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {prospect.name}
        </h1>
        <ProspectReviewChip status={prospect.reviewStatus} />
        <ProspectConfidenceChip confidence={prospect.confidence} />
      </div>

      <CompanySection prospect={prospect} />
      <ScoresSection prospect={prospect} />
      <EvidenceSection evidence={evidence} latestRunId={prospect.latestRunId} />

      <Panel title="Review">
        <ProspectReviewControls
          prospectId={prospect.id}
          reviewStatus={prospect.reviewStatus}
          ownerNote={prospect.ownerNote}
        />
      </Panel>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/intel/prospects"
      className="inline-flex items-baseline gap-1 text-sm text-foreground transition-colors hover:text-cobalt-primary"
    >
      <ArrowLeft className="size-[1em]" aria-hidden />
      Prospect Research
    </Link>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-meta">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function CompanySection({ prospect }: { prospect: ProspectDetail }) {
  return (
    <Panel title="Company">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <Field label="Name">{prospect.name}</Field>
        <Field label="Website">
          <a
            href={`https://${prospect.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-cobalt-primary"
          >
            {prospect.domain}
          </a>
        </Field>
        <Field label="Industry">{prospect.industry ?? '—'}</Field>
        <Field label="Market">{prospect.market ?? '—'}</Field>
        <Field label="Last researched">
          <time dateTime={prospect.lastResearchedAt} className="tabular-nums">
            {formatProspectTimestamp(prospect.lastResearchedAt)}
          </time>
        </Field>
        <Field label="First found">
          <time dateTime={prospect.createdAt} className="tabular-nums">
            {formatShortDate(prospect.createdAt)}
          </time>
        </Field>
        <Field label="Reviewed">
          {prospect.reviewedAt === null ? '—' : formatShortDate(prospect.reviewedAt)}
        </Field>
      </dl>
    </Panel>
  )
}

const SCORE_TITLES: Record<ScoreKind, string> = {
  fit: 'Fit',
  opportunity: 'Opportunity',
}

function ScoreTable({
  kind,
  stored,
  breakdown,
}: {
  kind: ScoreKind
  stored: number | null
  breakdown: ScoreBreakdown
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-medium text-foreground">{SCORE_TITLES[kind]}</h3>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {formatScore(stored)}
          <span className="text-sm font-normal text-meta"> / 100</span>
        </p>
      </div>
      {stored === null ? (
        <p className="mt-1 text-sm text-meta">
          Not scored: more than half of this score&apos;s weight is unknown.
        </p>
      ) : null}
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/8 text-meta">
            <th className="py-1.5 pr-3 font-normal">Factor</th>
            <th className="py-1.5 pr-3 font-normal">Rating</th>
            <th className="py-1.5 text-right font-normal">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/8">
          {breakdown.factors.map((factor) => (
            <tr key={factor.key}>
              <td className="py-2 pr-3 align-top text-body">
                <p>{factor.label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-meta">
                  {FACTOR_DEFINITIONS[factor.key].description}
                </p>
              </td>
              <td className="py-2 pr-3 text-foreground">
                <span className="align-top">{PROSPECT_RATING_LABELS[factor.rating]}</span>
              </td>
              <td className="py-2 text-right tabular-nums text-foreground">
                {factor.rating === 'unknown' ? '—' : formatPoints(factor.points)}
                <span className="text-meta"> / {factor.weight}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}

function ScoresSection({ prospect }: { prospect: ProspectDetail }) {
  const fit = computeScore('fit', prospect.factorRatings)
  const opportunity = computeScore('opportunity', prospect.factorRatings)
  const versionMismatch = prospect.rubricVersion !== RUBRIC_VERSION

  return (
    <Panel title="Score breakdown">
      {versionMismatch ? (
        <p className="mb-3 text-sm text-warning">
          Scored under {prospect.rubricVersion}. The factor points below use the
          current rubric ({RUBRIC_VERSION}); the totals are the stored scores.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreTable kind="fit" stored={prospect.fitScore} breakdown={fit} />
        <ScoreTable
          kind="opportunity"
          stored={prospect.opportunityScore}
          breakdown={opportunity}
        />
      </div>
      <div className="mt-4 border-t border-black/8 pt-4">
        <ProspectMeasureButton prospectId={prospect.id} />
      </div>
      <p className="mt-4 text-sm text-meta">
        Rubric {prospect.rubricVersion}. Strong earns a factor&apos;s full weight,
        weak half, none and unknown nothing. Scores are computed by Vizantir, not
        supplied by the research runner.
      </p>
    </Panel>
  )
}

function factorLabel(key: string): string {
  return isProspectFactor(key) ? FACTOR_DEFINITIONS[key].label : key
}

function EvidenceSection({
  evidence,
  latestRunId,
}: {
  evidence: ProspectEvidenceRow[]
  latestRunId: string | null
}) {
  if (evidence.length === 0) {
    return (
      <Panel title="Evidence">
        <p className="text-sm leading-relaxed text-body">
          No evidence recorded. Every factor for this company is rated unknown.
        </p>
      </Panel>
    )
  }

  return (
    <Panel title="Evidence">
      <ul className="divide-y divide-black/8">
        {evidence.map((item) => (
          <li key={item.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-meta">
              <span className="font-medium text-foreground">
                {factorLabel(item.factorKey)}
              </span>
              <span>{EVIDENCE_KIND_LABELS[item.kind]}</span>
              <time dateTime={item.observedAt} className="tabular-nums">
                Observed {formatShortDate(item.observedAt)}
              </time>
              {item.runId !== latestRunId ? <span>Earlier run</span> : null}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-body">
              {item.claim}
            </p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 inline-block max-w-full truncate align-bottom text-sm text-cobalt-primary transition-colors hover:text-[#1E85FF]"
            >
              {item.sourceUrl}
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
