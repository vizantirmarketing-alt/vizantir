'use client'

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Newsletter = () => {
  const { isNightMode } = useTheme();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <section
      className="py-20"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
        borderTop: isNightMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8"
        >
          <div className="md:max-w-md">
            <h3
              className="text-xl md:text-2xl font-bold uppercase tracking-wide mb-2"
              style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
            >
              Subscribe to Our Weekly Newsletter
            </h3>
            <p
              className="text-sm"
              style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              We hate junk mail too. Only valuable updates, no clutter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 flex-1 md:max-w-xl md:justify-end">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              suppressHydrationWarning
              className="flex-1 px-5 py-3 rounded-lg text-sm outline-none transition-all duration-300"
              style={{
                background: isNightMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                border: isNightMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                color: isNightMode ? '#FFFFFF' : '#1A1A1A',
              }}
            />
            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #FFC64C 0%, #FFB84D 100%)',
                boxShadow: '0 8px 30px rgba(255, 198, 76, 0.3)',
              }}
            >
              Send
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;

