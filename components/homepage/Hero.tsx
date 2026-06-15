'use client'

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';
import { Eyebrow } from '@/components/ui/Eyebrow';

// Lazy load the heavy 3D component
const LiquidMetalTorus = lazy(() => import('./LiquidMetalTorus'));

// Lightweight placeholder
const TorusPlaceholder = () => (
  <div 
    className="w-full h-full flex items-center justify-center"
    style={{
      background: 'radial-gradient(circle, rgba(255, 198, 76, 0.15) 0%, transparent 70%)'
    }}
  />
);

const Hero = () => {
  const { scrollY } = useScroll();
  const [isBelowLg, setIsBelowLg] = useState(false);
  const [isBelowMd, setIsBelowMd] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  const [show3D, setShow3D] = useState(false);
  
  // Below-lg: centered glow (matches lg:grid-cols-2). Below-md: slower scroll fade.
  useEffect(() => {
    const handleViewportChange = () => {
      setIsBelowLg(window.innerWidth < 1024)
      setIsBelowMd(window.innerWidth < 768)
      setViewportHeight(window.innerHeight)
    }
    handleViewportChange()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)
    }
  }, [])

  // Defer 3D loading until browser is idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setShow3D(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      // Fallback for Safari
      const timer = setTimeout(() => setShow3D(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Fade distance scales with viewport height. Short viewports (landscape phones)
  // need a larger multiplier so the hero fully clears before the gap shows.
  const fadeMultiplier = viewportHeight > 0 && viewportHeight < 600 ? 2 : 1.3;
  const scrollEnd = viewportHeight > 0
    ? Math.max(700, Math.round(viewportHeight * fadeMultiplier))
    : (isBelowMd ? 1000 : 500);
  const opacity = useTransform(scrollY, [0, scrollEnd], [1, 0]);
  const contentOpacity = useTransform(
    scrollY,
    isBelowMd ? [0, scrollEnd * 0.6, scrollEnd] : [0, scrollEnd],
    isBelowMd ? [1, 1, 0] : [1, 0],
  );
  const y = useTransform(scrollY, [0, scrollEnd], [0, 100]);
  const scale = useTransform(scrollY, [0, scrollEnd], [1, 0.95]);

  const heroGlowBackground = isBelowLg
    ? 'radial-gradient(ellipse 120% 70% at 50% 45%, rgba(255, 198, 76, 0.1) 0%, rgba(180, 83, 9, 0.05) 35%, transparent 70%)'
    : `
              radial-gradient(ellipse 80% 80% at 25% 50%, rgba(255, 198, 76, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 10% 65%, rgba(180, 83, 9, 0.06) 0%, transparent 45%),
              radial-gradient(ellipse 50% 50% at 20% 30%, rgba(255, 198, 76, 0.08) 0%, transparent 40%)
            `;

  return (
    <motion.section 
      className="hero-section relative min-h-screen short-landscape:min-h-0 w-full flex items-center overflow-x-clip overflow-y-visible transition-colors duration-700"
      style={{ 
        background: '#FAFAFA',
      }}
    >
      {/* Background gradient - purple/amber glow on LEFT side */}
      <motion.div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity,
          background: heroGlowBackground,
        }}
      />
      
      {/* Flowing curved lines - SVG background */}
      <motion.svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity }}
      >
        <defs>
          <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="20%" stopColor="rgba(0,0,0,0.03)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.06)" />
            <stop offset="80%" stopColor="rgba(0,0,0,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="30%" stopColor="rgba(255,198,76,0.3)" />
            <stop offset="50%" stopColor="rgba(180,83,9,0.2)" />
            <stop offset="70%" stopColor="rgba(255,198,76,0.16)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        {/* Flowing arc lines */}
        <path 
          d="M-50,750 Q200,680 450,700 Q700,720 950,650 Q1200,580 1450,620" 
          fill="none" 
          stroke="url(#lineGradient1)" 
          strokeWidth="2"
        />
        <path 
          d="M-50,700 Q250,620 500,650 Q750,680 1000,600 Q1250,520 1500,570" 
          fill="none" 
          stroke="url(#lineGradient2)" 
          strokeWidth="2.5"
        />
        <path 
          d="M-50,650 Q300,560 550,600 Q800,640 1050,550 Q1300,460 1550,520" 
          fill="none" 
          stroke="url(#lineGradient1)" 
          strokeWidth="1.5"
        />
        <path 
          d="M-50,600 Q350,500 600,550 Q850,600 1100,500 Q1350,400 1600,470" 
          fill="none" 
          stroke="url(#lineGradient2)" 
          strokeWidth="2"
        />
        <path 
          d="M-50,550 Q400,440 650,500 Q900,560 1150,450 Q1400,340 1650,420" 
          fill="none" 
          stroke="url(#lineGradient1)" 
          strokeWidth="1"
        />
        <path 
          d="M-50,500 Q450,380 700,450 Q950,520 1200,400 Q1450,280 1700,370" 
          fill="none" 
          stroke="url(#lineGradient2)" 
          strokeWidth="1.5"
        />
      </motion.svg>
      
      {/* Noise texture overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div 
        className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-screen short-landscape:min-h-0 py-16 lg:py-16 short-landscape:py-10"
        style={{ y, scale }}
      >
        
        {/* LEFT SIDE - Liquid Metal Torus */}
        <div className="relative z-0 order-1 min-w-0 h-[160px] sm:h-[280px] md:h-[350px] lg:h-[650px] flex items-center justify-center lg:justify-start overflow-visible opacity-40 md:opacity-100">
          <div className="relative w-full h-full max-w-[700px] -mt-8 md:-mt-16 lg:-mt-24 scale-90 md:scale-100">
            {show3D ? (
              <Suspense fallback={<TorusPlaceholder />}>
                <LiquidMetalTorus />
              </Suspense>
            ) : (
              <TorusPlaceholder />
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Content */}
        <motion.div
          className="relative z-10 min-w-0 max-w-2xl order-2 lg:ml-auto text-left"
          style={{ opacity: contentOpacity }}
        >
          <div className="mb-4">
            <Eyebrow align="start">Vizantir Design Studio · Las Vegas</Eyebrow>
          </div>

          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-[-0.02em] mb-8 transition-colors duration-500"
            style={{ 
              color: '#1A1A1A',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.15)'
            }}
          >
            <span
              className="block text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.02em]"
              style={{
                color: '#5C5C5C',
                textShadow: 'none',
              }}
            >
              We build websites
            </span>
            <span
              className="block text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.02em] mt-1"
              style={{
                color: '#5C5C5C',
                textShadow: 'none',
              }}
            >
              that make people stop and say
            </span>
            <span className="block mt-3 sm:mt-4">
              <span
                className="block text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-semibold tracking-[-0.02em]"
                style={{
                  color: '#5C5C5C',
                  textShadow: 'none',
                }}
              >
                —
              </span>
              <span className="block lg:whitespace-nowrap">
                <span
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-[-0.02em]"
                  style={{
                    color: '#1A1A1A',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  who did this?
                </span>
                <span
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-semibold tracking-[-0.02em]"
                  style={{
                    color: '#5C5C5C',
                    textShadow: 'none',
                  }}
                >
                </span>
              </span>
            </span>
          </h1>

          <p 
            className="text-lg md:text-xl leading-relaxed mb-4 max-w-lg transition-colors duration-500"
            style={{ color: '#6B6B6B' }}
          >
            Not generated overnight.
          </p>

          <p 
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-lg italic transition-colors duration-500"
            style={{ color: '#888888' }}
          >
            Built to last, perform, and represent you at your best.
          </p>

          <Button
            size="lg"
            asChild
            className="rounded-xl px-8 py-4 text-base font-semibold text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'var(--gold-gradient)',
              boxShadow: 'var(--gold-shadow)',
            }}
          >
            <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'hero')}>View Our Work →</Link>
          </Button>
        </motion.div>
      </motion.div>

    </motion.section>
  );
};

export default Hero;