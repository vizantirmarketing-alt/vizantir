'use client'

import { useEffect, useRef, useState } from 'react';

const VisionApproach = () => {
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

  const approaches = [
    {
      number: '01',
      title: 'Tailored Strategy',
      description: 'Every project is built around what your specific business actually needs',
    },
    {
      number: '02',
      title: 'Performance Standards',
      description:
        'Every build is held to clear standards — fast load times, clean architecture, and a mobile experience that does not compromise.',
    },
    {
      number: '03',
      title: 'Creative That Converts',
      description: 'From visual systems to website performance, every design decision is tied to a business outcome — not just how it looks',
    },
  ];

  const getBadgeColor = (index: number) =>
    index === 0 ? '#3B82F6' : index === 1 ? '#C084FC' : '#00D9FF';

  const getBadgeBg = (index: number) =>
    index === 0
      ? 'rgba(59, 130, 246, 0.15)'
      : index === 1
        ? 'rgba(192, 132, 252, 0.15)'
        : 'rgba(0, 217, 255, 0.15)';

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-24 px-4 transition-colors duration-500 relative overflow-hidden"
      style={{
        background: '#FAF9F5',
      }}
    >
      {/* Pulsing background shape - centered vertically */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 -right-[100px] w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)',
          animation: 'pulseBg 8s ease-in-out infinite',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left - Vision */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <p
              className="text-sm font-semibold tracking-widest uppercase mb-4"
              style={{ 
                color: 'var(--gold-primary)',
              }}
            >
              Our Vision
            </p>
            <h2
              className="text-3xl md:text-4xl lg:text-[42px] font-bold mb-6 leading-tight transition-colors duration-500"
              style={{ color: '#1A1A1A' }}
            >
              Building websites that reflect the level of the business
            </h2>
            <p
              className="text-lg leading-relaxed transition-colors duration-500"
              style={{ color: '#6B6B6B' }}
            >
              Every project starts with understanding what the business needs to communicate, who it is speaking to, and what the website needs to do beyond looking current.
            </p>
          </div>

          {/* Right - Approach */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <p
              className="text-sm font-semibold tracking-widest uppercase mb-6"
              style={{ 
                color: '#C084FC',
              }}
            >
              Our Approach
            </p>
            <div className="flex flex-col gap-6">
              {approaches.map((item, index) => (
                <div
                  key={item.number}
                  className="card-interactive flex gap-5 p-6 rounded-2xl border cursor-pointer transition-all duration-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    opacity: isVisible ? 1 : 0,
                    WebkitTransform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(30px, 0, 0)',
                    transform: isVisible ? 'translate3d(0, 0, 0)' : 'translate3d(30px, 0, 0)',
                    transitionDelay: `${300 + index * 200}ms`,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    className="approach-num w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300"
                    style={{
                      background: getBadgeBg(index),
                      color: getBadgeColor(index),
                    }}
                  >
                    {item.number}
                  </div>
                  <div>
                    <h4
                      className="text-lg font-semibold mb-2 transition-colors duration-500"
                      style={{ color: '#1A1A1A' }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="text-sm leading-relaxed transition-colors duration-500"
                      style={{ color: '#6B6B6B' }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseBg {
          0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateY(-50%) scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </section>
  );
};

export default VisionApproach;
