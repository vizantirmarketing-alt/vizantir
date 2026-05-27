import Link from 'next/link'

import type { AboutFinalCtaContent } from '@/data/about'

interface AboutCtaProps {
  content: AboutFinalCtaContent
}

export default function AboutCta({ content }: AboutCtaProps) {
  return (
    <section className="px-6 pt-4 pb-14 md:px-12 md:pb-16 lg:px-20">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-6 text-base text-muted-foreground md:text-lg">Think we might be the studio for you?</p>
        <Link
          href={content.href}
          className="inline-block rounded-xl px-8 py-4 text-base font-semibold text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: 'var(--gold-gradient)',
            boxShadow: 'var(--gold-shadow)',
          }}
        >
          {content.label}
        </Link>
      </div>
    </section>
  )
}
