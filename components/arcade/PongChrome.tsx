'use client'

import Link from 'next/link'

export function LoadingPong() {
  return (
    <div className="arcade-stage-placeholder">
      <p className="arcade-stage-title">LOADING PONG</p>
      <p className="arcade-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
    </div>
  )
}

export function PongFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="arcade-overlay" role="alert">
      <p className="arcade-overlay-title">PONG FAILED TO START</p>
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
