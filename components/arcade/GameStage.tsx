'use client'

import dynamic from 'next/dynamic'

import { LoadingBreakout } from '@/components/arcade/BreakoutChrome'
import { LoadingPong } from '@/components/arcade/PongChrome'
import { LoadingSnake } from '@/components/arcade/SnakeChrome'
import { LoadingStack } from '@/components/arcade/StackChrome'
import type { GameId } from '@/lib/arcade/games'

const BreakoutStage = dynamic(
  () => import('@/components/arcade/BreakoutStage').then((mod) => ({ default: mod.BreakoutStage })),
  { ssr: false, loading: () => <LoadingBreakout /> },
)

const StackStage = dynamic(
  () => import('@/components/arcade/StackStage').then((mod) => ({ default: mod.StackStage })),
  { ssr: false, loading: () => <LoadingStack /> },
)

const SnakeStage = dynamic(
  () => import('@/components/arcade/SnakeStage').then((mod) => ({ default: mod.SnakeStage })),
  { ssr: false, loading: () => <LoadingSnake /> },
)

const PongStage = dynamic(
  () => import('@/components/arcade/PongStage').then((mod) => ({ default: mod.PongStage })),
  { ssr: false, loading: () => <LoadingPong /> },
)

export function GameStage({ game }: { game: GameId }) {
  if (game === 'breakout') return <BreakoutStage />
  if (game === 'stack') return <StackStage />
  if (game === 'snake') return <SnakeStage />
  return <PongStage />
}
