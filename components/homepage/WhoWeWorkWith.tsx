'use client'

import { motion } from 'framer-motion';

const WhoWeWorkWith = () => {
  const industries = [
    'Hospitality & Restaurants',
    'Law Firms',
    'Commercial Real Estate',
    'Luxury & Lifestyle Brands',
    'Financial Services',
  ];

  return (
    <section 
      className="py-16 md:py-20 transition-colors duration-500"
      style={{ background: '#FAFAFA' }}
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
            style={{ color: '#1A1A1A' }}
          >
            Built for businesses where trust matters before the sale
          </h2>
          
          <p 
            className="text-lg md:text-xl leading-relaxed mb-8"
            style={{ color: '#6B6B6B' }}
          >
            We work best with businesses where the first impression directly affects whether someone picks up the phone. If your site isn&apos;t doing that job, that&apos;s where we come in.
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
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  color: '#4A4A4A',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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




