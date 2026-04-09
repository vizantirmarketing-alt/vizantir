'use client'

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';
import { trackCTAClick } from '@/lib/analytics';

const Strategy = () => {
  const { isNightMode } = useTheme();
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  // Particle network background
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const primaryColor = isNightMode ? "124, 58, 237" : "255, 198, 76";
      const secondaryColor = isNightMode ? "6, 182, 212" : "255, 184, 77";

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        particles.forEach((p2, j) => {
          if (i === j) return;
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${primaryColor}, ${0.2 - dist / 600})`;
            ctx.stroke();
          }
        });

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${secondaryColor}, 0.6)`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [isNightMode]);

  // 3D Globe animation
  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    const primaryColor = isNightMode ? "124, 58, 237" : "255, 198, 76";
    const secondaryColor = isNightMode ? "6, 182, 212" : "255, 184, 77";
    const accentColor = "#FFC64C";

    const dataPoints = [
      { lat: 0.5, lon: 0, color: accentColor },
      { lat: -0.3, lon: 1.5, color: accentColor },
      { lat: 0.8, lon: 2.5, color: isNightMode ? "#06B6D4" : accentColor },
      { lat: -0.6, lon: 4, color: accentColor },
      { lat: 0.2, lon: 5, color: isNightMode ? "#06B6D4" : accentColor },
      { lat: -0.1, lon: 3.5, color: accentColor },
    ];

    let animationId: number;

    const drawGlobe = () => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(centerX - 40, centerY - 40, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `rgba(${primaryColor}, 0.15)`);
      gradient.addColorStop(0.5, isNightMode ? 'rgba(30, 30, 60, 0.3)' : 'rgba(255, 250, 240, 0.3)');
      gradient.addColorStop(1, isNightMode ? 'rgba(10, 10, 30, 0.5)' : 'rgba(255, 245, 230, 0.5)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = `rgba(${primaryColor}, 0.3)`;
      ctx.lineWidth = 1;
      
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const y = centerY - Math.sin(latRad) * radius;
        const latRadius = Math.cos(latRad) * radius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, y, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let lon = 0; lon < 180; lon += 30) {
        const lonRad = ((lon + rotationRef.current) * Math.PI) / 180;
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${secondaryColor}, 0.4)`;
        
        for (let lat = -90; lat <= 90; lat += 5) {
          const latRad = (lat * Math.PI) / 180;
          const x = centerX + Math.cos(latRad) * Math.sin(lonRad) * radius;
          const y = centerY - Math.sin(latRad) * radius;
          const z = Math.cos(latRad) * Math.cos(lonRad);
          
          if (z >= 0) {
            if (lat === -90) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }

      dataPoints.forEach(point => {
        const adjustedLon = point.lon + (rotationRef.current * Math.PI) / 180;
        const x = centerX + Math.cos(point.lat) * Math.sin(adjustedLon) * radius;
        const y = centerY - Math.sin(point.lat) * radius;
        const z = Math.cos(point.lat) * Math.cos(adjustedLon);
        
        if (z >= -0.2) {
          const size = 4 + z * 3;
          const alpha = 0.3 + z * 0.7;
          
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
          glowGradient.addColorStop(0, point.color);
          glowGradient.addColorStop(0.5, point.color + '80');
          glowGradient.addColorStop(1, 'transparent');
          
          ctx.beginPath();
          ctx.arc(x, y, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.globalAlpha = alpha;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = point.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          
          ctx.globalAlpha = 1;
        }
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${primaryColor}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const shineGradient = ctx.createRadialGradient(centerX - 50, centerY - 50, 0, centerX - 50, centerY - 50, 80);
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      shineGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = shineGradient;
      ctx.fill();

      rotationRef.current += 0.3;
      animationId = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();

    return () => cancelAnimationFrame(animationId);
  }, [isNightMode]);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden py-20 md:py-24"
      style={{
        background: isNightMode ? "#000000" : "radial-gradient(ellipse at 70% 50%, #FFF9E6 0%, #FAFAFA 60%)",
      }}
    >
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.4 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl"
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-lg md:text-xl font-medium mb-3"
              style={{
                color: "#C084FC",
                textShadow: isNightMode ? "0 0 20px rgba(192, 132, 252, 0.5)" : "none",
              }}
            >
              We Believe
            </motion.h3>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight"
              style={{ color: isNightMode ? "#F8F8F8" : "#1A1A1A" }}
            >
              DESIGN + STRATEGY = RESULTS
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg mb-10"
              style={{ color: isNightMode ? "#9CA3AF" : "#4A4A4A", lineHeight: '1.7' }}
            >
              Most websites look fine and do nothing. We build sites around a specific outcome — more calls, more bookings, more qualified leads walking through the door.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                size="lg"
                asChild
                className="text-base px-8 py-6 font-semibold border-0 transition-all duration-300 hover:scale-105 group"
                style={{
                  background: "#FFC64C",
                  color: "#1A1A1A",
                  borderRadius: "12px",
                  boxShadow: isNightMode ? "0 8px 30px rgba(255, 198, 76, 0.3)" : "0 8px 30px rgba(255, 198, 76, 0.4)",
                }}
              >
                <Link href="/contact" onClick={() => trackCTAClick('schedule_a_call', 'strategy')}>
                  Book a Strategy Call
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right - Globe (now visible on all screens) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex items-center justify-center h-[350px] md:h-[500px]"
          >
            {/* Glow background */}
            <div
              className="absolute rounded-full"
              style={{
                width: "240px",
                height: "240px",
                background: isNightMode
                  ? "radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255, 198, 76, 0.3) 0%, transparent 70%)",
                animation: "pulseGlow 3s ease-in-out infinite",
              }}
            />

            {/* Pulse rings */}
            {[1, 2, 3].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full hidden md:block"
                style={{
                  width: `${300 + ring * 50}px`,
                  height: `${300 + ring * 50}px`,
                  border: `1px solid ${isNightMode ? "rgba(124, 58, 237, 0.4)" : "rgba(255, 198, 76, 0.5)"}`,
                  animation: `pulseOut 3s ease-out infinite ${ring * 0.7}s`,
                }}
              />
            ))}

            {/* Globe canvas - responsive size */}
            <canvas
              ref={globeCanvasRef}
              width={250}
              height={250}
              className="relative z-10 rounded-full w-[200px] h-[200px] md:w-[300px] md:h-[300px]"
              style={{
                boxShadow: isNightMode
                  ? "0 0 60px rgba(124, 58, 237, 0.5), 0 0 120px rgba(6, 182, 212, 0.3)"
                  : "0 0 60px rgba(255, 198, 76, 0.5), 0 0 120px rgba(255, 184, 77, 0.3)",
              }}
            />
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes pulseOut {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </section>
  );
};

export default Strategy;