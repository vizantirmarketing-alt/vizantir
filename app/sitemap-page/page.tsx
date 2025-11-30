'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

export default function SitemapPage() {
  const { isNightMode } = useTheme()

  const pages = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Blog", href: "/blog" },
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Sitemap", href: "/sitemap-page" },
  ]

  const legalPages = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms and Conditions", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Copyright Notice", href: "/copyright" },
  ]

  const blogCategories = [
    { name: "Web Design", href: "/blog?category=web-design" },
    { name: "Insights", href: "/blog?category=insights" },
  ]

  const linkStyle = {
    color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A',
  }

  const linkHoverClass = "transition-colors hover:opacity-80"

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Sitemap</h1>
            <p className="text-lg" style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>
              A complete overview of all pages on Vizantir.com
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            
            {/* Main Pages */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#FFC64C' }} />
                Pages
              </h2>
              <ul className="space-y-3">
                {pages.map((page, index) => (
                  <li key={index}>
                    <Link href={page.href} className={linkHoverClass} style={linkStyle}>
                      {page.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Pages */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#FFC64C' }} />
                Legal
              </h2>
              <ul className="space-y-3">
                {legalPages.map((page, index) => (
                  <li key={index}>
                    <Link href={page.href} className={linkHoverClass} style={linkStyle}>
                      {page.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Blog Categories */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#FFC64C' }} />
                Blog Categories
              </h2>
              <ul className="space-y-3">
                {blogCategories.map((category, index) => (
                  <li key={index}>
                    <Link href={category.href} className={linkHoverClass} style={linkStyle}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

          </div>

          {/* Footer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16 pt-8 border-t" style={{ borderColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <p className="text-sm" style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}>
              Last updated: January 2025
            </p>
          </motion.div>

        </div>
      </section>
    </main>
  )
}

