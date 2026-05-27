'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

export type Faq = { _id: string; question: string; answer: string }

export interface FAQSectionProps {
  faqs: Faq[]
}

const FAQSection = ({ faqs }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isNightMode } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <section 
      className="py-20 md:py-24"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
            >
              Questions? <span style={{ color: 'var(--gold-accent)' }}>Answered.</span>
            </motion.h2>
            <p 
              className="text-xl"
              style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B' }}
            >
              Real questions we get before projects start.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={faq._id}
                variants={itemVariants}
                className="rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  border: isNightMode ? '1px solid #374151' : '1px solid #E5E7EB',
                  background: isNightMode ? '#000000' : '#FFFFFF'
                }}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors duration-200"
                  style={{ background: isNightMode ? '#000000' : '#FFFFFF' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isNightMode ? '#111111' : '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isNightMode ? '#000000' : '#FFFFFF';
                  }}
                >
                  <span 
                    className="text-lg font-semibold pr-8"
                    style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    style={{ color: 'var(--gold-accent)' }}
                  />
                </button>
                
                {openIndex === index && (
                  <div 
                    className="px-6 pb-5 leading-relaxed"
                    style={{ color: isNightMode ? '#D1D5DB' : '#4B5563' }}
                  >
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <p 
              className="mb-4"
              style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B' }}
            >
              Still have questions?
            </p>
            <Link 
              href="/contact" 
              onClick={() => trackCTAClick('schedule_a_call', 'faq_section')}
              className="group inline-flex items-center gap-2 font-semibold transition-opacity duration-300 hover:opacity-85"
              style={{ color: 'var(--gold-accent)' }}
            >
              <span>Book a Strategy Call</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

