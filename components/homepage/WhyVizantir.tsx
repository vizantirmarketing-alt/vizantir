'use client'

import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const WhyVizantir = () => {
  const { isNightMode } = useTheme();

  const trustPoints = [
    {
      title: "10+ Years Experience",
      description: "Deep expertise in SEO, paid media, and conversion optimization across competitive industries.",
    },
    {
      title: "Results Before Retainers",
      description: "We prove our value before asking for long-term commitment. Performance first, always.",
    },
    {
      title: "Built for Growth",
      description: "We work with businesses doing $1M+ who are ready to scale, not startups figuring things out.",
    },
    {
      title: "No Fluff, No Vanity Metrics",
      description: "We report on leads, revenue, and ROI. Not impressions and likes.",
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
      transition: { duration: 0.5, ease: "easeOut" },
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
            Why Vizantir
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isNightMode 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(255, 255, 255, 0.85)';
                e.currentTarget.style.borderColor = isNightMode 
                  ? 'rgba(255, 198, 76, 0.3)' 
                  : 'rgba(255, 198, 76, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isNightMode 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'rgba(255, 255, 255, 0.7)';
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

