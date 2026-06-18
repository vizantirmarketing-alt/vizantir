'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Target, Zap, Globe } from 'lucide-react'
import { Eyebrow } from '@/components/ui/Eyebrow'
import AIIntegration from '@/components/about-page/AIIntegration'
import VisionApproach from '@/components/about-page/VisionApproach'
import { trackCTAClick } from '@/lib/analytics'
import WhyUs from '@/components/about-page/WhyUs'
import WhatTheWorkShouldDo from '@/components/about-page/WhatTheWorkShouldDo'
import PortfolioPreview from '@/components/about-page/PortfolioPreview'

const RibbonsAnimation = dynamic(
  () => import('@/components/RibbonsAnimation'),
  { ssr: false, loading: () => null }
)

export default function AboutPageClient() {
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroY = useTransform(scrollY, [0, 500], [0, 100])

  const values = [
    {
      icon: Target,
      title: 'Results-Driven',
      description:
        'Every decision is made with the business outcome in mind — not vanity metrics.',
      color: 'var(--cobalt-primary)',
    },
    {
      icon: Zap,
      title: 'Lean & Fast',
      description: 'No bloated teams or endless meetings. We move quickly and execute with precision.',
      color: 'var(--cobalt-primary)',
    },
    {
      icon: Users,
      title: 'Partner Mindset',
      description: "We treat your business like our own. Your success is our success.",
      color: 'var(--cobalt-primary)',
    },
    {
      icon: Globe,
      title: 'Remote-First',
      description: 'Global talent and async-first collaboration — more focus on the build, less bureaucracy slowing decisions.',
      color: 'var(--cobalt-primary)',
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
        style={{ background: '#FAF9F5' }}
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
          {/* Hero kicker */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Eyebrow uppercase={false}>✦ Who We Are</Eyebrow>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] text-foreground"
          >
            Built by an operator, not just a designer.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-muted-foreground" style={{ lineHeight: 1.7 }}
          >
            Vizantir is a Las Vegas–based premium website design studio for established businesses that need a stronger digital presence, cleaner execution, and a site that reflects the level of the business behind it.
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
              className="bg-cobalt-gradient text-base px-8 py-6 font-semibold border-0 rounded-xl shadow-cobalt group"
            >
              <Link href="/contact" onClick={() => trackCTAClick('work_with_us', 'about')}>
                Work With Us
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

      </section>

      {/* Story Section */}
      <section
        className="py-20 md:py-24"
        style={{ background: '#FAF9F5' }}
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
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 leading-tight text-foreground"
              >
                Why Vizantir exists
              </motion.h3>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-5 text-base md:text-lg text-muted-foreground" style={{ lineHeight: 1.8 }}
              >
                <p>
                  I've owned businesses for 25 years. I know what it's like to pay for a website and get something that looks fine in a browser but doesn't actually do anything for the business. That experience is what Vizantir was built to fix.
                </p>
                <p>
                  Most agencies hand your project to a junior team, run it through a template, and call it done. We build everything custom — and because I've sat on the client side of this equation for decades, I know exactly what actually matters when the site goes live.
                </p>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="text-3xl md:text-4xl lg:text-5xl font-black mt-12 mb-8 leading-tight text-foreground"
              >
                What makes the approach different
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base md:text-lg mb-0 text-muted-foreground" style={{ lineHeight: 1.8 }}
              >
                25 years running businesses and 10+ years building websites means I approach every project with two lenses at once: what looks right and what actually works. Design decisions, copy decisions, structure decisions — all of it gets filtered through the question of what the business actually needs the site to do.
              </motion.p>

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
                  className="bg-cobalt-gradient text-base px-8 py-6 font-semibold border-0 rounded-xl shadow-cobalt group"
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
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* Vision & Approach */}
      <VisionApproach />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* AI Integration */}
      <AIIntegration />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      <WhatTheWorkShouldDo />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* Why Us / Remote-First */}
      <WhyUs />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* Portfolio Preview */}
      <PortfolioPreview />

      {/* Section Divider */}
      <div 
        className="w-full h-px"
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* Values Section */}
      <section
        className="py-20 md:py-24"
        style={{ background: '#FAF9F5' }}
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
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight transition-colors duration-500 text-foreground"
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
                className="card-interactive group relative p-8 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Background Number */}
                <span
                  className="absolute right-4 bottom-2 text-[80px] font-black pointer-events-none select-none leading-none transition-all duration-500 group-hover:scale-110"
                  style={{
                    color: value.color,
                    opacity: 0.08,
                  }}
                >
                  {`0${index + 1}`}
                </span>

                {/* Icon */}
                <div
                  className="relative z-10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(0, 112, 243, 0.15)',
                    border: `1px solid ${value.color}30`,
                  }}
                >
                  <value.icon className="w-7 h-7" style={{ color: value.color }} />
                </div>

                {/* Content */}
                <h4
                  className="relative z-10 text-xl font-bold mb-3 text-foreground"
                >
                  {value.title}
                </h4>
                <p
                  className="relative z-10 text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}
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
          background: 'linear-gradient(90deg, transparent, rgba(0, 112, 243,0.5), transparent)' 
        }}
      />

      {/* Final CTA Section */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: '#FAF9F5' }}
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
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground"
            >
              The goal is simple
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl mb-10 text-muted-foreground" style={{ lineHeight: 1.7 }}
            >
              Every business we work with has already put in the work to build something real. The website should reflect that — not undercut it.
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
                className="bg-cobalt-gradient text-lg px-10 py-7 font-bold border-0 rounded-xl shadow-cobalt group"
              >
                <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'about')}>
                  Book a Strategy Call
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
