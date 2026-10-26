'use client'

import { Section } from '@/components/ui/Section'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { trackBookStrategyCall } from '@/lib/analytics'
import { blogCategories } from '@/lib/blog-categories'

const themeBgColorTransition = 'background-color 0.3s ease, color 0.3s ease'

const postDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const monthHeadingFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  month: 'long',
  year: 'numeric',
})

const monthKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
})

export type SanityBlogPostPreview = {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  category?: string
  tags?: string[]
  readTime?: string
  metaDescription?: string
  author?: {
    name: string
    slug: string
  }
}

type Props = {
  posts: SanityBlogPostPreview[]
}

type MonthGroup = {
  key: string
  label: string
  posts: SanityBlogPostPreview[]
}

function postExcerpt(post: SanityBlogPostPreview): string {
  return (post.excerpt ?? post.metaDescription ?? '').trim()
}

function formatPostDate(iso: string): string {
  return postDateFormatter.format(new Date(iso))
}

function monthGroupKey(iso: string): string {
  const parts = monthKeyFormatter.formatToParts(new Date(iso))
  const year = parts.find((part) => part.type === 'year')?.value ?? ''
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  return `${year}-${month}`
}

function groupPostsByMonth(posts: SanityBlogPostPreview[]): MonthGroup[] {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  const groups: MonthGroup[] = []

  for (const post of sorted) {
    const key = monthGroupKey(post.publishedAt)
    const current = groups[groups.length - 1]
    if (current && current.key === key) {
      current.posts.push(post)
      continue
    }

    groups.push({
      key,
      label: monthHeadingFormatter.format(new Date(post.publishedAt)),
      posts: [post],
    })
  }

  return groups
}

export default function BlogPageClient({ posts }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const colors = {
    bg: 'var(--background)',
    text: 'var(--foreground)',
    textMuted: 'var(--muted-foreground)',
    textSubtle: 'var(--muted-foreground)',
    accent: 'var(--cobalt-accent)',
    accentText: 'var(--cobalt-text)',
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const excerpt = post.excerpt ?? ''
      const tags = post.tags ?? []

      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        activeCategory === 'All' || post.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [posts, searchQuery, activeCategory])

  const showLead = activeCategory === 'All' && searchQuery === '' && filteredPosts.length > 0
  const leadPost = showLead ? filteredPosts[0] : undefined

  const listPosts = useMemo(
    () => (showLead ? filteredPosts.slice(1) : filteredPosts),
    [filteredPosts, showLead],
  )

  const monthGroups = useMemo(() => groupPostsByMonth(listPosts), [listPosts])

  let nextRowIndex = 0
  const rowsByMonth = monthGroups.map((group) => ({
    key: group.key,
    label: group.label,
    rows: group.posts.map((post) => {
      const index = nextRowIndex
      nextRowIndex += 1
      return { post, index }
    }),
  }))

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        transition: themeBgColorTransition,
      }}
    >
      <Section size="sm" hero className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-wrap items-end justify-between gap-12">
              <div className="min-w-0 max-w-[720px] flex-1">
                <h1 className="max-w-[720px] text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
                  Web design insights for business owners
                </h1>
                <p className="mt-6 text-lg" style={{ color: colors.textMuted }}>
                  Practical answers to the questions business owners ask most about
                  websites, SEO, performance, and choosing the right platform.
                </p>
              </div>

              <label className="flex w-full shrink-0 items-center gap-2 border-b border-foreground pb-2 md:w-[280px]">
                <span className="sr-only">Search articles</span>
                <svg
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: colors.textSubtle }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none ring-0 placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
                  style={{ color: colors.text }}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="shrink-0"
                    style={{ color: colors.textSubtle }}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </label>
            </div>

            <div className="mt-14 flex flex-wrap items-baseline gap-7 border-b border-[rgba(20,20,19,0.14)] pb-5 text-[13px] font-medium uppercase tracking-[0.12em]">
              {['All', ...blogCategories].map((category) => {
                const active = activeCategory === category
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={
                      active
                        ? 'border-b border-foreground bg-transparent pb-1.5 text-[13px] font-medium uppercase tracking-[0.12em]'
                        : 'bg-transparent text-[13px] font-medium uppercase tracking-[0.12em]'
                    }
                    style={{ color: active ? colors.text : colors.textMuted }}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </Section>

      <Section edge="none" className="px-6 md:px-12 lg:px-20">
        <div className={`mx-auto max-w-6xl pb-24 ${leadPost ? 'pt-14' : ''}`}>
          {leadPost ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href={`/blog/${leadPost.slug}`}
                className="grid gap-8 border-b border-[rgba(20,20,19,0.14)] pb-14 no-underline md:grid-cols-[160px_minmax(0,1fr)]"
              >
                <div>
                  <p
                    className="text-[13px] font-medium uppercase tracking-[0.12em]"
                    style={{ color: colors.accentText }}
                  >
                    {leadPost.category ?? 'Article'}
                  </p>
                  <p className="mt-3 text-sm normal-case" style={{ color: colors.textMuted }}>
                    <time dateTime={leadPost.publishedAt}>{formatPostDate(leadPost.publishedAt)}</time>
                  </p>
                  {leadPost.readTime ? (
                    <p className="text-sm normal-case" style={{ color: colors.textMuted }}>
                      {leadPost.readTime}
                    </p>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h2 className="max-w-[820px] text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
                    {leadPost.title}
                  </h2>
                  {postExcerpt(leadPost) ? (
                    <p
                      className="mt-5 max-w-[760px] text-xl leading-relaxed"
                      style={{ color: colors.textMuted }}
                    >
                      {postExcerpt(leadPost)}
                    </p>
                  ) : null}
                </div>
              </Link>
            </motion.div>
          ) : null}

          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-left"
            >
              <p className="text-lg" style={{ color: colors.textMuted }}>
                No articles found matching your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('All')
                }}
                className="mt-4 text-sm font-medium"
                style={{ color: colors.accentText }}
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            rowsByMonth.map((group) => (
              <div key={group.key}>
                <h3
                  className="mt-14 mb-2 text-[13px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: colors.textMuted }}
                >
                  {group.label}
                </h3>
                {group.rows.map(({ post, index }) => {
                  const excerpt = postExcerpt(post)
                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.05 }}
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group grid items-baseline gap-y-2 border-b border-[rgba(20,20,19,0.09)] py-6 no-underline md:grid-cols-[160px_minmax(0,1fr)_150px] md:gap-8"
                      >
                        <p
                          className="text-[13px] font-medium uppercase tracking-[0.12em]"
                          style={{ color: colors.textMuted }}
                        >
                          {post.category ?? 'Article'}
                        </p>
                        <div className="min-w-0">
                          <p className="text-2xl font-semibold leading-[1.25] transition-colors duration-300 group-hover:text-cobalt-text">
                            {post.title}
                          </p>
                          {excerpt ? (
                            <div className="hidden md:block">
                              <p
                                className="mt-1 line-clamp-1 text-[15px]"
                                style={{ color: colors.textMuted }}
                              >
                                {excerpt}
                              </p>
                            </div>
                          ) : null}
                        </div>
                        <div className="text-[13px] md:hidden" style={{ color: colors.textMuted }}>
                          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                          {post.readTime ? <span> · {post.readTime}</span> : null}
                        </div>
                        <div
                          className="hidden text-right text-[13px] md:block"
                          style={{ color: colors.textMuted }}
                        >
                          <time dateTime={post.publishedAt} className="block">
                            {formatPostDate(post.publishedAt)}
                          </time>
                          {post.readTime ? <span className="block">{post.readTime}</span> : null}
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </Section>

      <Section className="border-t border-[rgba(20,20,19,0.14)] px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-3xl font-bold md:text-4xl"
            style={{ color: colors.text }}
          >
            Want to talk through your project?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
            style={{ color: colors.textMuted }}
          >
            No commitment, no pressure. Just honest advice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              onClick={() => trackBookStrategyCall('blog')}
              className="btn-dark inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-bold group"
            >
              <span>Book a Strategy Call</span>
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </Section>
    </div>
  )
}
