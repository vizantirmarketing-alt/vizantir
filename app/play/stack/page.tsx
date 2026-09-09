import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Stack | Vizantir Arcade' },
}

export default function StackPage() {
  return (
    <>
      <h1 className="arcade-sr-only">STACK</h1>
      <GameStage game="stack" />
    </>
  )
}
