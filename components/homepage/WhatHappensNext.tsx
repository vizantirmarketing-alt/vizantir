'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { trackBookStrategyCall } from '@/lib/analytics';

const WhatHappensNext = () => {
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
        'We research your business, your market, and your competitors before anything is scoped. What comes back is a strategy built around what will actually work for you, not a generic proposal.',
    },
    {
      number: '03',
      title: 'We Launch',
      description: 'We build, refine, and launch. Launch support is included; how long depends on the tier. Ongoing care after that is optional.',
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
    <Section className="transition-colors duration-500"
      style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-gutter">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-[var(--heading-gap)]"
        >
          <h2 
            className="md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-foreground"
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
          className="grid md:grid-cols-3 gap-[var(--stack)] max-w-6xl mx-auto mb-10"
        >
          {steps.map((step, index) => (
            <MotionCard variant="plain" badge={false}
              key={index}
              variants={cardVariants}
              className="block h-auto rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Step Number */}
              <div 
                aria-hidden="true"
                className="text-[28px] md:text-6xl font-black mb-4 leading-none"
                style={{ 
                  color: 'rgba(0, 112, 243, 0.2)',
                }}
              >
                {step.number}
              </div>

              <h3 
                className="text-xl md:text-2xl font-bold mb-3 text-foreground"
              >
                {step.title}
              </h3>
              <p 
                className="text-base md:text-lg leading-relaxed text-muted-foreground"
              >
                {step.description}
              </p>
            </MotionCard>
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
            className="bg-cobalt-gradient mb-4 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
          >
            <Link href="/contact" onClick={() => trackBookStrategyCall('what_happens_next')}>Book a Strategy Call</Link>
          </Button>
          <p 
            className="text-sm md:text-base text-meta"
          >
            No commitment. No pitch deck. Just a conversation.
          </p>
        </motion.div>
      </div>
    </Section>
  );
};

export default WhatHappensNext;
