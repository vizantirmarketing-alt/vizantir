'use client'

import { MotionCard } from '@/components/ui/MotionCard'
import { Section } from '@/components/ui/Section'
import { motion } from 'framer-motion';

const WhyVizantir = () => {
  const trustPoints = [
    {
      title: "Direct Access",
      description:
        "You work closely with the person shaping the project, not layers of account management.",
    },
    {
      title: "Clear Scope",
      description: "Every engagement is structured around what the site actually needs, not vague add-ons or bloated retainers.",
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
    <Section className="transition-colors duration-500"
      style={{ background: 'var(--background)' }}>
      <div className="container mx-auto px-gutter">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center mb-12"
        >
          <h2 
            className="md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-foreground"
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
          className="grid md:grid-cols-2 gap-[var(--stack)] max-w-6xl mx-auto"
        >
          {trustPoints.map((point, index) => (
            <MotionCard variant="plain" interactive badge={false}
              key={index}
              variants={cardVariants}
              className="group block h-auto rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 
                className="text-xl md:text-2xl font-bold mb-3 transition-colors duration-300 text-foreground"
              >
                {point.title}
              </h3>
              <p 
                className="text-base md:text-lg leading-relaxed text-muted-foreground"
              >
                {point.description}
              </p>
            </MotionCard>
          ))}
        </motion.div>
      </div>
    </Section>
  );
};

export default WhyVizantir;
