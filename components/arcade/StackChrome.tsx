'use client'

export function LoadingStack() {
  return (
    <div className="arcade-stage-placeholder">
      <p className="arcade-stage-title">LOADING STACK</p>
      <p className="arcade-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
    </div>
  )
}

export function StackFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="arcade-overlay" role="alert">
      <p className="arcade-overlay-title">STACK FAILED TO START</p>
      <div className="arcade-overlay-actions">
        <button type="button" className="arcade-overlay-btn" onClick={onRetry}>
          RETRY
        </button>
        <a href="/play" className="arcade-overlay-btn">
          BACK TO ARCADE
        </a>
      </div>
    </div>
  )
}
