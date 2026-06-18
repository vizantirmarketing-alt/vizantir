'use client'

import { memo, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink } from 'lucide-react'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { shouldShowCaseStudyClient } from '@/lib/case-studies/metadata'
import { trackCTAClick } from '@/lib/analytics'
import type { CaseStudyListItem } from '@/lib/sanity/types'

interface CaseStudiesClientProps {
  caseStudies: CaseStudyListItem[]
}

/** next/image requires an absolute URL; Sanity may return protocol-relative `//cdn...` */
function absoluteImageUrl(url: string) {
  const trimmed = url.trim()
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return trimmed
}

const CaseStudiesClient = ({ caseStudies }: CaseStudiesClientProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const colors = useMemo(
    () => ({
      bg: '#FAF9F5',
      text: '#1A1A1A',
      textMuted: '#6B6B6B',
      accent: 'var(--gold-primary)',
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

  const filteredStudies = selectedCategory === 'All' ? caseStudies : caseStudies.filter((cs) => cs.industry === selectedCategory)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const },
    },
  }

  return (
    <main
      className="min-h-screen pt-24 pb-20 transition-colors duration-500"
      style={{ background: colors.bg }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <Eyebrow className="mb-4">Our Work</Eyebrow>
            <h1
              className="mb-6 text-4xl font-black tracking-tight transition-colors duration-500 md:text-5xl lg:text-6xl"
              style={{ color: colors.text }}
            >
              Websites We Have Launched
            </h1>
            <p className="mx-auto max-w-2xl text-lg transition-colors duration-500 md:text-xl" style={{ color: colors.textMuted }}>
              Modern websites built to load fast, rank well, and convert visitors
            </p>
          </motion.div>

          {/* Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16 flex flex-wrap items-center justify-center gap-3"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300"
                style={{
                  background:
                    selectedCategory === category
                      ? colors.accent
                      : 'rgba(0, 0, 0, 0.05)',
                  color:
                    selectedCategory === category
                      ? '#1A1A1A'
                      : '#1A1A1A',
                  border:
                    selectedCategory === category
                      ? 'none'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                }}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Case Studies Grid */}
          <motion.div
            key={selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16"
          >
            {filteredStudies.map((study, index) => (
              <motion.div
                key={study._id}
                variants={itemVariants}
                className="card-interactive group flex h-full flex-col rounded-2xl border p-6"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.cardBorder,
                }}
              >
                {study.heroImage?.asset?.url ? (
                  <div
                    className="relative mb-6 w-full shrink-0 overflow-hidden rounded-xl border p-px"
                    style={{
                      height: '400px',
                      width: '100%',
                      borderColor: colors.cardBorder,
                      background: colors.cardBg,
                    }}
                  >
                    <Image
                      src={absoluteImageUrl(study.heroImage.asset.url)}
                      alt={study.heroImage.alt || study.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={index < 2}
                    />
                  </div>
                ) : null}

                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  {study.industry ? (
                    <p className="text-sm uppercase tracking-[0.2em]" style={{ color: colors.accent }}>
                      {study.industry}
                    </p>
                  ) : null}
                  <h3
                    className="text-2xl font-bold transition-colors duration-300 group-hover:text-gold-primary md:text-3xl"
                    style={{ color: colors.text }}
                  >
                    {study.title}
                  </h3>
                  {shouldShowCaseStudyClient(study.title, study.client) ? (
                    <p className="text-sm font-medium uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
                      {study.client}
                    </p>
                  ) : null}
                  {study.summary ? (
                    <p className="leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                      {study.summary}
                    </p>
                  ) : null}
                  {study.stack?.length ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {study.stack.map((item) => (
                        <span
                          key={item}
                          className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-500"
                          style={{
                            background: 'rgba(0, 0, 0, 0.05)',
                            color: colors.textMuted,
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div
                  className="mt-6 flex flex-col gap-4 border-t pt-5"
                  style={{ borderColor: colors.cardBorder }}
                >
                  {study.siteUrl ? (
                    <a
                      href={study.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-cobalt inline-flex items-center gap-2 text-sm font-semibold md:text-base"
                      style={{ color: colors.accent }}
                    >
                      Visit live site
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    </a>
                  ) : null}
                  <Link
                    href={`/case-studies/${study.slug}`}
                    className="link-cobalt inline-flex items-center gap-2 text-sm font-semibold md:text-base"
                    style={{ color: colors.accent }}
                  >
                    Read case study
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 text-center"
          >
            <p className="mb-8 text-xl transition-colors duration-500" style={{ color: colors.textMuted }}>
              Ready to grow with a partner who values transparency and measurable results?
            </p>

            <Link
              href="/contact"
              onClick={() => trackCTAClick('start_your_project', 'case_studies')}
              className="bg-gold-gradient group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-gold"
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
