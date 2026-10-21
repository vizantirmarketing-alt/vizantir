import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from '@/lib/og/card'

export const alt = 'Web Design Insights for Business Owners | Vizantir'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgCard({ title: 'Web Design Insights for Business Owners' })
}
