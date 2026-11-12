'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { SETTINGS_ADDRESS_MAX, SETTINGS_TEXT_MAX } from '@/lib/outreach/params'
import type { OutreachSettings } from '@/lib/outreach/types'

import { saveOutreachSettings } from '@/app/intel/(app)/outreach/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 intel-body text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

const FIELDS: { key: keyof Omit<OutreachSettings, 'postalAddress'>; label: string; type: string; autoComplete: string }[] = [
  { key: 'senderName', label: 'Sender name', type: 'text', autoComplete: 'name' },
  { key: 'studioName', label: 'Studio name', type: 'text', autoComplete: 'organization' },
  { key: 'replyToEmail', label: 'Reply-to email', type: 'email', autoComplete: 'email' },
]

export function OutreachSettingsForm({ settings }: { settings: OutreachSettings | null }) {
  const [values, setValues] = useState<OutreachSettings>(
    settings ?? { senderName: '', studioName: '', replyToEmail: '', postalAddress: '' },
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveOutreachSettings(values)
      if (result.ok) setSaved(true)
      else setError(result.error)
    })
  }

  const set = (key: keyof OutreachSettings, value: string) => {
    setSaved(false)
    setValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-3">
      <div className="grid gap-3 @min-[36rem]:grid-cols-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="min-w-0">
            <label htmlFor={`outreach-${field.key}`} className="mb-2 block intel-body font-medium text-body">
              {field.label}
            </label>
            <input
              id={`outreach-${field.key}`}
              type={field.type}
              autoComplete={field.autoComplete}
              value={values[field.key]}
              maxLength={SETTINGS_TEXT_MAX}
              onChange={(event) => set(field.key, event.target.value)}
              className={fieldClassName}
            />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="outreach-postalAddress" className="mb-2 block intel-body font-medium text-body">
          Postal mailing address
        </label>
        <textarea
          id="outreach-postalAddress"
          rows={3}
          value={values.postalAddress}
          maxLength={SETTINGS_ADDRESS_MAX}
          onChange={(event) => set('postalAddress', event.target.value)}
          className={fieldClassName}
        />
        <p className="mt-1 intel-secondary text-meta">
          Required. It goes in the footer of every email, with the sender and studio name.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} className="bg-cobalt-primary intel-secondary text-white hover:bg-[#1E85FF]">
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
        {saved ? (
          <p className="intel-body text-body" role="status">
            Saved.
          </p>
        ) : null}
        {error !== null ? (
          <p className="intel-body text-warning-severe" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
