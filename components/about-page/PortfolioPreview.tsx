'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const PortfolioPreview = () => {
  const { isNightMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const portfolioItems = [
    {
      title: 'Pink Salt Salon',
      category: 'Beauty & Wellness',
      image: '/images/portfolio/pinksalt-mockup.png',
    },
    {
      title: 'Client Project',
      category: 'E-Commerce',
      image: '/images/portfolio/client-mockup.png',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-24 transition-colors duration-500"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h3
              className="text-lg md:text-xl font-medium mb-3 transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Our Work
            </h3>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight transition-colors duration-500 leading-tight"
              style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
            >
              Websites We've Launched
            </h2>
            <p
              className="text-xl max-w-2xl mx-auto transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Helping businesses scale their online presence with modern, high-performing websites. 
              Every website we launch is designed for speed, SEO, and conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div
              className={`lg:col-span-7 transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="relative group">
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    background: isNightMode ? '#1A1A1A' : '#FAFAFA',
                    padding: '12px 12px 24px 12px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div 
                      className="flex-1 h-6 rounded-md mx-2"
                      style={{ background: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    />
                  </div>
                  
                  <div 
                    className="aspect-[16/10] rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #FFC64C 0%, #FF9500 100%)' }}
                  >
                    <span className="font-bold text-xl" style={{ color: '#1A1A1A' }}>Pink Salt Salon</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3
                    className="text-xl font-bold transition-colors duration-500"
                    style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                  >
                    {portfolioItems[0].title}
                  </h3>
                  <p
                    className="text-sm transition-colors duration-500"
                    style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : '#6B6B6B' }}
                  >
                    {portfolioItems[0].category}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`lg:col-span-5 transition-all duration-700 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              <div className="relative group flex justify-center lg:justify-start">
                <div
                  className="relative w-64 rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-1"
                  style={{
                    background: isNightMode ? '#1A1A1A' : '#FAFAFA',
                    padding: '12px',
                  }}
                >
                  <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full z-10 transition-colors duration-500"
                    style={{ background: isNightMode ? '#1A1A1A' : '#000000' }}
                  />
                  
                  <div 
                    className="aspect-[9/19] rounded-[2rem] overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <span className="font-bold" style={{ color: '#FFFFFF' }}>Mobile</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center lg:text-left">
                <h3
                  className="text-xl font-bold transition-colors duration-500"
                  style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                >
                  {portfolioItems[1].title}
                </h3>
                <p
                  className="text-sm transition-colors duration-500"
                  style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : '#6B6B6B' }}
                >
                  {portfolioItems[1].category}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`text-center mt-16 transition-all duration-700 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p
              className="text-xl mb-8 transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Ready to grow with a partner who values transparency and measurable results?
            </p>
            
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-8 py-6 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 group"
              style={{
                background: '#FFC64C',
                color: '#1A1A1A',
                borderRadius: '12px',
                boxShadow: isNightMode
                  ? '0 8px 30px rgba(255, 198, 76, 0.3)'
                  : '0 4px 14px rgba(0, 0, 0, 0.1)',
              }}
            >
              View All Projects
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioPreview;

