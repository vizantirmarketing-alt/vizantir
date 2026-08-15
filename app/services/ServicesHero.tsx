import { AmbientHero } from '@/components/hero/AmbientHero'

const INCLUDED_ITEMS = [
  'Custom design, no templates',
  'Mobile-first development',
  'CMS integration included',
  'URL structure and page hierarchy planned from the start, not bolted on later',
  'Post-launch support available',
] as const

export default function ServicesHero() {
  return (
    <AmbientHero
      variant="contour"
      compact
      eyebrow="Services"
      headline="What We Build"
      subhead="Our Las Vegas studio builds custom websites for established businesses. We figure out what the site needs to do before we design a single page."
    >
      <div className="mt-8 max-w-xl md:mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-cobalt-accent">
          What&apos;s included in every build
        </p>

        <ul className="mb-0 list-none space-y-2 p-0 m-0">
          {INCLUDED_ITEMS.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-base leading-relaxed text-muted-foreground"
            >
              <span
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cobalt-accent"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </AmbientHero>
  )
}
