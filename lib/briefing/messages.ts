/**
 * Plain-language explanations for the owner. Pure. Internal reason codes
 * (stored in daily_briefings.error for diagnosis) are never shown directly.
 */

/** Why a briefing has no summary. The sections are always complete. */
export function summaryUnavailableMessage(error: string | null): string {
  const reason = error ?? ''
  if (reason === 'model_not_configured') {
    return 'There is no summary today because the summary service is not set up yet. Everything below is complete.'
  }
  if (reason.startsWith('model_call_failed') || reason === 'model_output_empty') {
    return 'There is no summary today because the summary service did not respond. Everything below is complete; use Generate now to try again.'
  }
  if (reason === 'model_output_truncated' || reason.startsWith('invalid_output')) {
    return 'There is no summary today because the summary that came back could not be used. Everything below is complete; use Generate now to try again.'
  }
  return 'There is no summary for this briefing. Everything below is complete.'
}

/** Why a briefing failed outright. */
export function briefingFailedMessage(error: string | null): string {
  if (error === 'all_sources_unavailable') {
    return 'This briefing could not load any of its data, so every section below is unavailable. Use Generate now to try again.'
  }
  return 'This briefing could not be completed. Use Generate now to try again.'
}
