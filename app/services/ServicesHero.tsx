/*
  ServicesHero — site-wide centered hero pattern (Eyebrow + headline + subhead),
  with left-aligned “what’s included” content centered as a block below.
*/

import { Eyebrow } from '@/components/ui/Eyebrow'

export default function ServicesHero() {
  const colors = {
    bg: 'var(--background)',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    accent: 'var(--cobalt-accent)',
  }

  return (
    <section
      className="relative w-full px-6 pt-28 pb-16 md:px-12 md:pt-32 md:pb-20 lg:px-20 lg:pt-36 lg:pb-24"
      style={{ background: colors.bg }}
    >
      <div className="mx-auto w-full max-w-4xl text-center">
        <div className="mb-6">
          <Eyebrow>Services</Eyebrow>
        </div>

        <h1
          className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
          style={{ color: colors.text }}
        >
          What We Build
        </h1>

        <p
          className="mx-auto max-w-2xl text-lg leading-relaxed md:text-xl"
          style={{ color: colors.textMuted }}
        >
          Our Las Vegas studio builds custom websites for established businesses. We figure out what the site needs to do before we design a single page.
        </p>
      </div>

      <div className="mx-auto mt-10 w-full max-w-xl text-left md:mt-12">
        <p
          className="mb-3 text-xs font-medium uppercase tracking-[0.25em]"
          style={{ color: colors.accent }}
        >
          What&apos;s included in every build
        </p>

        <ul className="mb-6 list-none space-y-2 p-0 m-0">
          {[
            'Custom design, no templates',
            'Mobile-first development',
            'CMS integration included',
            'URL structure and page hierarchy planned from the start — not added after the fact',
            'Post-launch support available',
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-base leading-relaxed"
              style={{ color: colors.textMuted }}
            >
              <span
                className="mt-2 h-1 w-1 shrink-0 rounded-full"
                style={{ background: colors.accent }}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <p
          className="inline-flex items-center gap-2 text-sm font-medium group"
          style={{ color: colors.text }}
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
        </p>
      </div>
    </section>
  )
}
