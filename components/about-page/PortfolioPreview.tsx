'use client'

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
      title: 'Essence of Watches',
      category: 'Luxury E-Commerce',
      description: 'Pre-owned Rolex marketplace featuring premium design, authentication flow, and advanced filtering.',
      image: '/eow.png',
      link: 'https://essenceofwatches.com',
    },
    {
      title: 'Fuji Omakase',
      category: 'HOSPITALITY',
      description: 'Michelin-starred omakase restaurant website with immersive animations, editorial design, and premium booking experience.',
      image: '/fuji-omakase.png',
      link: 'https://fujiomakase.com',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 transition-colors duration-500"
      style={{ background: isNightMode ? '#0A0A0A' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div
            className={`text-center mb-20 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-[#FFC64C] mb-4">
              Our Work
            </p>
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight transition-colors duration-500"
              style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
            >
              Websites We've Launched
            </h2>
            <p 
              className="text-lg md:text-xl max-w-2xl mx-auto transition-colors duration-500"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Modern, high-performing websites designed for speed, SEO, and conversions.
            </p>
          </div>

          {/* Portfolio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {portfolioItems.map((item, index) => (
              <div
                key={item.title}
                className={`group transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                {/* Mockup Image */}
                <div className="relative mb-8 transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className={`object-contain transition-all duration-500 ${
                        isNightMode ? 'group-hover:drop-shadow-[0_0_50px_rgba(255,198,76,0.15)]' : ''
                      }`}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Project Info */}
                <div className="space-y-3">
                  <p className="text-sm tracking-[0.2em] uppercase text-[#FFC64C]">
                    {item.category}
                  </p>
                  <h3 
                    className="text-2xl md:text-3xl font-bold group-hover:text-[#FFC64C] transition-colors duration-300"
                    style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="leading-relaxed transition-colors duration-500"
                    style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                  >
                    {item.description}
                  </p>
                  
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-[#FFC64C] transition-colors duration-300 mt-2"
                    style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                  >
                    View Live Site
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className={`text-center mt-20 transition-all duration-700 delay-500 ${
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
              href="/case-studies"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 group bg-[#FFC64C] text-[#1A1A1A]"
              style={{
                boxShadow: '0 8px 30px rgba(255, 198, 76, 0.3)',
              }}
            >
              View All Work
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioPreview;
