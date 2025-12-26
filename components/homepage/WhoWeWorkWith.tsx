'use client'

import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const WhoWeWorkWith = () => {
  const { isNightMode } = useTheme();

  const industries = [
    'Professional Services',
    'SaaS & Technology',
    'Healthcare & Medical',
    'Home Services',
    'E-commerce',
  ];

  return (
    <section 
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Who We Work With
          </h2>
          
          <p 
            className="text-lg md:text-xl leading-relaxed mb-10"
            style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : '#6B6B6B' }}
          >
            We partner with B2B companies, professional services firms, and established local businesses generating $1M+ in revenue. Our clients are growth-focused leaders who want measurable results, not vanity metrics.
          </p>

          {/* Industries Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex flex-wrap justify-center gap-4 md:gap-6"
          >
            {industries.map((industry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="px-6 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 hover:scale-105"
                style={{
                  background: isNightMode 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  border: isNightMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isNightMode ? 'rgba(255, 255, 255, 0.8)' : '#4A4A4A',
                  boxShadow: isNightMode 
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                {industry}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhoWeWorkWith;




