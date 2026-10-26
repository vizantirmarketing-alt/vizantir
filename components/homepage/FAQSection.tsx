'use client'

import { AccordionItem } from '@/components/ui/AccordionItem'
import { Section } from '@/components/ui/Section'
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackBookStrategyCall } from '@/lib/analytics';

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
    <Section style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-gutter">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-[var(--heading-gap)]">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:text-5xl font-bold mb-4 text-foreground"
            >
              Questions? <span style={{ color: 'var(--cobalt-text)' }}>Answered.</span>
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
            className="space-y-[var(--stack)]"
          >
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index
              const triggerId = `homepage-faq-trigger-${faq._id}`
              const panelId = `homepage-faq-panel-${faq._id}`

              return (
                <AccordionItem
                  key={faq._id}
                  variants={itemVariants}
                  triggerId={triggerId}
                  panelId={panelId}
                  headingAs="h3"
                  isOpen={isOpen}
                  onToggle={() => setOpenIndex(isOpen ? null : index)}
                  question={faq.question}
                  className="border-border bg-card"
                >
                  <p className="leading-relaxed text-body">{faq.answer}</p>
                </AccordionItem>
              )
            })}
          </motion.div>

          <div className="text-center mt-10">
            <p 
              className="mb-4 text-muted-foreground"
            >
              Still have questions?
            </p>
            <Link 
              href="/contact" 
              onClick={() => trackBookStrategyCall('faq_section')}
              className="group inline-flex items-center gap-2 font-semibold transition-opacity duration-300 hover:opacity-85"
              style={{ color: 'var(--cobalt-text)' }}
            >
              <span>Book a Strategy Call</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default FAQSection;
