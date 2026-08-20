import { AmbientHero } from '@/components/hero/AmbientHero'

const ENGAGEMENT_ARC = [
  'Strategy — business goals, customer behavior, content structure, conversion paths, and technical requirements',
  'Custom design built from that strategy',
  'Development on a hand-coded Next.js stack',
  'Launch with the site ready to operate',
  'Ongoing growth and improvement after launch',
] as const

export default function ServicesHero() {
  return (
    <AmbientHero
      variant="contour"
      compact
      eyebrow="Services"
      headline="Strategy-led websites for established businesses"
      subhead="We figure out what the site needs to do before we design a single page — the business goals, how customers actually behave, the content structure, the conversion paths, and the technical requirements that follow."
    >
      <div className="mt-8 max-w-xl md:mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-cobalt-accent">
          The engagement
        </p>

        <ul className="mb-0 list-none space-y-2 p-0 m-0">
          {ENGAGEMENT_ARC.map((line) => (
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
