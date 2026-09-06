import type { Metadata } from 'next'

import { GameStage } from '@/components/arcade/GameStage'

export const metadata: Metadata = {
  title: { absolute: 'Stack | Vizantir Arcade' },
}

export default function StackPage() {
  return <GameStage game="stack" />
}
