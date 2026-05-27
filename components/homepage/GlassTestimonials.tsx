'use client'

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
  gradient: string;
}

const GlassTestimonials = () => {
  const { isNightMode } = useTheme();
  const [activeIndex, setActiveIndex] = useState(1);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Golden Era Integra',
      role: 'Founder',
      company: 'Golden Era Integra',
      quote: 'Vizantir built the editorial platform exactly right — build journal, parts archive, garage sale system, all running on Sanity CMS. It presents the restoration the way it deserves.',
      avatar: 'GEI',
      gradient: 'var(--gold-gradient)',
    },
    {
      id: 2,
      name: 'Eloraé Nails',
      role: 'Owner',
      company: 'Eloraé Nails',
      quote: "Vizantir built me a site that matches the quality of my work. Clean, professional, and clients actually book through it now. Best investment I've made for my studio.",
      avatar: 'EN',
      gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const getCardStyle = (index: number) => {
    const n = testimonials.length;
    if (n === 2) {
      if (index === activeIndex) {
        return {
          transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)',
          zIndex: 20,
          opacity: 1,
        };
      }
      const isLeft = index < activeIndex;
      return isLeft
        ? {
            transform: 'translateX(-280px) translateY(-30px) rotate(-8deg) scale(0.9)',
            zIndex: 10,
            opacity: 0.6,
          }
        : {
            transform: 'translateX(280px) translateY(30px) rotate(8deg) scale(0.9)',
            zIndex: 10,
            opacity: 0.6,
          };
    }

    const position = index - activeIndex;
    
    if (position === 0) {
      return {
        transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)',
        zIndex: 20,
        opacity: 1,
      };
    } else if (position === -1 || position === n - 1) {
      return {
        transform: 'translateX(-280px) translateY(-30px) rotate(-8deg) scale(0.9)',
        zIndex: 10,
        opacity: 0.6,
      };
    } else {
      return {
        transform: 'translateX(280px) translateY(30px) rotate(8deg) scale(0.9)',
        zIndex: 10,
        opacity: 0.6,
      };
    }
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
  };

  const dayBackground = `
    radial-gradient(ellipse 80% 50% at 20% 50%, rgba(255, 198, 76, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
    #FAFAFA
  `;

  const nightBackground = `
    radial-gradient(ellipse 80% 50% at 20% 50%, rgba(124, 58, 237, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    #000
  `;

  return (
    <section
      className="relative min-h-screen w-full flex items-center overflow-hidden py-20 md:py-24"
      style={{ background: isNightMode ? nightBackground : dayBackground }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${isNightMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isNightMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
        <div className="text-center mb-24">
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8"
            style={{
              background: isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.15)',
              border: `1px solid ${isNightMode ? 'rgba(255, 198, 76, 0.2)' : 'rgba(255, 198, 76, 0.3)'}`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: 'var(--gold-primary)' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: isNightMode ? 'var(--gold-primary)' : 'var(--gold-accent)' }}
            >
              Trusted by Industry Leaders
            </span>
          </div>

          <h2
            className="text-7xl md:text-8xl font-black mb-6"
            style={{ letterSpacing: '0px', lineHeight: '0.95' }}
          >
            <span
              style={{
                backgroundImage: isNightMode
                  ? 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, rgba(26,26,26,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
              }}
            >
              Clients Love Us
            </span>
          </h2>

          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
          >
            Real stories from businesses that transformed their digital presence with Vizantir
          </p>
        </div>

        <div className="relative h-[600px] flex items-center justify-center">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="absolute w-full max-w-xl cursor-pointer transition-all duration-700 ease-out"
              style={getCardStyle(index)}
              onClick={() => handleCardClick(index)}
            >
              <div
                className="relative rounded-2xl p-12 transition-all duration-500"
                style={{
                  background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isNightMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: index === activeIndex
                    ? isNightMode
                      ? '0 30px 80px rgba(0, 0, 0, 0.5)'
                      : '0 30px 80px rgba(0, 0, 0, 0.15)'
                    : isNightMode ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.06)',
                }}
              >
                {index === activeIndex && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(circle at center, ${
                        isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.05)'
                      } 0%, transparent 70%)`,
                    }}
                  />
                )}

                <div className="relative flex items-center gap-4 mb-8">
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl transition-all duration-300"
                    style={{
                      background: testimonial.gradient,
                      color: testimonial.id === 1 ? '#1a1a1a' : '#fff',
                      boxShadow: index === activeIndex
                        ? `0 8px 30px ${testimonial.gradient.match(/\#[A-F0-9]{6}/i)?.[0]}40`
                        : 'none',
                    }}
                  >
                    {testimonial.avatar}
                  </div>

                  <div>
                    <h4
                      className="text-xl font-bold mb-1"
                      style={{ color: isNightMode ? '#fff' : '#1a1a1a' }}
                    >
                      {testimonial.company}
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
                    >
                      {testimonial.role}
                    </p>
                  </div>
                </div>

                <p
                  className="text-lg md:text-xl"
                  style={{
                    color: isNightMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.75)',
                    lineHeight: '1.7',
                  }}
                >
                  "{testimonial.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3 mt-16">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="transition-all duration-300"
              style={{
                width: index === activeIndex ? '40px' : '12px',
                height: '12px',
                borderRadius: '100px',
                background: index === activeIndex
                  ? 'var(--gold-primary)'
                  : isNightMode
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.2)',
                boxShadow: index === activeIndex ? '0 0 20px rgba(255, 198, 76, 0.5)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlassTestimonials;

