'use client'

import { useState, useEffect } from 'react'
/*
  ServicesHero - Architectural Grid
  
  Design: Structural, confident, precise
  - Animated grid lines on load
  - Corner accents
  - Content positioned on grid
  - Day/night theme support
*/

export default function ServicesHero() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Theme colors - matching Vizantir standards
  // Always start with dark mode to match server-side rendering
  const colors = {
    bg: '#FAF9F5',
    line: 'rgba(0,0,0,0.06)',
    accentLine: 'rgba(0, 112, 243,0.2)',
    accentLineBright: 'rgba(0, 112, 243,0.35)',
    text: 'var(--foreground)',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    accent: 'var(--cobalt-accent)',
    dotGreen: '#10B981',
  }

  return (
    <section
      className="relative min-h-[60vh] lg:min-h-screen w-full overflow-hidden"
      style={{ 
        background: colors.bg,
      }}
    >
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Vertical lines */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${i * 16.666}%`,
              background: i === 3 ? colors.accentLine : colors.line,
              transform: loaded ? 'scaleY(1)' : 'scaleY(0)',
              transformOrigin: 'top',
              transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.03}s`,
            }}
          />
        ))}

        {/* Horizontal lines */}
        {[1, 2, 3].map((i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${i * 25}%`,
              background: i === 2 ? colors.accentLine : colors.line,
              transform: loaded ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${0.15 + i * 0.05}s`,
            }}
          />
        ))}

        {/* Top-left corner accent */}
        <div
          className="absolute top-0 left-0 w-24 md:w-32 h-24 md:h-32"
          style={{
            borderLeft: `1px solid ${colors.accentLineBright}`,
            borderTop: `1px solid ${colors.accentLineBright}`,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.6s ease-out 0.3s',
          }}
        />

        {/* Bottom-right corner accent */}
        <div
          className="absolute bottom-0 right-0 w-32 md:w-48 h-32 md:h-48"
          style={{
            borderRight: `1px solid ${colors.accentLineBright}`,
            borderBottom: `1px solid ${colors.accentLineBright}`,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.6s ease-out 0.35s',
          }}
        />

        {/* Accent dot at center intersection */}
        <div
          className="absolute w-2 h-2 rounded-full hidden lg:block"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: colors.accent,
            opacity: loaded ? 0.6 : 0,
            transition: 'opacity 0.6s ease-out 0.4s',
            boxShadow: 'none',
          }}
        />
      </div>

      {/* Content Grid */}
      <div className="relative z-10 min-h-[60vh] lg:h-screen flex flex-col lg:justify-between px-6 md:px-12 lg:px-20 py-20 lg:py-24">
        {/* Top Row */}
        <div
          className="flex justify-between items-start"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
          }}
        >
          <span
            className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: colors.accent }}
          >
            Services
          </span>
          <span
            className="text-xs tracking-wider hidden sm:block"
            style={{ color: colors.textSubtle }}
          >
            Las Vegas / Remote
          </span>
        </div>

        {/* Center Content */}
        <div className="flex lg:flex-1 items-start lg:items-center pt-8 lg:pt-0">
          <div className="w-full grid grid-cols-12 gap-4 lg:items-center">
            {/* Main headline */}
            <div
              className="col-span-12 lg:col-span-8"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s',
              }}
            >
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold leading-[1.05] tracking-tight"
                style={{ color: colors.text }}
              >
                What We Build
              </h1>
            </div>

            {/* Side content */}
            <div
              className="col-span-12 lg:col-span-3 lg:col-start-10 flex flex-col justify-center mt-8 lg:mt-0"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
              }}
            >
              <p
                className="text-xl leading-relaxed mb-6"
                style={{ color: colors.textMuted }}
              >
                Our Las Vegas studio builds custom websites for established businesses. We figure out what the site needs to do before we design a single page.
              </p>
              <p
                className="text-xs tracking-[0.25em] uppercase font-medium mb-3"
                style={{ color: colors.accent }}
              >
                What&apos;s included in every build
              </p>
              <ul className="mb-6 space-y-2 list-none p-0 m-0">
                {[
                  'Custom design, no templates',
                  'Mobile-first development',
                  'CMS integration included',
                  'URL structure and page hierarchy planned from the start — not added after the fact',
                  'Post-launch support available',
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-base leading-relaxed"
                    style={{ color: colors.textMuted }}
                  >
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: colors.accent }}
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p
                className="inline-flex items-center gap-2 text-sm font-medium group"
                style={{ color: colors.text }}
              >
                <span>View all services</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}