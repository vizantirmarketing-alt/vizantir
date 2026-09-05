'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { SitemapLink } from '@/data/sitemap-page'
import type { SitemapPageItem } from '@/lib/sanity/types'

type Props = {
  mainPages: SitemapLink[]
  industryPages: SitemapLink[]
  landingPages: SitemapLink[]
  technologyPages: SitemapLink[]
  legalPages: SitemapLink[]
  services: SitemapPageItem[]
  caseStudies: SitemapPageItem[]
  posts: SitemapPageItem[]
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-6">
      <Eyebrow align="start">{label}</Eyebrow>
    </div>
  )
}

function LinkList({ links }: { links: SitemapLink[] }) {
  return (
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="link-cobalt text-muted-foreground"
          >
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function SitemapPageClient({
  mainPages,
  industryPages,
  landingPages,
  technologyPages,
  legalPages,
  services,
  caseStudies,
  posts,
}: Props) {
  const postCount = posts.length

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <section className="px-4 pb-8 pt-32">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">Sitemap</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              This page lists every public page on Vizantir&apos;s site, organized by section.
              Marketing pages, industries, technology, services, case studies, blog posts,
              and legal resources.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <SectionHeading label="Main Pages" />
              <LinkList links={mainPages} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <SectionHeading label="Industries" />
              <LinkList links={industryPages} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
            >
              <SectionHeading label="Landing Pages" />
              <LinkList links={landingPages} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.17 }}
            >
              <SectionHeading label="Technology" />
              <LinkList links={technologyPages} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SectionHeading label="Services" />
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/services/${service.slug}`}
                      className="link-cobalt text-muted-foreground"
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <SectionHeading label="Our Work" />
              <ul className="space-y-3">
                {caseStudies.map((study) => (
                  <li key={study.slug}>
                    <Link
                      href={`/case-studies/${study.slug}`}
                      className="link-cobalt text-muted-foreground"
                    >
                      {study.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <SectionHeading label="Blog" />
              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none text-muted-foreground transition-colors hover:text-cobalt-accent [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-foreground">
                    Show all {postCount} posts
                  </span>
                  <span className="ml-2 text-sm text-muted-foreground">(collapsed)</span>
                </summary>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="link-cobalt text-sm text-muted-foreground"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
              <p className="mt-3 text-sm">
                <Link
                  href="/blog"
                  className="link-cobalt text-muted-foreground"
                >
                  View blog index →
                </Link>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <SectionHeading label="Legal" />
              <LinkList links={legalPages} />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
