'use client'

import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const ResultsThatSpeak = () => {
  const { isNightMode } = useTheme();

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
          className="max-w-3xl mx-auto text-center"
        >
          <h2 
            className="text-4xl md:text-5xl font-black mb-6 tracking-tight"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Results That Speak
          </h2>
          
          <p 
            className="text-lg md:text-xl leading-relaxed"
            style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : '#6B6B6B' }}
          >
            We let our work do the talking. Case studies coming soon.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsThatSpeak;




