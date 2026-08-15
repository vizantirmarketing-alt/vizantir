import type { ReactNode } from 'react'

import type { AboutNarrativeSection } from '@/data/about'

interface AboutSectionProps {
  section: AboutNarrativeSection
  children?: ReactNode
}

export default function AboutSection({ section, children }: AboutSectionProps) {
  return (
    <section className="px-6 py-20 md:px-12 lg:px-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {section.heading}
        </h2>
        <div className="space-y-5">
          {section.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>
        {children}
      </div>
    </section>
  )
}
