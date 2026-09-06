import { GameCard } from '@/components/arcade/GameCard'
import { GAMES } from '@/lib/arcade/games'

export function ArcadeLobby() {
  return (
    <section className="arcade-lobby">
      <p className="arcade-lobby-kicker">VIZANTIR</p>
      <h1 className="arcade-lobby-title">ARCADE</h1>
      <p className="arcade-lobby-copy">Four games. Local scores. No excuses.</p>
      <div className="arcade-lobby-grid">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
