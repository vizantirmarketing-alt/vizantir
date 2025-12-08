'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { marked } from 'marked'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { blogPosts, getRelatedPosts, type BlogPost } from '@/lib/blog-data'

interface BlogPostContentProps {
  post: BlogPost
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { isNightMode } = useTheme()
  const relatedPosts = getRelatedPosts(post.slug, 3)
  
  // Ensure we always show 3 related posts, even if we need to go beyond same category
  const displayRelatedPosts = relatedPosts.length >= 3 
    ? relatedPosts.slice(0, 3)
    : relatedPosts

  // Find current post index and adjacent posts
  const currentIndex = blogPosts.findIndex(p => p.slug === post.slug)
  const prevPost = currentIndex > 0 ? blogPosts[currentIndex - 1] : null
  const nextPost = currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null

  const colors = {
    bg: isNightMode ? '#000000' : '#FAFAFA',
    text: isNightMode ? '#F8F8F8' : '#1A1A1A',
    textMuted: isNightMode ? '#888888' : '#6B7280',
    textSubtle: isNightMode ? '#666666' : '#9CA3AF',
    accent: isNightMode ? '#FFC64C' : '#B45309',
    cardBg: isNightMode ? '#0A0A0A' : '#FFFFFF',
    cardBorder: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  }

  // Check if content starts with HTML tag, if so use it directly, otherwise parse with marked
  const renderedContent = post.content.trim().startsWith('<') 
    ? post.content 
    : marked.parse(post.content) as string

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
            <div 
              className={`blog-content transition-colors duration-500 ${isNightMode ? 'blog-content-dark' : 'blog-content-light'}`}
              style={{ color: colors.textMuted }}
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </article>
        </div>
      </section>

      {/* Previous/Next Navigation */}
      {(prevPost || nextPost) && (
        <section className="px-6 md:px-12 lg:px-20 py-8">
          <div className="max-w-4xl mx-auto">
            <div 
              className="flex justify-between items-center pt-8 border-t gap-4"
              style={{ 
                borderColor: isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
              }}
            >
              {prevPost ? (
                <Link 
                  href={`/blog/${prevPost.slug}`} 
                  className="group flex items-center gap-3 flex-1 min-w-0"
                >
                  <ArrowLeft 
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1" 
                    style={{ color: colors.accent }}
                  />
                  <div className="min-w-0">
                    <span 
                      className="text-sm block mb-1 transition-colors duration-500"
                      style={{ color: colors.textSubtle }}
                    >
                      Previous
                    </span>
                    <p 
                      className="font-medium truncate transition-colors duration-500 group-hover:opacity-80"
                      style={{ color: colors.text }}
                    >
                      {prevPost.title}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextPost ? (
                <Link 
                  href={`/blog/${nextPost.slug}`} 
                  className="group flex items-center gap-3 flex-1 min-w-0 text-right justify-end"
                >
                  <div className="min-w-0">
                    <span 
                      className="text-sm block mb-1 transition-colors duration-500"
                      style={{ color: colors.textSubtle }}
                    >
                      Next
                    </span>
                    <p 
                      className="font-medium truncate transition-colors duration-500 group-hover:opacity-80"
                      style={{ color: colors.text }}
                    >
                      {nextPost.title}
                    </p>
                  </div>
                  <ArrowRight 
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" 
                    style={{ color: colors.accent }}
                  />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
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

      {/* Related Posts */}
      {displayRelatedPosts.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 py-12 md:py-16">
          <div className="max-w-7xl mx-auto">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8 text-center transition-colors duration-500"
              style={{ color: colors.text }}
            >
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {displayRelatedPosts.map((relatedPost, index) => (
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

