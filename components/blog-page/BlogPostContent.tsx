'use client'

import React from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'

import type { PortableTextBlock } from '@portabletext/types'

import { PortableTextRenderer } from '@/components/blog-page/PortableTextRenderer'

export type SanityBlogPost = {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  publishedAt: string
  excerpt?: string
  body?: PortableTextBlock[]
  metaTitle?: string
  metaDescription?: string
  ogImageUrl?: string
  category?: string
  tags?: string[]
  readTime?: string
  author?: {
    _id: string
    name: string
    slug: string
    role?: string
    imageUrl?: string
  }
}

interface BlogPostContentProps {
  post: SanityBlogPost
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const colors = {
    bg: '#FAF9F5',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: 'var(--cobalt-accent)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.08)',
  }

  const tags = post.tags ?? []
  const authorName = post.author?.name ?? 'Vizantir'

  return (
    <main style={{ background: colors.bg }}>
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-20 pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link
            href="/blog"
            className="link-cobalt inline-flex items-center gap-2 mb-8 text-sm font-medium"
            style={{ color: colors.accent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          {/* Category Badge */}
          {post.category ? (
            <div className="mb-6">
              <span
                className="inline-block text-xs tracking-[0.25em] uppercase font-medium px-3 py-1 rounded-full transition-colors duration-500"
                style={{
                  background: 'rgba(0, 112, 243,0.1)',
                  color: colors.accent,
                }}
              >
                {post.category}
              </span>
            </div>
          ) : null}

          {/* Title */}
          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 transition-colors duration-500"
            style={{ color: colors.text }}
          >
            {post.title}
          </m.h1>

          {/* Meta Info */}
          <div
            className="flex flex-wrap items-center gap-4 mb-8 text-sm transition-colors duration-500"
            style={{ color: colors.textMuted }}
          >
            <span>By {authorName}</span>
            <span>•</span>
            <span>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {post.readTime ? (
              <>
                <span>•</span>
                <span>{post.readTime}</span>
              </>
            ) : null}
          </div>

          {/* Tags */}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map((tag) => (
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
          ) : null}
        </div>
      </section>

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.3), transparent)',
        }}
      />

      {/* Content Section */}
      <section className="px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none">
            <div
              className={`blog-content transition-colors duration-500 blog-content-light`}
              style={{ color: colors.textMuted }}
            >
              <PortableTextRenderer value={post.body} />
            </div>
          </article>
        </div>
      </section>

    </main>
  )
}
