import Link from 'next/link'

import type { AboutFinalCtaContent } from '@/data/about'

interface AboutCtaProps {
  content: AboutFinalCtaContent
}

export default function AboutCta({ content }: AboutCtaProps) {
  return (
    <section className="px-6 py-20 md:px-12 md:py-24 lg:px-20">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-6 text-pretty text-base text-muted-foreground md:text-lg">
          Think we might be the studio for you?
        </p>
        <Link
          href={content.href}
          className="bg-cobalt-gradient inline-block rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
        >
          {content.label}
        </Link>
      </div>
    </section>
  )
}
