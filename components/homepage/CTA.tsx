'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

const CTA = () => {
  const { isNightMode } = useTheme();
  
  return (
    <section 
      className="py-20 md:py-24 relative overflow-hidden"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-black mb-6"
            style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
          >
            Ready to Transform Your Digital Presence?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl mb-8"
            style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
          >
            Book a strategy call and we&apos;ll map what to fix first—SEO, your site, or paid media.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              size="lg" 
              asChild
              className="transition-all duration-300 hover:scale-105"
              style={{
                background: '#FFC64C',
                color: '#1A1A1A',
                boxShadow: '0 0 20px rgba(255, 198, 76, 0.4)',
              }}
            >
              <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'cta_section')}>Book a Strategy Call</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;

