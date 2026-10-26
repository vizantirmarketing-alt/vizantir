'use client'

import { Section } from '@/components/ui/Section'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { trackBookStrategyCall } from '@/lib/analytics';

const CTA = () => {
  return (
    <Section className="relative overflow-hidden"
      style={{
        background: 'var(--background)',
      }}>
      <div className="container mx-auto px-gutter relative z-10">
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
            className="md:text-5xl font-black mb-6 text-foreground"
          >
            If the website needs to do more than just look better, let&apos;s talk.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl mb-8 text-muted-foreground"
          >
            We&apos;ll look at what&apos;s holding your site back and tell you honestly what it needs.
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
              className="bg-cobalt-gradient rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
            >
              <Link href="/contact" onClick={() => trackBookStrategyCall('cta_section')}>Book a Strategy Call</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Section>
  );
};

export default CTA;
