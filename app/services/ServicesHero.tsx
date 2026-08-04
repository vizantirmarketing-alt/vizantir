import { AmbientHero } from '@/components/hero/AmbientHero'

const INCLUDED_ITEMS = [
  'Custom design, no templates',
  'Mobile-first development',
  'CMS integration included',
  'URL structure and page hierarchy planned from the start — not added after the fact',
  'Post-launch support available',
] as const

export default function ServicesHero() {
  return (
    <AmbientHero
      variant="contour"
      eyebrow="Services"
      headline="What We Build"
      subhead="Our Las Vegas studio builds custom websites for established businesses. We figure out what the site needs to do before we design a single page."
    >
      <div className="mt-10 max-w-xl md:mt-12">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-cobalt-accent">
          What&apos;s included in every build
        </p>

        <ul className="mb-6 list-none space-y-2 p-0 m-0">
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

        <a
          href="#services"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground group"
        >
          <span>View all services</span>
          <svg
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </AmbientHero>
  )
}
