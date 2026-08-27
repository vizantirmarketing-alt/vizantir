'use client'

import { useState, useTransition, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  generateReportAnalysis,
  sendReviewedReport,
  updateReportReviewFields,
} from '@/app/intel/reports/actions'

const fieldClassName =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-foreground transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cobalt-focus'

type ReportReviewControlsProps = {
  reportId: string
  analysis: string
  workCompleted: string
}

export function ReportReviewControls({
  reportId,
  analysis,
  workCompleted,
}: ReportReviewControlsProps) {
  const [analysisValue, setAnalysisValue] = useState(analysis)
  const [workValue, setWorkValue] = useState(workCompleted)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savePending, startSave] = useTransition()
  const [sendPending, startSend] = useTransition()
  const [generatePending, startGenerate] = useTransition()
  const pending = savePending || sendPending || generatePending

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setSaveError(null)
    setSendError(null)
    setGenerateError(null)
    setSaved(false)
    startSave(async () => {
      const result = await updateReportReviewFields(
        reportId,
        analysisValue,
        workValue,
      )
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setSaved(true)
    })
  }

  function onSend() {
    if (pending) {
      return
    }

    setSaveError(null)
    setSendError(null)
    setGenerateError(null)
    startSend(async () => {
      const savedFields = await updateReportReviewFields(
        reportId,
        analysisValue,
        workValue,
      )
      if (!savedFields.ok) {
        setSendError(savedFields.error)
        return
      }

      const result = await sendReviewedReport(reportId)
      if (!result.ok) {
        setSendError(result.error)
      }
    })
  }

  function onDraft() {
    if (pending) {
      return
    }
    if (
      analysisValue.trim().length > 0 &&
      !window.confirm('Replace the current analysis with a new draft?')
    ) {
      return
    }

    setSaveError(null)
    setSendError(null)
    setGenerateError(null)
    setSaved(false)
    startGenerate(async () => {
      const result = await generateReportAnalysis(reportId)
      if (!result.ok) {
        setGenerateError(result.error)
        return
      }
      setAnalysisValue(result.text)
    })
  }

  return (
    <form onSubmit={onSave} aria-busy={pending} className="mt-5 space-y-4">
      <p className="text-sm leading-relaxed text-body">
        Care reports stay pending until you add a narrative and send.
      </p>

      <div>
        <label
          htmlFor="report-analysis"
          className="mb-2 block text-sm font-medium text-body"
        >
          Analysis
        </label>
        <textarea
          id="report-analysis"
          name="analysis"
          rows={5}
          maxLength={20000}
          value={analysisValue}
          disabled={pending}
          onChange={(event) => {
            setAnalysisValue(event.target.value)
            setSaved(false)
            setSaveError(null)
            setGenerateError(null)
          }}
          className={cn(fieldClassName, 'min-h-[8rem] resize-y')}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onDraft}
          className="mt-2 border-black/10"
        >
          {generatePending ? 'Drafting…' : 'Draft recommendations'}
        </Button>
      </div>

      <div>
        <label
          htmlFor="report-work-completed"
          className="mb-2 block text-sm font-medium text-body"
        >
          Work completed
        </label>
        <textarea
          id="report-work-completed"
          name="workCompleted"
          rows={5}
          maxLength={20000}
          value={workValue}
          disabled={pending}
          onChange={(event) => {
            setWorkValue(event.target.value)
            setSaved(false)
            setSaveError(null)
          }}
          className={cn(fieldClassName, 'min-h-[8rem] resize-y')}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="border-black/10"
        >
          {savePending ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={onSend}
        >
          {sendPending ? 'Sending…' : 'Send report'}
        </Button>
        {saved && saveError === null ? (
          <p className="text-sm text-positive">Saved</p>
        ) : null}
      </div>

      {saveError ? (
        <p className="text-sm text-warning-severe" role="alert">
          {saveError}
        </p>
      ) : null}
      {sendError ? (
        <p className="text-sm text-warning-severe" role="alert">
          {sendError}
        </p>
      ) : null}
      {generateError ? (
        <p className="text-sm text-warning-severe" role="alert">
          {generateError}
        </p>
      ) : null}
    </form>
  )
}
