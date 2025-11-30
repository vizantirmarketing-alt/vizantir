'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getRelatedPosts, type BlogPost } from '@/lib/blog-data'

interface BlogPostContentProps {
  post: BlogPost
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { isNightMode } = useTheme()
  const relatedPosts = getRelatedPosts(post.slug, 3)

  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#888888' : '#6B7280',
    textSubtle: isNightMode ? '#666666' : '#9CA3AF',
    accent: isNightMode ? '#FFC64C' : '#B45309',
    cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
    cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  }

  // Simple markdown-like content rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactElement[] = []
    let currentParagraph: string[] = []
    let listItems: string[] = []
    let inList = false

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      // Headings
      if (trimmed.startsWith('# ')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
              {currentParagraph.join(' ')}
            </p>
          )
          currentParagraph = []
        }
        elements.push(
          <h1 key={`h1-${index}`} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 mt-8 transition-colors duration-500" style={{ color: colors.text }}>
            {trimmed.substring(2)}
          </h1>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
              {currentParagraph.join(' ')}
            </p>
          )
          currentParagraph = []
        }
        elements.push(
          <h2 key={`h2-${index}`} className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 mt-8 transition-colors duration-500" style={{ color: colors.text }}>
            {trimmed.substring(3)}
          </h2>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
              {currentParagraph.join(' ')}
            </p>
          )
          currentParagraph = []
        }
        elements.push(
          <h3 key={`h3-${index}`} className="text-2xl md:text-3xl lg:text-4xl font-bold leading-snug mb-3 mt-6 transition-colors duration-500" style={{ color: colors.text }}>
            {trimmed.substring(4)}
          </h3>
        )
        return
      }

      // Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
              {currentParagraph.join(' ')}
            </p>
          )
          currentParagraph = []
        }
        if (!inList) {
          inList = true
          listItems = []
        }
        listItems.push(trimmed.substring(2))
        return
      }

      // End of list
      if (inList && trimmed === '') {
        if (listItems.length > 0) {
          elements.push(
            <ul key={`ul-${index}`} className="list-disc list-inside mb-4 space-y-2 ml-4">
              {listItems.map((item, i) => (
                <li key={i} className="text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
                  {item}
                </li>
              ))}
            </ul>
          )
          listItems = []
        }
        inList = false
        return
      }

      // Regular paragraph
      if (trimmed === '') {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${index}`} className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
              {currentParagraph.join(' ')}
            </p>
          )
          currentParagraph = []
        }
      } else {
        currentParagraph.push(trimmed)
      }
    })

    // Handle remaining content
    if (currentParagraph.length > 0) {
      elements.push(
        <p key="p-final" className="text-base leading-relaxed mb-4 transition-colors duration-500" style={{ color: colors.textMuted }}>
          {currentParagraph.join(' ')}
        </p>
      )
    }

    if (listItems.length > 0) {
      elements.push(
        <ul key="ul-final" className="list-disc list-inside mb-4 space-y-2 ml-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
              {item}
            </li>
          ))}
        </ul>
      )
    }

    return elements
  }

  return (
    <main style={{ background: colors.bg }}>
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-20 pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors duration-500 hover:opacity-80"
            style={{ color: colors.accent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          {/* Category Badge */}
          <div className="mb-6">
            <span
              className="inline-block text-xs tracking-[0.25em] uppercase font-medium px-3 py-1 rounded-full transition-colors duration-500"
              style={{
                background: isNightMode ? 'rgba(255,198,76,0.1)' : 'rgba(180,83,9,0.1)',
                color: colors.accent,
              }}
            >
              {post.category}
            </span>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 transition-colors duration-500"
            style={{ color: colors.text }}
          >
            {post.title}
          </motion.h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mb-8 text-sm transition-colors duration-500" style={{ color: colors.textMuted }}>
            <span>By {post.author}</span>
            <span>•</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors duration-500"
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textSubtle,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: isNightMode
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
        }}
      />

      {/* Content Section */}
      <section className="px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none">
            <div className="text-base leading-relaxed transition-colors duration-500" style={{ color: colors.textMuted }}>
              {renderContent(post.content)}
            </div>
          </article>
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: isNightMode
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
        }}
      />

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8 text-center transition-colors duration-500"
              style={{ color: colors.text }}
            >
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <motion.article
                  key={relatedPost.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/blog/${relatedPost.slug}`}>
                    <div
                      className="h-full p-6 md:p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                      style={{
                        background: colors.cardBg,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <div className="mb-4">
                        <span
                          className="inline-block text-xs tracking-[0.25em] uppercase font-medium px-3 py-1 rounded-full transition-colors duration-500"
                          style={{
                            background: isNightMode ? 'rgba(255,198,76,0.1)' : 'rgba(180,83,9,0.1)',
                            color: colors.accent,
                          }}
                        >
                          {relatedPost.category}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold mb-3 leading-tight transition-colors duration-500 group-hover:opacity-80"
                        style={{ color: colors.text }}
                      >
                        {relatedPost.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed mb-4 transition-colors duration-500"
                        style={{ color: colors.textMuted }}
                      >
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                        <span
                          className="text-sm font-medium transition-colors duration-500"
                          style={{ color: colors.accent }}
                        >
                          Read more
                        </span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: colors.accent }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: isNightMode
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.3), transparent)',
        }}
      />
    </main>
  )
}

