import { Eyebrow } from '@/components/ui/Eyebrow'
import type { AboutHeroContent } from '@/data/about'

interface AboutHeroProps {
  eyebrow: string
  content: AboutHeroContent
}

export default function AboutHero({ eyebrow, content }: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-8 md:px-12 md:pt-28 md:pb-10 lg:px-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(180,83,9,0.05)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(255,198,76,0.08)_0%,transparent_60%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {content.heading}
        </h1>
      </div>
    </section>
  )
}
