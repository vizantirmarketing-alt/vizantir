'use client'

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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
    { color: '#FFC64C', rgb: '255, 198, 76', class: 'number-glow-teal' },
    { color: '#FFC64C', rgb: '255, 198, 76', class: 'number-glow-purple' },
    { color: '#FFC64C', rgb: '255, 198, 76', class: 'number-glow-blue' },
  ];

  const services = [
    {
      number: '01',
      title: 'Website Design',
      input: 'Custom visual design built to reflect the level of the business and create a more credible online presence.',
      output: 'Original design, mobile-first layout, brand-aligned visual system',
      outcome: 'A website that reflects the level of the business',
    },
    {
      number: '02',
      title: 'Website Development',
      input: "Custom Next.js builds — no plugins, no bloat, and fast enough to actually hold a visitor's attention",
      output: 'Clean codebase, CMS integration, performance-optimized build',
      outcome: 'A site that loads fast, works on every device, and grows with you',
    },
    {
      number: '03',
      title: 'Website Care',
      input: 'Ongoing support for updates, improvements, and post-launch maintenance.',
      output: 'Monthly updates, performance monitoring, content changes',
      outcome: 'A website that stays sharp after launch',
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
      className="relative min-h-screen py-20 md:py-24 overflow-hidden"
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

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-base md:text-lg max-w-3xl mx-auto mb-16 md:mb-20 px-2"
          style={{
            color: isNightMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)',
            lineHeight: 1.65,
          }}
        >
          We build websites for businesses that already know what they want — and need a team that can actually deliver it. Strategy, design, development, and support that holds up after launch.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16"
        >
          {services.map((service, index) => {
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="group relative min-w-0 rounded-2xl p-10 md:p-12 cursor-pointer transition-all duration-500 overflow-hidden"
                style={{
                  background: isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: isNightMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: isNightMode 
                    ? 'none' 
                    : '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isNightMode ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = isNightMode
                    ? 'rgba(255, 198, 76, 0.15)'
                    : 'rgba(180, 83, 9, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isNightMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = isNightMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)';
                }}
              >
                {/* Muted number - glows on hover */}
                <span 
                  className={`absolute right-6 bottom-6 text-[100px] md:text-[120px] font-black pointer-events-none select-none leading-none opacity-0 group-hover:opacity-[0.15] transition-all duration-500 ease-out ${numberStyles[index].class}`}
                  style={{ 
                    color: numberStyles[index].color,
                  }}
                >
                  {`0${index + 1}`}
                </span>

                <h3
                  className="text-3xl md:text-4xl font-extrabold mb-6 whitespace-normal transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FFC64C]"
                  style={{ color: isNightMode ? '#fff' : '#1a1a1a', lineHeight: '1.2' }}
                >
                  {service.title}
                </h3>
                
                {/* Input - What it is */}
                <p
                  className="text-base md:text-lg mb-6 font-medium"
                  style={{
                    color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    lineHeight: '1.6',
                  }}
                >
                  {service.input}
                </p>

                {/* Output - What you deliver */}
                <div className="mb-4">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{
                      color: isNightMode ? 'rgba(255, 198, 76, 0.8)' : '#B45309',
                    }}
                  >
                    Output:
                  </span>
                  <p
                    className="text-sm md:text-base"
                    style={{
                      color: isNightMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      lineHeight: '1.6',
                    }}
                  >
                    {service.output}
                  </p>
                </div>

                {/* Outcome - What changes for the client */}
                <div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                    style={{
                      color: isNightMode ? 'rgba(255, 198, 76, 0.8)' : '#B45309',
                    }}
                  >
                    Outcome:
                  </span>
                  <p
                    className="text-sm md:text-base font-medium"
                    style={{
                      color: isNightMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                      lineHeight: '1.6',
                    }}
                  >
                    {service.outcome}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 font-semibold transition-opacity duration-300 hover:opacity-85"
            style={{ color: isNightMode ? '#FFC64C' : '#B45309' }}
          >
            <span>View All Services</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;

