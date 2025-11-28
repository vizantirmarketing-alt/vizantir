'use client'

import { useTheme } from '@/contexts/ThemeContext';
import { Building2, Wifi, DollarSign, Zap } from 'lucide-react';
import Link from 'next/link';

const WhyUs = () => {
  const { isNightMode } = useTheme();

  const approaches = [
    {
      title: 'WordPress',
      tag: 'DIY Friendly',
      description: 'Full control over your content. Edit pages, publish blogs, update images — no developer needed. Best for content-driven businesses who want independence.',
      accentColor: '#3B82F6',
      link: null,
    },
    {
      title: 'Custom Development',
      tag: 'Premium Performance',
      description: 'Blazing fast, secure, premium feel. No plugin bloat or security holes. Best for businesses who want performance and are okay with us handling maintenance.',
      accentColor: '#C084FC',
      link: null,
    },
    {
      title: 'Not Sure?',
      tag: "Let's Talk",
      description: "That's what the discovery call is for. We'll learn about your business and recommend the right approach — no pressure, no jargon.",
      accentColor: '#FFC64C',
      link: '/contact',
    },
  ];

  const benefits = [
    {
      icon: Building2,
      title: 'No Office Overhead',
      description: 'No fancy downtown rent. No expensive furniture. Just pure focus on your results.',
      color: '#FFC64C',
    },
    {
      icon: Wifi,
      title: 'Global Talent',
      description: 'We work with the best, wherever they are. No geographic limitations.',
      color: '#00D9FF',
    },
    {
      icon: DollarSign,
      title: 'Savings Passed to You',
      description: 'Every dollar we save on overhead goes directly into your project.',
      color: '#FFB5A0',
    },
    {
      icon: Zap,
      title: 'Faster Execution',
      description: 'No bureaucracy. No layers of approval. Just fast, quality work.',
      color: '#C084FC',
    },
  ];

  return (
    <section
      className="py-20 md:py-28 transition-all duration-700"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span
              className="inline-block text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: '#00D9FF' }}
            >
              Our Advantage
            </span>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6"
              style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
            >
              Why Remote-First?
            </h2>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto"
              style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              No fancy office. No bloated overhead. No inflated invoices. 
              We pass the savings directly to you.
            </p>
          </div>

          {/* We Build What's Right For You Section */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: '#00D9FF' }}
              >
                OUR APPROACH
              </span>
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-black mb-6"
                style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
              >
                We Build What's Right For You
              </h2>
              <p
                className="text-lg md:text-xl max-w-2xl mx-auto"
                style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
              >
                Some agencies only do WordPress. Others only do custom. We do what actually makes sense for your business.
              </p>
            </div>

            {/* Staggered List */}
            <div className="space-y-0">
              {approaches.map((approach, index) => {
                const content = (
                  <div
                    className={`group relative py-12 md:py-16 transition-all duration-300 ${
                      approach.link ? 'cursor-pointer' : ''
                    }`}
                    style={{
                      borderBottom: index < approaches.length - 1
                        ? isNightMode 
                          ? '1px solid rgba(255,255,255,0.1)' 
                          : '1px solid rgba(0,0,0,0.1)'
                        : 'none',
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <h3
                            className="text-4xl md:text-5xl font-black transition-colors duration-300"
                            style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                          >
                            <span className="group-hover:hidden">{approach.title}</span>
                            <span className="hidden group-hover:inline" style={{ color: approach.accentColor }}>{approach.title}</span>
                          </h3>
                          <span
                            className="text-sm font-medium uppercase tracking-wider"
                            style={{ color: isNightMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}
                          >
                            {approach.tag}
                          </span>
                        </div>
                        <div
                          className="h-1 rounded-full transition-all duration-500 ease-out w-0 opacity-0 group-hover:w-full group-hover:opacity-100"
                          style={{
                            background: approach.accentColor,
                          }}
                        />
                        <p
                          className="text-base md:text-lg mt-6 transition-all duration-500 overflow-hidden md:opacity-0 md:max-h-0 group-hover:opacity-100 group-hover:max-h-[300px]"
                          style={{
                            color: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                            lineHeight: '1.7',
                          }}
                        >
                          {approach.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return approach.link ? (
                  <Link key={index} href={approach.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={index}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isNightMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: isNightMode ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${benefit.color}20`,
                  }}
                >
                  <benefit.icon size={28} style={{ color: benefit.color }} />
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                >
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUs;

