'use client'

import { Section } from '@/components/ui/Section'
import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PortableText } from '@portabletext/react'
import { ArrowRight, ExternalLink } from 'lucide-react'

import { hasPortableTextContent, vizantirPortableTextComponents } from '@/components/portable-text'
import { formatCaseStudyMetadataLine } from '@/lib/case-studies/metadata'
import type { CaseStudy } from '@/lib/sanity/types'

interface CaseStudyPageContentProps {
  caseStudy: CaseStudy
}

export default function CaseStudyPageContent({ caseStudy }: CaseStudyPageContentProps) {
  const colors = useMemo(
    () => ({
      bg: 'var(--background)',
      text: 'var(--foreground)',
      textMuted: 'var(--muted-foreground)',
      accent: 'var(--cobalt-text)',
      cardBg: '#FFFFFF',
      cardBorder: 'rgba(0,0,0,0.08)',
      divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
    }),
    [],
  )

  const metadataLine = formatCaseStudyMetadataLine(caseStudy.title, caseStudy.client, caseStudy.industry)
  const isStudio = caseStudy.projectType === 'studio'

  const hasChallenge = hasPortableTextContent(caseStudy.challenge)
  const hasSolution = hasPortableTextContent(caseStudy.solution)
  const hasResults = hasPortableTextContent(caseStudy.results)
  const hasStack = Array.isArray(caseStudy.stack) && caseStudy.stack.length > 0

  return (
    <div style={{ background: colors.bg }} className="min-h-screen transition-colors duration-500">
      <Section hero className="relative px-6 md:px-12 lg:px-20 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(0, 112, 243,0.18), transparent 55%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <Link
            href="/case-studies"
            className="link-ui mb-8 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: colors.textMuted }}
          >
            <span aria-hidden>←</span>
            All case studies
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1 className="font-bold tracking-tight md:text-5xl lg:text-6xl" style={{ color: colors.text }}>
              {caseStudy.title}
            </h1>
            {isStudio || metadataLine ? (
              <p className="mt-5 text-sm uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
                {isStudio ? (
                  <span className="mr-3 inline-block">Studio Project</span>
                ) : null}
                {metadataLine ? <span>{metadataLine}</span> : null}
              </p>
            ) : null}
            {caseStudy.summary ? (
              <p className="mt-6 max-w-[48ch] text-lg leading-relaxed" style={{ color: colors.textMuted }}>
                {caseStudy.summary}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {caseStudy.siteUrl ? (
                <a
                  href={caseStudy.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-ui inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: colors.accent }}
                >
                  Visit live site
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </motion.div>
          {caseStudy.heroImage?.asset?.url ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mt-10 overflow-hidden rounded-2xl border"
              style={{ borderColor: colors.cardBorder, background: colors.cardBg }}
            >
              <img
                src={caseStudy.heroImage.asset.url}
                alt={caseStudy.heroImage.alt || caseStudy.title}
                className="h-auto w-full"
              />
            </motion.div>
          ) : null}
        </div>
      </Section>

      <div className="h-px w-full" style={{ background: colors.divider }} />

      {hasChallenge ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="mb-8 font-bold md:text-4xl" style={{ color: colors.text }}>
                  The problem to solve
                </h2>
                <PortableText value={caseStudy.challenge!} components={vizantirPortableTextComponents} />
              </motion.div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {hasSolution ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="mb-8 font-bold md:text-4xl" style={{ color: colors.text }}>
                  What we built
                </h2>
                <PortableText value={caseStudy.solution!} components={vizantirPortableTextComponents} />
              </motion.div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {hasResults ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <h2 className="mb-8 font-bold md:text-4xl" style={{ color: colors.text }}>
                  Impact and outcomes
                </h2>
                <PortableText value={caseStudy.results!} components={vizantirPortableTextComponents} />
              </motion.div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      {hasStack ? (
        <>
          <Section className="px-6 md:px-12 lg:px-20">
            <div className="mx-auto max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="mb-[var(--heading-gap)] text-center md:text-left"
              >
                <h2 className="font-bold md:text-4xl" style={{ color: colors.text }}>
                  Technologies used
                </h2>
              </motion.div>
              <div className="flex flex-wrap gap-3">
                {caseStudy.stack!.map((item, index) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="rounded-full border px-4 py-2 text-sm font-medium"
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: colors.textMuted,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          </Section>
          <div className="h-px w-full" style={{ background: colors.divider }} />
        </>
      ) : null}

      <Section size="lg" className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-base font-semibold transition-colors hover:opacity-80"
            style={{ color: colors.accent }}
          >
            Back to case studies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>
    </div>
  )
}
