'use client'

import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const WhyVizantir = () => {
  const { isNightMode } = useTheme();

  const trustPoints = [
    {
      title: "Direct Access",
      description:
        "You work closely with the person shaping the project — not layers of account management.",
    },
    {
      title: "Clear Scope",
      description: "Every engagement is structured around what the site actually needs — not vague add-ons or bloated retainers.",
    },
    {
      title: "Built to Convert",
      description: "Faster load times, cleaner code, and a mobile experience that does not make people leave.",
    },
    {
      title: "Commercial Thinking",
      description: "The goal is not decoration. The goal is a website that supports trust, clarity, and stronger business outcomes.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center mb-12"
        >
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            Why businesses choose Vizantir
          </h2>
        </motion.div>

        {/* Trust Points Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {trustPoints.map((point, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative p-8 lg:p-10 rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isNightMode 
                  ? 'rgba(255, 255, 255, 0.07)' 
                  : 'rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = isNightMode 
                  ? 'rgba(255, 198, 76, 0.15)' 
                  : 'rgba(180, 83, 9, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isNightMode 
                  ? 'rgba(255, 255, 255, 0.04)' 
                  : 'rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = isNightMode 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.08)';
              }}
            >
              <h3 
                className="text-xl md:text-2xl font-bold mb-3 transition-colors duration-300"
                style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
              >
                {point.title}
              </h3>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : '#6B6B6B' }}
              >
                {point.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyVizantir;

