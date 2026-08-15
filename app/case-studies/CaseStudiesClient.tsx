'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { trackCTAClick } from '@/lib/analytics'
import type { CaseStudyListItem } from '@/lib/sanity/types'

interface CaseStudiesClientProps {
  caseStudies: CaseStudyListItem[]
}

/**
 * Flip to true once real site screenshots replace the laptop/phone composites
 * currently stored on heroImage in Sanity. Until then every project renders
 * the placeholder treatment so the layout is exact.
 */
const USE_SCREENSHOTS = false

/** next/image requires an absolute URL; Sanity may return protocol-relative `//cdn...` */
function absoluteImageUrl(url: string) {
  const trimmed = url.trim()
  return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
}

function ProjectShot({
  study,
  className,
  sizes,
  priority = false,
}: {
  study: CaseStudyListItem
  className?: string
  sizes: string
  priority?: boolean
}) {
  const url = study.heroImage?.asset?.url

  if (USE_SCREENSHOTS && url) {
    return (
      <Image
        src={absoluteImageUrl(url)}
        alt={study.heroImage?.alt || study.title}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
      />
    )
  }

  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.04)' }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Screenshot
      </span>
    </div>
  )
}

const CaseStudiesClient = ({ caseStudies }: CaseStudiesClientProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const colors = useMemo(
    () => ({
      bg: 'var(--background)',
      text: 'var(--foreground)',
      textMuted: 'var(--muted-foreground)',
      accent: 'var(--cobalt-primary)',
      rule: 'rgba(0,0,0,0.09)',
      cardBg: '#FFFFFF',
      cardBorder: 'rgba(0,0,0,0.08)',
    }),
    [],
  )

  const categories = useMemo(() => {
    const industryList = caseStudies
      .map((cs) => cs.industry)
      .filter((industry): industry is string => Boolean(industry))
    return ['All', ...Array.from(new Set(industryList))]
  }, [caseStudies])

  const filteredStudies =
    selectedCategory === 'All'
      ? caseStudies
      : caseStudies.filter((cs) => cs.industry === selectedCategory)

  return (
    <main className="min-h-screen pt-24 pb-20" style={{ background: colors.bg }}>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <Eyebrow className="mb-5">Our Work</Eyebrow>
            <h1
              className="mb-6 max-w-[16ch] text-5xl font-black leading-[1.02] tracking-[-0.035em] md:text-6xl lg:text-7xl"
              style={{ color: colors.text }}
            >
              Websites We Have Launched
            </h1>
            <p className="max-w-[52ch] text-lg leading-relaxed md:text-xl" style={{ color: colors.textMuted }}>
              Modern websites built to load fast, rank well, and convert visitors
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-x-7 gap-y-3 border-b pb-5"
            style={{ borderColor: colors.rule }}
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm transition-colors duration-200"
                  style={{
                    color: isActive ? colors.accent : colors.textMuted,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {category}
                </button>
              )
            })}
            <span className="ml-auto text-sm tabular-nums" style={{ color: colors.textMuted }}>
              {filteredStudies.length} {filteredStudies.length === 1 ? 'project' : 'projects'}
            </span>
          </motion.div>

          {/* Index */}
          <div className="relative">
            {filteredStudies.map((study, index) => (
              <motion.div
                key={study._id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
              >
                <Link
                  href={`/case-studies/${study.slug}`}
                  className="group relative grid grid-cols-[112px_1fr] items-center gap-6 border-b py-7 transition-[padding] duration-[400ms] ease-[cubic-bezier(.16,.84,.34,1)] md:grid-cols-[132px_1fr_auto] md:gap-10 lg:hover:pl-5"
                  style={{ borderColor: colors.rule }}
                >
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 hidden h-px w-0 -translate-y-1/2 transition-[width] duration-[400ms] ease-[cubic-bezier(.16,.84,.34,1)] lg:block lg:group-hover:w-3"
                    style={{ background: colors.accent }}
                  />

                  {/* Persistent thumbnail */}
                  <div
                    className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-[3px] border"
                    style={{ borderColor: colors.cardBorder, background: colors.cardBg }}
                  >
                    <ProjectShot
                      study={study}
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="132px"
                      priority={index < 3}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2
                      className="mb-2 text-2xl font-bold leading-[1.1] tracking-[-0.025em] transition-colors duration-200 group-hover:text-cobalt-primary md:text-[2.35rem]"
                      style={{ color: colors.text }}
                    >
                      {study.title}
                    </h2>
                    {study.summary ? (
                      <p
                        className="max-w-[54ch] text-[0.95rem] leading-relaxed md:text-base"
                        style={{ color: colors.textMuted }}
                      >
                        {study.summary}
                      </p>
                    ) : null}
                    <span
                      className="mt-3 inline-block text-xs uppercase tracking-[0.16em] md:hidden"
                      style={{ color: colors.textMuted }}
                    >
                      {study.industry}
                    </span>
                  </div>

                  {/* Sector swaps to CTA on hover */}
                  <div className="relative hidden h-6 w-[168px] md:block">
                    <span
                      className="absolute right-0 top-0 whitespace-nowrap text-sm transition-all duration-300 group-hover:translate-x-2.5 group-hover:opacity-0"
                      style={{ color: colors.textMuted }}
                    >
                      {study.industry}
                    </span>
                    <span
                      className="absolute right-0 top-0 inline-flex -translate-x-2.5 items-center gap-2 whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      style={{ color: colors.accent }}
                    >
                      Read case study
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* In-house — Analytir */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="mt-24 rounded-2xl border p-8 md:p-12"
            style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
          >
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
              <div>
                <p className="text-sm uppercase tracking-[0.2em]" style={{ color: colors.accent }}>
                  In-house
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl" style={{ color: colors.text }}>
                  Analytir
                </h2>
                <p className="mt-4 leading-relaxed" style={{ color: colors.textMuted }}>
                  Not client work. A production analytics platform we built and operate ourselves, from
                  Square ingestion through merchant-timezone reconciliation to natural-language SQL. The
                  same engineering goes into every site on this page.
                </p>
                <Link
                  href="/analytir"
                  className="link-cobalt mt-6 inline-flex items-center gap-2 text-sm font-semibold md:text-base"
                  style={{ color: colors.accent }}
                >
                  See what we built
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>

              <dl className="grid grid-cols-2 gap-x-8 gap-y-8">
                {[
                  { value: '79', label: 'API routes' },
                  { value: '27', label: 'Database tables' },
                  { value: '11', label: 'Report archetypes' },
                  { value: '9', label: 'Alert types' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <p className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: colors.text }}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
                        {stat.label}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 text-center"
          >
            <p className="mb-8 text-xl" style={{ color: colors.textMuted }}>
              Ready to grow with a partner who values transparency and measurable results?
            </p>
            <Link
              href="/contact"
              onClick={() => trackCTAClick('start_your_project', 'case_studies')}
              className="bg-cobalt-gradient group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
            >
              Start Your Project
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

export default memo(CaseStudiesClient)
