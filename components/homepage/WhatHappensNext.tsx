'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

const WhatHappensNext = () => {
  const { isNightMode } = useTheme();

  const steps = [
    {
      number: '01',
      title: 'Book a Strategy Call',
      description: "We'll discuss your goals, challenges, and whether we're a fit.",
    },
    {
      number: '02',
      title: 'Get a Custom Strategy',
      description:
        'We research your business, your market, and your competitors before anything is scoped. What comes back is a strategy built around what will actually work for you — not a generic proposal.',
    },
    {
      number: '03',
      title: 'We Launch and Keep Tuning',
      description: 'We build, refine, and launch — then support the site so it keeps performing.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section 
      className="py-16 md:py-20 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            What Happens Next
          </h2>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: isNightMode 
                  ? 'rgba(255, 255, 255, 0.04)' 
                  : 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: isNightMode 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isNightMode 
                  ? 'none' 
                  : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Step Number */}
              <div 
                className="text-6xl md:text-7xl font-black mb-4 leading-none"
                style={{ 
                  color: isNightMode ? 'rgba(255, 198, 76, 0.15)' : 'rgba(255, 198, 76, 0.2)',
                }}
              >
                {step.number}
              </div>

              <h3 
                className="text-xl md:text-2xl font-bold mb-3"
                style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
              >
                {step.title}
              </h3>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : '#6B6B6B' }}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="text-center"
        >
          <Button
            size="lg"
            asChild
            className="mb-4 rounded-xl px-8 py-4 text-base font-semibold text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'var(--gold-gradient)',
              boxShadow: 'var(--gold-shadow)',
            }}
          >
            <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'what_happens_next')}>Book a Strategy Call</Link>
          </Button>
          <p 
            className="text-sm md:text-base"
            style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.5)' : '#888888' }}
          >
            No commitment. No pitch deck. Just a conversation.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatHappensNext;

