'use client'

export function OfflineRetryButton() {
  return (
    <button type="button" className="arcade-overlay-btn" onClick={() => location.reload()}>
      TRY AGAIN
    </button>
  )
}
