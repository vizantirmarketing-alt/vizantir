'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { TextAction } from '@/app/intel/_components/ui/TextAction'
import { Button } from '@/components/ui/button'
import type { Campaign } from '@/lib/briefing/campaigns'
import {
  RUN_EXCLUSIONS_MAX,
  RUN_TARGET_COUNT_MAX,
  RUN_TEXT_MAX,
  formatShortDate,
} from '@/lib/prospects/params'

import {
  createCampaign,
  setCampaignActive,
  updateCampaign,
  type CampaignInput,
} from '@/app/intel/(app)/prospects/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

function readFormString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

function inputFromForm(form: HTMLFormElement): CampaignInput {
  const data = new FormData(form)
  return {
    market: readFormString(data, 'market'),
    industry: readFormString(data, 'industry'),
    targetCount: readFormString(data, 'targetCount'),
    cadenceDays: readFormString(data, 'cadenceDays'),
    exclusions: readFormString(data, 'exclusions'),
  }
}

function cadenceLabel(days: number): string {
  if (days === 1) return 'Daily'
  if (days === 7) return 'Weekly'
  return `Every ${days} days`
}

function CampaignFields({ idPrefix, campaign }: { idPrefix: string; campaign?: Campaign }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_7rem_7rem]">
        <div>
          <label htmlFor={`${idPrefix}-market`} className="mb-2 block intel-body font-medium text-body">
            Market
          </label>
          <input
            id={`${idPrefix}-market`}
            name="market"
            required
            maxLength={RUN_TEXT_MAX}
            defaultValue={campaign?.market}
            placeholder="Las Vegas, NV"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-industry`} className="mb-2 block intel-body font-medium text-body">
            Industry
          </label>
          <input
            id={`${idPrefix}-industry`}
            name="industry"
            required
            maxLength={RUN_TEXT_MAX}
            defaultValue={campaign?.industry}
            placeholder="Law firms"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-count`} className="mb-2 block intel-body font-medium text-body">
            Companies
          </label>
          <input
            id={`${idPrefix}-count`}
            name="targetCount"
            type="number"
            required
            min={1}
            max={RUN_TARGET_COUNT_MAX}
            defaultValue={campaign?.targetCount ?? 10}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-cadence`} className="mb-2 block intel-body font-medium text-body">
            Every (days)
          </label>
          <input
            id={`${idPrefix}-cadence`}
            name="cadenceDays"
            type="number"
            required
            min={1}
            max={90}
            defaultValue={campaign?.cadenceDays ?? 7}
            className={fieldClassName}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-exclusions`} className="mb-2 block intel-body font-medium text-body">
          Exclude domains (optional)
        </label>
        <textarea
          id={`${idPrefix}-exclusions`}
          name="exclusions"
          rows={2}
          defaultValue={campaign?.exclusions.join('\n')}
          placeholder="One per line or comma separated"
          className={fieldClassName}
        />
        <p className="mt-1 intel-secondary text-meta">Up to {RUN_EXCLUSIONS_MAX} domains.</p>
      </div>
    </>
  )
}

function Message({ error }: { error: string | null }) {
  return error === null ? null : (
    <p className="intel-body text-warning-severe" role="alert">
      {error}
    </p>
  )
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = inputFromForm(event.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await updateCampaign(campaign.id, input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEditing(false)
    })
  }

  function onToggle() {
    setError(null)
    startTransition(async () => {
      const result = await setCampaignActive(campaign.id, !campaign.active)
      if (!result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <li className="py-3 first:pt-0 last:pb-0" aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="intel-body font-medium text-foreground">
          {campaign.industry} · {campaign.market} · {campaign.targetCount} companies
        </p>
        <div className="flex items-center gap-3">
          <span className={campaign.active ? 'intel-body text-positive' : 'intel-secondary text-meta'}>
            {campaign.active ? 'Active' : 'Paused'}
          </span>
          <TextAction
            disabled={pending}
            aria-expanded={editing}
            onClick={() => {
              setError(null)
              setEditing((value) => !value)
            }}
          >
            {editing ? 'Close' : 'Edit'}
          </TextAction>
          <TextAction pending={pending} pendingLabel="Saving…" onClick={onToggle}>
            {campaign.active ? 'Pause' : 'Resume'}
          </TextAction>
        </div>
      </div>
      <p className="mt-1 intel-secondary text-meta">
        {cadenceLabel(campaign.cadenceDays)} · last queued{' '}
        {campaign.lastQueuedAt === null ? 'never' : formatShortDate(campaign.lastQueuedAt)}
        {campaign.exclusions.length > 0
          ? ` · excluding ${campaign.exclusions.length} domain${campaign.exclusions.length === 1 ? '' : 's'}`
          : ''}
      </p>
      {editing ? (
        <form onSubmit={onSave} className="mt-3 space-y-3">
          <CampaignFields idPrefix={`campaign-${campaign.id}`} campaign={campaign} />
          <Button type="submit" variant="outline" size="sm" disabled={pending} className="border-black/10">
            {pending ? 'Saving…' : 'Save campaign'}
          </Button>
        </form>
      ) : null}
      <div className="mt-2">
        <Message error={error} />
      </div>
    </li>
  )
}

function NewCampaignForm() {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const input = inputFromForm(form)
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await createCampaign(input)
      if (!result.ok) {
        setError(result.error)
        return
      }
      form.reset()
      setSaved(true)
    })
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-3">
      <CampaignFields idPrefix="campaign-new" />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-cobalt-primary text-white hover:bg-[#1E85FF]"
        >
          {pending ? 'Adding…' : 'Add campaign'}
        </Button>
        {saved ? (
          <p className="intel-secondary text-meta" role="status">
            Campaign added. It queues its first run at the next 7:00 AM Pacific check.
          </p>
        ) : null}
        <Message error={error} />
      </div>
    </form>
  )
}

export function ProspectCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="space-y-5">
      {campaigns.length === 0 ? (
        <p className="intel-body leading-relaxed text-body">
          No scheduled campaigns. A campaign queues a research run on its cadence, checked daily at
          7:00 AM Pacific, and never while one of its runs is still requested or in progress.
        </p>
      ) : (
        <ul className="divide-y divide-black/8">
          {campaigns.map((campaign) => (
            <CampaignRow
              key={`${campaign.id}-${campaign.active}-${campaign.cadenceDays}-${campaign.targetCount}-${campaign.market}-${campaign.industry}`}
              campaign={campaign}
            />
          ))}
        </ul>
      )}
      <div className="border-t border-black/8 pt-4">
        <p className="mb-3 intel-body font-medium text-foreground">New campaign</p>
        <NewCampaignForm />
      </div>
    </div>
  )
}
