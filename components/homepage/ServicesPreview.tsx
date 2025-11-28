'use client'

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const ServicesPreview = () => {
  const { isNightMode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const numberStyles = [
    { color: '#0EA5A5', rgb: '14, 165, 165', class: 'number-glow-teal' },
    { color: '#8B5CF6', rgb: '139, 92, 246', class: 'number-glow-purple' },
    { color: '#3B82F6', rgb: '59, 130, 246', class: 'number-glow-blue' },
    { color: '#D4A853', rgb: '212, 168, 83', class: 'number-glow-gold' },
  ];

  const services = [
    {
      number: '01',
      title: 'Web Design',
      description: 'Premium websites that convert visitors into customers with stunning design and flawless UX that drives results.',
    },
    {
      number: '02',
      title: 'SEO Optimization',
      description: 'Data-driven SEO strategies that dominate search rankings and drive massive organic traffic growth.',
    },
    {
      number: '03',
      title: 'Local SEO',
      description: 'Dominate local search results and connect with customers in your area through strategic optimization.',
    },
    {
      number: '04',
      title: 'AI Marketing',
      description: 'Leverage cutting-edge AI to automate and optimize your marketing campaigns for maximum ROI.',
    },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();

    const particleCount = 100;
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2,
        color: isNightMode 
          ? `rgba(255, 198, 76, ${Math.random() * 0.5})`
          : `rgba(255, 152, 0, ${Math.random() * 0.3})`,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [isNightMode]);

  return (
    <section
      className="relative min-h-screen py-24 md:py-32 overflow-hidden"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      <div className="relative z-10 container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-7xl md:text-8xl lg:text-9xl font-black text-center mb-24"
          style={{
            letterSpacing: '-6px',
            lineHeight: '0.9',
            color: isNightMode ? '#F8F8F8' : '#1A1A1A',
          }}
        >
          SERVICES
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto mb-16"
        >
          {services.map((service, index) => {
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="group relative rounded-3xl p-12 md:p-16 cursor-pointer transition-all duration-500 overflow-hidden"
                style={{
                  background: isNightMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isNightMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: isNightMode 
                    ? '0 4px 24px rgba(0, 0, 0, 0.2)' 
                    : '0 4px 24px rgba(0, 0, 0, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isNightMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isNightMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)';
                }}
              >
                {/* Muted number - glows on hover */}
                <span 
                  className={`absolute right-6 bottom-6 text-[100px] md:text-[120px] font-black pointer-events-none select-none leading-none transition-all duration-500 ${numberStyles[index].class}`}
                  style={{ 
                    color: numberStyles[index].color,
                    opacity: isNightMode ? 0.12 : 0.1,
                  }}
                >
                  {`0${index + 1}`}
                </span>

                <h3
                  className="text-3xl md:text-4xl font-extrabold mb-4 transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FFC64C]"
                  style={{ color: isNightMode ? '#fff' : '#1a1a1a', lineHeight: '1.2' }}
                >
                  {service.title}
                </h3>
                <p
                  className="text-base md:text-lg"
                  style={{
                    color: isNightMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    lineHeight: '1.7',
                  }}
                >
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: 'rgba(255, 198, 76, 0.1)',
              border: '2px solid rgba(255, 198, 76, 0.3)',
              color: '#FFC64C',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFC64C';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 198, 76, 0.1)';
              e.currentTarget.style.color = '#FFC64C';
            }}
          >
            View All Services
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;

