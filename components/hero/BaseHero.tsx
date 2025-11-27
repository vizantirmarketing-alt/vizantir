'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import HeroCanvas from './HeroCanvas'
import { HeroProps } from './types'

export default function BaseHero({
  title,
  subtitle,
  ctaText = 'Get Started',
  ctaHref = '/contact',
  canvas = 'blobs',
  children,
  className = '',
}: HeroProps & { children?: React.ReactNode }) {
  const { isNightMode } = useTheme()

  return (
    <section
      className={`relative min-h-screen flex items-center overflow-hidden ${className}`}
      style={{ background: isNightMode ? '#000' : '#FAFAFA' }}
    >
      {/* Background Canvas */}
      <HeroCanvas variant={canvas} />

      {/* Ambient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-4xl">
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95]"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="text-lg md:text-xl mb-8 max-w-2xl"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              {subtitle}
            </p>
          )}

          <Link
            href={ctaHref}
            className="inline-block px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: '#FFC64C',
              color: '#1A1A1A',
              boxShadow: '0 4px 14px rgba(255, 198, 76, 0.4)',
            }}
          >
            {ctaText}
          </Link>
        </div>

        {children}
      </div>
    </section>
  )
}

