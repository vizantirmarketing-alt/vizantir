'use client'

import { useArcade } from '@/components/arcade/ArcadeProvider'

function formatArcadeScore(score: number | undefined): string {
  if (score === undefined) return '-'
  return score.toLocaleString('en-US')
}

function LifeBars({ lives }: { lives: number }) {
  return (
    <span className="arcade-life-bars" aria-label={`${lives} lives`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={index < lives ? 'arcade-life-bar is-on' : 'arcade-life-bar'} />
      ))}
    </span>
  )
}

export function ScoreDisplay() {
  const { currentGame, bestScores, hud } = useArcade()

  if (!currentGame) return null

  const best = bestScores[currentGame]

  return (
    <div className="arcade-score">
      {hud ? (
        <>
          {hud.opponentScore !== undefined ? (
            <>
              <span className="arcade-score-pair">
                <span className="arcade-score-label">YOU</span>
                <span className="arcade-score-value">{formatArcadeScore(hud.score)}</span>
              </span>
              <span className="arcade-score-pair">
                <span className="arcade-score-label">CPU</span>
                <span className="arcade-score-value">{formatArcadeScore(hud.opponentScore)}</span>
              </span>
            </>
          ) : (
            <span className="arcade-score-pair">
              <span className="arcade-score-label">SCORE</span>
              <span className="arcade-score-value">{formatArcadeScore(hud.score)}</span>
            </span>
          )}
          <span className="arcade-score-pair">
            <span className="arcade-score-label">BEST</span>
            <span className="arcade-score-value">{formatArcadeScore(best)}</span>
          </span>
          {hud.lives !== undefined ? (
            <span className="arcade-score-pair">
              <span className="arcade-score-label">LIVES</span>
              <LifeBars lives={hud.lives} />
            </span>
          ) : null}
          {hud.lines !== undefined ? (
            <span className="arcade-score-pair">
              <span className="arcade-score-label">LINES</span>
              <span className="arcade-score-value">{formatArcadeScore(hud.lines)}</span>
            </span>
          ) : null}
          {hud.length !== undefined ? (
            <span className="arcade-score-pair">
              <span className="arcade-score-label">LENGTH</span>
              <span className="arcade-score-value">{formatArcadeScore(hud.length)}</span>
            </span>
          ) : null}
          {hud.level !== undefined ? (
            <span className="arcade-score-pair">
              <span className="arcade-score-label">LEVEL</span>
              <span className="arcade-score-value">{hud.level}</span>
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span className="arcade-score-label">BEST</span>
          <span className="arcade-score-value">{formatArcadeScore(best)}</span>
        </>
      )}
    </div>
  )
}

export function StageHud() {
  const { currentGame, bestScores, hud } = useArcade()
  if (!currentGame || !hud) return null
  const best = bestScores[currentGame]

  return (
    <div className="arcade-stage-hud">
      <span>
        <span className="arcade-score-label">SCORE</span> {formatArcadeScore(hud.score)}
      </span>
      <span>
        <span className="arcade-score-label">BEST</span> {formatArcadeScore(best)}
      </span>
      {hud.lives !== undefined ? (
        <span className="arcade-stage-hud-lives">
          <span className="arcade-score-label">LIVES</span>
          <LifeBars lives={hud.lives} />
        </span>
      ) : null}
      {hud.lines !== undefined ? (
        <span>
          <span className="arcade-score-label">LINES</span> {formatArcadeScore(hud.lines)}
        </span>
      ) : null}
      {hud.length !== undefined ? (
        <span>
          <span className="arcade-score-label">LENGTH</span> {formatArcadeScore(hud.length)}
        </span>
      ) : null}
      {hud.level !== undefined ? (
        <span>
          <span className="arcade-score-label">LEVEL</span> {hud.level}
        </span>
      ) : null}
    </div>
  )
}
