export function ArcadeBackdrop({ contained = false }: { contained?: boolean }) {
  return (
    <div className={contained ? 'arcade-backdrop is-contained' : 'arcade-backdrop'} aria-hidden="true">
      <div className="arcade-backdrop-base" />
      <div className="arcade-backdrop-horizon" />
      <div className="arcade-backdrop-grid" />
      <div className="arcade-backdrop-scan" />
      <div className="arcade-backdrop-vignette" />
      <div className="arcade-backdrop-grain" />
    </div>
  )
}
