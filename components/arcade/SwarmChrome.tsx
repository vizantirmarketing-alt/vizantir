'use client'

export function LoadingSwarm() {
  return (
    <div className="arcade-stage-placeholder">
      <p className="arcade-stage-title">LOADING SWARM</p>
      <p className="arcade-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </p>
    </div>
  )
}

export function SwarmFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="arcade-overlay" role="alert">
      <p className="arcade-overlay-title">SWARM FAILED TO START</p>
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
