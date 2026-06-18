'use client'

import type { AboutNarrativeSection } from '@/data/about'

interface AboutSectionProps {
  section: AboutNarrativeSection
}

export default function AboutSection({ section }: AboutSectionProps) {
  const colors = {
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    accentSolid: 'var(--gold-primary)',
    cardBorder: 'rgba(0,0,0,0.08)',
    budgetAsideBg: 'rgba(0, 112, 243,0.06)',
  }

  if (section.id === 'whatWeBuildOn') {
    return (
      <section className="px-6 py-10 md:px-12 md:py-14 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <div
            className="rounded-2xl border-l-4 py-6 pl-10 pr-5 md:pl-12 md:pr-9"
            style={{
              borderLeftColor: colors.accentSolid,
              background: colors.budgetAsideBg,
              borderTop: `1px solid ${colors.cardBorder}`,
              borderRight: `1px solid ${colors.cardBorder}`,
              borderBottom: `1px solid ${colors.cardBorder}`,
              borderTopRightRadius: '1rem',
              borderBottomRightRadius: '1rem',
            }}
          >
            <h2 className="mb-5 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: colors.text }}>
              {section.heading}
            </h2>
            <div className="space-y-5">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed md:text-lg" style={{ color: colors.textMuted }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="px-6 py-10 md:px-12 md:py-14 lg:px-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {section.heading}
        </h2>
        <div className="space-y-5">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
