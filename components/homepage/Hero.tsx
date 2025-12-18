'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, useScroll, useTransform } from 'framer-motion';
import LiquidMetalTorus from "./LiquidMetalTorus";

const Hero = () => {
  const { isNightMode, mounted } = useTheme();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile for responsive scroll fade
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Slower fade on mobile (0-1000px scroll), faster on desktop (0-500px)
  const scrollEnd = isMobile ? 1000 : 500;
  const opacity = useTransform(scrollY, [0, scrollEnd], [1, 0]);
  const y = useTransform(scrollY, [0, scrollEnd], [0, 100]);
  const scale = useTransform(scrollY, [0, scrollEnd], [1, 0.95]);

  // Prevent flash by only showing content after theme is mounted
  useEffect(() => {
    if (mounted) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Don't render until theme is mounted to prevent flash
  if (!mounted) {
    return (
      <section 
        className="hero-section relative min-h-screen w-full flex items-center overflow-x-clip overflow-y-visible"
        style={{ 
          background: '#000000' // Default to dark during SSR
        }}
      />
    );
  }

  return (
    <motion.section 
      className="hero-section relative min-h-screen w-full flex items-center overflow-x-clip overflow-y-visible transition-colors duration-700"
      style={{ 
        background: isNightMode 
          ? '#000000' 
          : '#FAFAFA',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {/* Background gradient - purple/amber glow on LEFT side */}
      <motion.div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity,
          background: isNightMode 
            ? `
              radial-gradient(ellipse 80% 80% at 25% 50%, rgba(100, 40, 160, 0.35) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 10% 65%, rgba(160, 80, 20, 0.25) 0%, transparent 45%),
              radial-gradient(ellipse 50% 50% at 20% 30%, rgba(6, 150, 180, 0.18) 0%, transparent 40%),
              radial-gradient(ellipse 40% 40% at 35% 70%, rgba(80, 20, 120, 0.2) 0%, transparent 35%)
            `
            : `
              radial-gradient(ellipse 80% 80% at 25% 50%, rgba(255, 198, 76, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 10% 65%, rgba(212, 197, 249, 0.3) 0%, transparent 45%),
              radial-gradient(ellipse 50% 50% at 20% 30%, rgba(184, 230, 255, 0.25) 0%, transparent 40%)
            `,
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
            <stop offset="0%" stopColor={isNightMode ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)"} />
            <stop offset="20%" stopColor={isNightMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"} />
            <stop offset="50%" stopColor={isNightMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"} />
            <stop offset="80%" stopColor={isNightMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"} />
            <stop offset="100%" stopColor={isNightMode ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)"} />
          </linearGradient>
          <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="30%" stopColor={isNightMode ? "rgba(139,92,246,0.2)" : "rgba(255,198,76,0.3)"} />
            <stop offset="50%" stopColor={isNightMode ? "rgba(255,255,255,0.15)" : "rgba(212,197,249,0.25)"} />
            <stop offset="70%" stopColor={isNightMode ? "rgba(6,182,212,0.12)" : "rgba(184,230,255,0.2)"} />
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
          opacity: isNightMode ? 0.025 : 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div 
        className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-screen py-24 lg:py-20"
        style={{ opacity, y, scale }}
      >
        
        {/* LEFT SIDE - Liquid Metal Torus */}
        <div className="relative z-0 order-1 h-[160px] sm:h-[280px] md:h-[350px] lg:h-[650px] flex items-center justify-center lg:justify-start overflow-visible opacity-40 md:opacity-100">
          <div className="relative w-full h-full max-w-[700px] -mt-8 md:-mt-16 lg:-mt-24 scale-90 md:scale-100">
            <LiquidMetalTorus isNightMode={isNightMode} />
          </div>
        </div>

        {/* RIGHT SIDE - Content */}
        <div className="relative z-10 max-w-2xl order-2 lg:ml-auto text-left">
          <h2 
            className="text-lg md:text-xl font-medium mb-3 transition-colors duration-500"
            style={{ 
              color: isNightMode ? 'rgba(255,255,255,0.7)' : '#1A1A1A',
              textShadow: !isNightMode ? '0 2px 10px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.15)' : 'none'
            }}
          >
            Premium Web Design Agency
          </h2>

          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.95] tracking-[-0.02em] mb-8 transition-colors duration-500"
            style={{ 
              color: isNightMode ? '#FFFFFF' : '#1A1A1A',
              textShadow: !isNightMode ? '0 2px 10px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.15)' : 'none'
            }}
          >
            REAL
            <br />
            GROWTH
          </h1>

          <p 
            className="text-lg md:text-xl leading-relaxed mb-4 max-w-lg transition-colors duration-500"
            style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}
          >
            We create stunning, high-performance websites that convert visitors into customers. Built on Next.js for speed, designed for results.
          </p>

          <p 
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-lg italic transition-colors duration-500"
            style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}
          >
            Not for everyone. Built for businesses ready to scale.
          </p>

          <Button
            size="lg"
            asChild
            className="text-base lg:text-lg px-8 lg:px-10 py-6 lg:py-7 font-bold border-0 transition-all duration-300 hover:scale-105"
            style={{
              background: "#FFC64C",
              color: "#1A1A1A",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Link href="/contact">Schedule a Call</Link>
          </Button>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-2 sm:bottom-4 md:bottom-12 lg:bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-bounce z-20">
        <div 
          className="w-6 h-10 rounded-full border-2 flex justify-center pt-2 transition-colors duration-500"
          style={{ borderColor: isNightMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }}
        >
          <div 
            className="w-1 h-2 rounded-full transition-colors duration-500"
            style={{ 
              backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              animation: 'scrollWheel 1.5s ease-in-out infinite' 
            }}
          />
        </div>
        <span 
          className="text-xs uppercase tracking-widest transition-colors duration-500"
          style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
        >
          Scroll
        </span>
      </div>
    </motion.section>
  );
};

export default Hero;