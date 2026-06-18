'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AccordionIndicator } from '@/components/ui/AccordionIndicator';
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

export type Faq = { _id: string; question: string; answer: string }

export interface FAQSectionProps {
  faqs: Faq[]
}

const FAQSection = ({ faqs }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
      className="py-16 md:py-20 short-landscape:py-8"
      style={{ background: '#FAF9F5' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
            >
              Questions? <span style={{ color: 'var(--gold-accent)' }}>Answered.</span>
            </motion.h2>
            <p 
              className="text-xl text-muted-foreground"
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
                className="rounded-xl overflow-hidden transition-all duration-300 border border-border bg-card"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors duration-200 hover:bg-[#F9FAFB]"
                  style={{ background: '#FFFFFF' }}
                >
                  <span 
                    className="text-lg font-semibold pr-8 text-foreground"
                  >
                    {faq.question}
                  </span>
                  <AccordionIndicator
                    isOpen={openIndex === index}
                    className="w-5 h-5"
                    style={{ color: 'var(--gold-accent)' }}
                  />
                </button>
                
                {openIndex === index && (
                  <div 
                    className="px-6 pb-5 leading-relaxed text-body"
                  >
                    {faq.answer}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <p 
              className="mb-4 text-muted-foreground"
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
