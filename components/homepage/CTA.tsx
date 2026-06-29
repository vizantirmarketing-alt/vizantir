'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { m } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

const CTA = () => {
  return (
    <section 
      className="py-16 md:py-20 short-landscape:py-8 relative overflow-hidden"
      style={{
        background: '#FAF9F5',
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <m.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-black mb-6 text-foreground"
          >
            If the website needs to do more than just look better, let&apos;s talk.
          </m.h2>
          <m.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl mb-8 text-muted-foreground"
          >
            We&apos;ll look at what&apos;s holding your site back and tell you honestly what it needs.
          </m.p>
          <m.div
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
              <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'cta_section')}>Book a Strategy Call</Link>
            </Button>
          </m.div>
        </m.div>
      </div>
    </section>
  );
};

export default CTA;
