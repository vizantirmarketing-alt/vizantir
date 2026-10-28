import { Section } from '@/components/ui/Section'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function SearchReadiness() {
  return (
    <Section className="px-6 transition-colors duration-500 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-[var(--heading-gap)] text-balance font-black tracking-tight text-foreground md:text-4xl">
          Built so Google can read it
        </h2>
        <div className="max-w-[48ch] space-y-[var(--para-gap)]">
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">
            Most websites are built to look right and nothing more. Open the code and there&apos;s no heading structure, no page titles worth reading, no descriptions, no structured data, nothing that tells Google what the page is about. The site exists, but search engines can&apos;t make sense of it.
          </p>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">
            We build the other way. Every page ships with one clear H1, headings that follow the content, a title and description written for that page, structured data, clean URLs, a sitemap, and load times in the green. That&apos;s the technical SEO setup, and it&apos;s included in every tier. It isn&apos;t a package you buy afterward. It&apos;s how the site is written in the first place, so Google can index it properly from day one.
          </p>
        </div>
        <Link
          href="/services/website-strategy"
          className="link-ui group mt-[var(--cta-gap)] inline-flex items-center gap-2 font-medium text-cobalt-text"
        >
          <span>How we plan a site around search</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </Section>
  )
}
