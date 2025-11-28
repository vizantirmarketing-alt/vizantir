'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef, useState } from 'react';

const AIIntegration = () => {
  const { isNightMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
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

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const demoMessages = [
    { question: "Do you accept walk-ins?", answer: "Yes! We welcome walk-ins Monday-Saturday. For weekends, we recommend booking ahead." },
    { question: "What are your prices for highlights?", answer: "Our highlights start at $150 for partial and $220 for full. Includes toner and blowout." },
    { question: "Do you use eco-friendly products?", answer: "Absolutely! We use sulfate-free, cruelty-free products from sustainable brands." },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 transition-colors duration-500 relative overflow-hidden"
      style={{
        background: isNightMode 
          ? '#000000'
          : '#FAFAFA',
      }}
    >
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at center, ${isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.15)'} 0%, transparent 70%)`,
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
              }`}
            >
              <h3
                className="text-lg md:text-xl font-medium mb-3 transition-colors duration-500"
                style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
              >
                AI Website Integration
              </h3>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight transition-colors duration-500 leading-tight"
                style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
              >
                Turn Your Website Into an{' '}
                <span style={{ color: '#00D9FF' }}>Interactive Assistant</span>
              </h2>
              <p
                className="text-base md:text-lg mb-6 transition-colors duration-500"
                style={{ color: isNightMode ? '#9CA3AF' : '#4A4A4A', lineHeight: '1.7' }}
              >
                We integrate AI directly into your site so customers can ask real questions 
                and get instant, accurate answers. The AI doesn't guess — it learns your website. 
                Every page, menu item, policy, and service detail becomes part of its training.
              </p>
              <p
                className="text-base md:text-lg mb-8 transition-colors duration-500"
                style={{ color: isNightMode ? '#9CA3AF' : '#4A4A4A', lineHeight: '1.7' }}
              >
              Instead of digging through menus or calling for details, your visitors get clear, 
              reliable responses in seconds — turning your website into a true customer assistant.
            </p>
            
            <button
              className="px-8 py-6 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
              style={{
                background: '#FFC64C',
                color: '#1A1A1A',
                borderRadius: '12px',
                boxShadow: isNightMode
                  ? '0 8px 30px rgba(255, 198, 76, 0.3)'
                  : '0 4px 14px rgba(0, 0, 0, 0.1)',
              }}
            >
              Make My Website Smarter
            </button>
          </div>

          <div
            className={`transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <div
              className="rounded-2xl p-6 border shadow-2xl"
              style={{
                background: isNightMode ? '#000000' : '#FAFAFA',
                borderColor: isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="flex items-center gap-3 pb-4 border-b mb-4"
                style={{ borderColor: isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#FFC64C' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                    Website Assistant
                  </p>
                  <p className="text-xs" style={{ color: '#22C55E' }}>● Online</p>
                </div>
              </div>

              <div className="space-y-4 min-h-[200px]">
                <div className="flex justify-end">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] transition-all duration-500"
                    style={{
                      background: '#FFC64C',
                      color: '#000000',
                    }}
                  >
                    <p className="text-sm font-medium">{demoMessages[currentMessage].question}</p>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-tl-sm max-w-[80%] transition-all duration-500"
                    style={{
                      background: isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : '#1A1A1A',
                    }}
                  >
                    <p className="text-sm">{demoMessages[currentMessage].answer}</p>
                  </div>
                </div>
              </div>

              <div 
                className="mt-4 pt-4 border-t flex items-center gap-3"
                style={{ borderColor: isNightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              >
                <div
                  className="flex-1 px-4 py-3 rounded-full text-sm"
                  style={{
                    background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isNightMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  Ask anything about this business...
                </div>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#FFC64C' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i === currentMessage ? '#FFC64C' : (isNightMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIIntegration;

