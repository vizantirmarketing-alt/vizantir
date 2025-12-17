'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const WhatHappensNext = () => {
  const { isNightMode } = useTheme();

  const steps = [
    {
      number: '01',
      title: 'Schedule a Call',
      description: "We'll discuss your goals, challenges, and whether we're a fit.",
    },
    {
      number: '02',
      title: 'Get a Custom Strategy',
      description: "If we're aligned, we'll deliver a tailored plan with clear deliverables.",
    },
    {
      number: '03',
      title: 'See Results',
      description: "We execute, measure, and optimize until you're seeing real growth.",
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
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
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
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: isNightMode 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: isNightMode 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isNightMode 
                  ? '0 4px 24px rgba(0, 0, 0, 0.2)' 
                  : '0 4px 24px rgba(0, 0, 0, 0.06)',
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
            className="text-base lg:text-lg px-8 lg:px-10 py-6 lg:py-7 font-bold border-0 transition-all duration-300 hover:scale-105 mb-4"
            style={{
              background: "#FFC64C",
              color: "#1A1A1A",
              borderRadius: "8px",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Link href="/contact">Schedule Your Call</Link>
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

