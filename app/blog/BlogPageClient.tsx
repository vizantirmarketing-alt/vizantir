'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { blogCategories } from '@/lib/blog-categories'

const themeBgColorTransition = 'background-color 0.3s ease, color 0.3s ease'

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

export default function BlogPageClient({ posts }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const colors = {
    bg: '#FAF9F5',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: 'var(--gold-accent)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
    inputBg: '#FFFFFF',
    divider: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
  }

  // Filter posts based on search and category
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

  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: colors.bg,
        transition: themeBgColorTransition,
      }}
    >
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-20 pt-32 pb-16">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Eyebrow className="mb-4">Blog</Eyebrow>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 transition-colors duration-500"
              style={{ color: colors.text }}
            >
              Insights & Guides
            </h1>
            <p
              className="text-lg max-w-2xl mx-auto transition-colors duration-500"
              style={{ color: colors.textMuted }}
            >
              Practical answers to the questions business owners ask most about
              websites, SEO, performance, and choosing the right platform.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 pl-12 rounded-xl border outline-none transition-all duration-300 focus:ring-2"
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                  transition: themeBgColorTransition,
                  // @ts-ignore
                  '--tw-ring-color': colors.accent,
                }}
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-500"
                style={{ color: colors.textSubtle }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors duration-300 hover:bg-opacity-10"
                  style={{ color: colors.textSubtle }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {['All', ...blogCategories].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  background:
                    activeCategory === category
                      ? colors.accent
                      : 'rgba(0,0,0,0.05)',
                  color:
                    activeCategory === category
                      ? '#FFFFFF'
                      : colors.textMuted,
                  transition: themeBgColorTransition,
                }}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{ background: colors.divider, transition: themeBgColorTransition }}
      />

      {/* Blog Posts Grid */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p
                className="text-lg transition-colors duration-500"
                style={{ color: colors.textMuted }}
              >
                No articles found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('All')
                }}
                className="mt-4 text-sm font-medium transition-colors duration-300"
                style={{ color: colors.accent }}
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div
                      className="card-interactive group h-full p-6 rounded-2xl border"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      {/* Category & Read Time */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-500"
                          style={{
                            background: 'rgba(0, 112, 243,0.1)',
                            color: colors.accent,
                            transition: themeBgColorTransition,
                          }}
                        >
                          {post.category ?? 'Article'}
                        </span>
                        <span
                          className="text-xs transition-colors duration-500"
                          style={{ color: colors.textSubtle }}
                        >
                          {post.readTime ?? ''}
                        </span>
                      </div>

                      {/* Title */}
                      <h2
                        className="text-xl font-bold mb-3 leading-snug transition-colors duration-500 group-hover:opacity-80"
                        style={{ color: colors.text }}
                      >
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p
                        className="text-sm leading-relaxed mb-3 transition-colors duration-500"
                        style={{ color: colors.textMuted }}
                      >
                        {post.excerpt ?? post.metaDescription ?? ''}
                      </p>

                      {post.author?.name ? (
                        <p
                          className="text-xs mb-4 transition-colors duration-500"
                          style={{ color: colors.textSubtle }}
                        >
                          {post.author.name}
                        </p>
                      ) : null}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded transition-colors duration-500"
                            style={{
                              background: 'rgba(0,0,0,0.05)',
                              color: colors.textSubtle,
                              transition: themeBgColorTransition,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Read More */}
                      <div
                        className="flex items-center gap-2 text-sm font-medium transition-colors duration-300"
                        style={{ color: colors.accent }}
                      >
                        <span>Read article</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{ background: colors.divider, transition: themeBgColorTransition }}
      />

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-6 transition-colors duration-500"
            style={{ color: colors.text }}
          >
            Want to talk through your project?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 transition-colors duration-500"
            style={{ color: colors.textMuted }}
          >
            No commitment, no pressure — just honest advice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              className="btn-dark inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold group"
            >
              <span>Book a Strategy Call</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
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
      </section>
    </main>
  )
}
