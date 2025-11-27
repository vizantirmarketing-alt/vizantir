export type CanvasVariant = 'gradient' | 'blobs' | 'aurora' | 'particles' | 'threads'

export interface HeroProps {
  title: string | React.ReactNode
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  canvas?: CanvasVariant
  showGlassCards?: boolean
  showGlassSlab?: boolean
  className?: string
}

export interface GlassCardProps {
  icon?: React.ReactNode
  label: string
  description?: string
}

