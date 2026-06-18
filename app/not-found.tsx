'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main 
      className="min-h-screen transition-colors duration-500 flex items-center justify-center px-4"
      style={{ background: '#FAF9F5' }}
    >
      <div className="text-center max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 Number */}
          <motion.h1 
            className="text-[150px] md:text-[200px] font-bold leading-none mb-0"
            style={{ 
              color: 'var(--gold-primary)',
              textShadow: 'none'
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            404
          </motion.h1>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 
              className="text-2xl md:text-3xl font-bold mb-4 text-foreground"
            >
              Page Not Found
            </h2>
            <p 
              className="text-lg mb-8 max-w-md mx-auto text-muted-foreground"
            >
              Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/"
              className="bg-gold-gradient inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:opacity-80 text-foreground"
              style={{ 
                background: 'transparent', 
                borderRadius: '8px',
                border: '2px solid rgba(0,0,0,0.2)'
              }}
            >
              Contact Us
            </Link>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-12 pt-8 border-t"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <p 
              className="text-sm mb-4 text-meta"
            >
              Here are some helpful links:
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                { name: 'Services', href: '/services' },
                { name: 'About Us', href: '/about' },
                { name: 'Blog', href: '/blog' },
                { name: 'FAQ', href: '/faq' },
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="link-cobalt text-sm font-medium"
                  style={{ color: 'var(--gold-primary)' }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </main>
  )
}
