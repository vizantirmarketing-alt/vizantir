'use client'

import Link from 'next/link'

export function LoadingBreakout() {
  return (
    <div className="arcade-stage-placeholder">
      <p className="arcade-stage-title">LOADING BREAKOUT</p>
      <p className="arcade-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
    </div>
  )
}

export function BreakoutFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="arcade-overlay" role="alert">
      <p className="arcade-overlay-title">BREAKOUT FAILED TO START</p>
      <div className="arcade-overlay-actions">
        <button type="button" className="arcade-overlay-btn" onClick={onRetry}>
          RETRY
        </button>
        <Link href="/play" className="arcade-overlay-btn">
          BACK TO ARCADE
        </Link>
      </div>
    </div>
  )
}
