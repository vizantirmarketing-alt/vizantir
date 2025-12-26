'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

const FAQSection = () => {
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

  const faqs = [
    {
      question: "Why are you cheaper than traditional agencies?",
      answer: "We're fully remote with zero office overhead. No expensive downtown rent, no bloated teams. We pass those savings directly to you while delivering the same (or better) results. Traditional agencies charge $10K-20K/month because they have to. We don't."
    },
    {
      question: "Do I need to sign a long-term contract?",
      answer: "No. We work month-to-month because we believe results should keep you, not a contract. If we're not delivering measurable growth, you're free to leave. That's how confident we are in our work."
    },
    {
      question: "How quickly will I see results?",
      answer: "SEO takes 3-6 months to show significant movement. PPC and web design changes show results within 30-60 days. We're transparent about timelines and set realistic expectations from day one—no BS promises of overnight success."
    },
    {
      question: "What if I already have a website?",
      answer: "Great! We can audit your existing site and optimize it for conversions and SEO. If it's built on outdated tech or isn't mobile-optimized, we'll recommend a rebuild. Either way, we work with what you have and improve from there."
    },
    {
      question: "Do you only work with salons and local businesses?",
      answer: "No. Pink Salt Salon and ClickLV are our proof of concept—we tested our strategies on our own businesses first. We work with any business that wants measurable growth: e-commerce, B2B services, local businesses, and online brands."
    },
    {
      question: "What makes you different from other agencies?",
      answer: "We practice what we preach. Before taking clients, we grew our own businesses using these exact strategies. We're also brutally honest—if something won't work, we'll tell you. No fluff, no agency-speak, just real strategies that drive revenue."
    }
  ];

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
              Questions? <span style={{ color: '#00D9FF' }}>Answered.</span>
            </motion.h2>
            <p 
              className="text-xl"
              style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B' }}
            >
              Everything you need to know before we start working together.
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
                key={index}
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
                    style={{ color: '#00D9FF' }}
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
              className="font-semibold transition-colors duration-200 hover:opacity-80"
              style={{ color: '#FFC64C' }}
            >
              Schedule a Call →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

