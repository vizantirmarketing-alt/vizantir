'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Target, Zap, Globe } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import RibbonsAnimation from '@/components/RibbonsAnimation'
import AIIntegration from '@/components/about-page/AIIntegration'
import VisionApproach from '@/components/about-page/VisionApproach'
import WhyUs from '@/components/about-page/WhyUs'
import PortfolioPreview from '@/components/about-page/PortfolioPreview'

export default function AboutPageClient() {
  const { isNightMode } = useTheme()

  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 500], [0, 100])

  const values = [
    {
      icon: Target,
      title: 'Results-Driven',
      description: 'Every strategy we build is designed to deliver measurable outcomes. No vanity metrics—just real growth.',
      color: '#FFC64C',
    },
    {
      icon: Zap,
      title: 'Lean & Fast',
      description: 'No bloated teams or endless meetings. We move quickly and execute with precision.',
      color: isNightMode ? '#06B6D4' : '#FFC64C',
    },
    {
      icon: Users,
      title: 'Partner Mindset',
      description: "We treat your business like our own. Your success is our success.",
      color: isNightMode ? '#8B5CF6' : '#FFC64C',
    },
    {
      icon: Globe,
      title: 'Remote-First',
      description: 'Global talent, zero overhead. We pass the savings on to you.',
      color: isNightMode ? '#EC4899' : '#FFC64C',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  }

  return (
    <main>
      {/* Hero Section with Ribbons */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        {/* Ribbons Animation Background */}
        <motion.div 
          className="absolute inset-0"
          style={{ 
            opacity: heroOpacity, 
            y: heroY,
            willChange: 'transform, opacity'
          }}
        >
          <RibbonsAnimation />
        </motion.div>

        {/* Content */}
        <motion.div 
          className="relative z-10 text-center max-w-4xl mx-auto px-4 pt-24"
          style={{ opacity: heroOpacity }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-block px-5 py-2.5 rounded-full border backdrop-blur-md"
            style={{
              background: isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.15)',
              borderColor: isNightMode ? 'rgba(255, 198, 76, 0.3)' : 'rgba(255, 198, 76, 0.5)',
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: isNightMode ? '#FFC64C' : '#1A1A1A' }}
            >
              ✦ Who We Are
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95]"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            A LEAN TEAM.
            <br />
            <span style={{ color: '#FFC64C' }}>BIG RESULTS.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: 1.7 }}
          >
            Vizantir is a remote-first digital marketing agency built on one principle:
            deliver real, measurable growth without the overhead of traditional agencies.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              asChild
              className="text-base px-8 py-6 font-semibold border-0 transition-all duration-300 hover:scale-105 group"
              style={{
                background: '#FFC64C',
                color: '#1A1A1A',
                borderRadius: '12px',
                boxShadow: isNightMode
                  ? '0 8px 30px rgba(255, 198, 76, 0.3)'
                  : '0 8px 30px rgba(255, 198, 76, 0.4)',
              }}
            >
              <Link href="/contact">
                Work With Us
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-20"
          style={{ opacity: heroOpacity }}
        >
          <div
            className="w-6 h-10 rounded-full border-2 flex justify-center pt-2"
            style={{
              borderColor: isNightMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              className="w-1 h-2 rounded-full animate-scroll-wheel"
              style={{
                backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Story Section */}
      <section
        className="py-20 md:py-24"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-lg md:text-xl font-medium mb-3"
                style={{ color: '#C084FC' }}
              >
                Our Story
              </motion.h2>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 leading-tight"
                style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
              >
                BUILT DIFFERENT.
                <br />
                ON PURPOSE.
              </motion.h3>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-5 text-base md:text-lg"
                style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: 1.8 }}
              >
                <p>
                  Vizantir was founded with a simple observation: traditional agencies are
                  broken. Bloated teams, endless meetings, and inflated retainers that don't
                  correlate with results.
                </p>
                <p>
                  We built something different. A{' '}
                  <strong style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                    remote-first, results-obsessed
                  </strong>{' '}
                  agency that operates lean and moves fast. No offices. No wasted overhead.
                  Just a focused team of specialists who know how to grow businesses.
                </p>
                <p>
                  From SEO and web design to PPC and AI-powered marketing, we bring
                  enterprise-level strategies to businesses that want real growth without
                  the agency bloat.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10"
              >
                <Button
                  size="lg"
                  asChild
                  className="text-base px-8 py-6 font-semibold border-0 transition-all duration-300 hover:scale-105 group"
                  style={{
                    background: '#FFC64C',
                    color: '#1A1A1A',
                    borderRadius: '12px',
                    boxShadow: isNightMode
                      ? '0 8px 30px rgba(255, 198, 76, 0.3)'
                      : '0 8px 30px rgba(255, 198, 76, 0.4)',
                  }}
                >
                  <Link href="/services">
                    Explore Our Services
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* Vision & Approach */}
      <VisionApproach />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* AI Integration */}
      <AIIntegration />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* Why Us / Remote-First */}
      <WhyUs />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* Portfolio Preview */}
      <PortfolioPreview />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* Values Section */}
      <section
        className="py-20 md:py-24"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-lg md:text-xl font-medium mb-3 transition-colors duration-500" style={{ color: '#C084FC' }}>
              What Drives Us
            </h2>
            <h3
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight transition-colors duration-500"
              style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
            >
              OUR VALUES
            </h3>
          </motion.div>

          {/* Values Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                style={{
                  background: isNightMode
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isNightMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: isNightMode
                    ? '0 4px 24px rgba(0, 0, 0, 0.3)'
                    : '0 4px 24px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Background Number */}
                <span
                  className="absolute right-4 bottom-2 text-[80px] font-black pointer-events-none select-none leading-none transition-all duration-500 group-hover:scale-110"
                  style={{
                    color: value.color,
                    opacity: isNightMode ? 0.1 : 0.08,
                  }}
                >
                  {`0${index + 1}`}
                </span>

                {/* Icon */}
                <div
                  className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: isNightMode
                      ? `rgba(255, 255, 255, 0.05)`
                      : 'rgba(255, 198, 76, 0.15)',
                    border: `1px solid ${value.color}30`,
                  }}
                >
                  <value.icon className="w-7 h-7" style={{ color: value.color }} />
                </div>

                {/* Content */}
                <h4
                  className="relative z-10 text-xl font-bold mb-3"
                  style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
                >
                  {value.title}
                </h4>
                <p
                  className="relative z-10 text-sm"
                  style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: 1.7 }}
                >
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: isNightMode 
            ? 'linear-gradient(90deg, transparent, rgba(255,198,76,0.3), transparent)' 
            : 'linear-gradient(90deg, transparent, rgba(255,198,76,0.5), transparent)' 
        }}
      />

      {/* Final CTA Section */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6"
              style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
            >
              READY TO <span style={{ color: '#FFC64C' }}>GROW</span>?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl mb-10"
              style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: 1.7 }}
            >
              Let's talk about how we can help your business achieve real, measurable results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                size="lg"
                asChild
                className="text-lg px-10 py-7 font-bold border-0 transition-all duration-300 hover:scale-105 group"
                style={{
                  background: '#FFC64C',
                  color: '#1A1A1A',
                  borderRadius: '12px',
                  boxShadow: isNightMode
                    ? '0 8px 40px rgba(255, 198, 76, 0.4)'
                    : '0 8px 40px rgba(255, 198, 76, 0.5)',
                }}
              >
                <Link href="/contact">
                  Schedule a Call Today
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

