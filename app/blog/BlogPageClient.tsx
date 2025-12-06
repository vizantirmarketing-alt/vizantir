'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { blogPosts, categories } from '@/lib/blog-data'

export default function BlogPageClient() {
  const { isNightMode } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#888888' : '#6B7280',
    textSubtle: isNightMode ? '#666666' : '#9CA3AF',
    accent: isNightMode ? '#FFC64C' : '#B45309',
    cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
    cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    inputBg: isNightMode ? '#111111' : '#FFFFFF',
    divider: isNightMode
      ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
  }

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesSearch =
        searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        activeCategory === 'All' || post.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  return (
    <main
      className="min-h-screen transition-colors duration-500"
      style={{ background: colors.bg }}
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
            <span
              className="inline-block text-xs tracking-[0.25em] uppercase font-medium mb-4 transition-colors duration-500"
              style={{ color: colors.accent }}
            >
              Blog
            </span>
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
                  background: colors.inputBg,
                  borderColor: colors.cardBorder,
                  color: colors.text,
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
            {['All', ...categories].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  background:
                    activeCategory === category
                      ? colors.accent
                      : isNightMode
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.05)',
                  color:
                    activeCategory === category
                      ? isNightMode
                        ? '#000000'
                        : '#FFFFFF'
                      : colors.textMuted,
                }}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: colors.divider }} />

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
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div
                      className="group h-full p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: colors.cardBg,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      {/* Category & Read Time */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className="text-xs font-medium px-3 py-1 rounded-full transition-colors duration-500"
                          style={{
                            background: isNightMode
                              ? 'rgba(255,198,76,0.1)'
                              : 'rgba(180,83,9,0.1)',
                            color: colors.accent,
                          }}
                        >
                          {post.category}
                        </span>
                        <span
                          className="text-xs transition-colors duration-500"
                          style={{ color: colors.textSubtle }}
                        >
                          {post.readTime}
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
                        className="text-sm leading-relaxed mb-4 transition-colors duration-500"
                        style={{ color: colors.textMuted }}
                      >
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded transition-colors duration-500"
                            style={{
                              background: isNightMode
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.05)',
                              color: colors.textSubtle,
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
      <div className="w-full h-px" style={{ background: colors.divider }} />

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
            Still have questions?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 transition-colors duration-500"
            style={{ color: colors.textMuted }}
          >
            Let's talk about your project. No commitment, no pressure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold transition-all duration-300 hover:scale-105 group"
              style={{
                background: isNightMode ? '#F8F8F8' : '#1A1A1A',
                color: isNightMode ? '#1A1A1A' : '#FFFFFF',
              }}
            >
              <span>Get in Touch</span>
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
