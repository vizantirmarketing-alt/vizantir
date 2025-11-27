'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

const CTA = () => {
  const { isNightMode } = useTheme();
  
  return (
    <section 
      className="py-24 md:py-32 relative overflow-hidden"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
      }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 
            className="text-4xl md:text-5xl font-black mb-6"
            style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
          >
            Ready to Transform Your Digital Presence?
          </h2>
          <p 
            className="text-xl mb-8"
            style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
          >
            Let's discuss how we can help you achieve your marketing goals.
          </p>
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
            <Link href="/contact">Start Your Journey Today</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTA;

