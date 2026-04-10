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
      question: "Why do clients choose Vizantir over larger agencies?",
      answer:
        "Larger agencies charge for overhead — account managers, layers of approval, offices. We cut all of that. What you get is senior-level strategy and execution, faster turnaround, and direct communication from kickoff to launch. No handoffs, no junior teams running your account.",
    },
    {
      question: "How does your engagement model work?",
      answer:
        "We don't lock clients into long-term retainers before proving our value. We start with a strategy call to understand your goals, then propose a scoped engagement with clear deliverables and pricing. Ongoing retainers are available once we've earned them.",
    },
    {
      question: "What does the timeline look like from kickoff to launch?",
      answer:
        "Most website projects are completed within 4–6 weeks from kickoff. SEO and paid media campaigns are typically live within 2 weeks. Timelines depend on scope and how quickly feedback is turned around on your end — we move as fast as you do.",
    },
    {
      question: "Can you work with an existing site or brand?",
      answer:
        "Yes. We audit what you have, identify what's working and what isn't, and improve from there. You don't need to start from scratch. If a full rebuild makes more sense, we'll tell you honestly and explain why.",
    },
    {
      question: "What industries do you specialize in?",
      answer:
        "We focus on hospitality and restaurants, law firms, commercial real estate, and luxury lifestyle brands. These are competitive, high-stakes markets where design quality and search visibility directly impact revenue — which is exactly where we operate best.",
    },
    {
      question: "What's your philosophy on design and results?",
      answer:
        "Design without strategy is decoration. Every decision we make — layout, copy, structure, speed — is tied to a business outcome. We build sites that convert, run ads that track to revenue, and measure what actually moves your business forward.",
    },
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
              Book a Strategy Call →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

