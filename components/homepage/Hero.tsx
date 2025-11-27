'use client'

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface Blob {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  targetRadius: number;
  color1: string;
  color2: string;
  rotation: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
}

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const { isNightMode } = useTheme();

  useEffect(() => {
    setIsCanvasReady(true);
  }, []);

  useEffect(() => {
    if (!isCanvasReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    
    window.addEventListener("resize", setCanvasSize);

    const dayBlobConfigs = [
      { color1: "#FFC64C", color2: "#FFB5A0", startX: 0.2, startY: 0.3 },
      { color1: "#D4C5F9", color2: "#E8D5FF", startX: 0.7, startY: 0.4 },
      { color1: "#B8E6FF", color2: "#B8F5D9", startX: 0.4, startY: 0.6 },
      { color1: "#FFB5A0", color2: "#FFC64C", startX: 0.8, startY: 0.7 },
    ];

    const nightBlobConfigs = [
      { color1: "#06B6D4", color2: "#0EA5E9", startX: 0.2, startY: 0.3 },
      { color1: "#8B5CF6", color2: "#A78BFA", startX: 0.7, startY: 0.4 },
      { color1: "#EC4899", color2: "#F472B6", startX: 0.4, startY: 0.6 },
      { color1: "#FFC64C", color2: "#FBBF24", startX: 0.8, startY: 0.7 },
    ];

    const blobConfigs = isNightMode ? nightBlobConfigs : dayBlobConfigs;

    blobsRef.current = blobConfigs.map((config) => ({
      x: canvas.width * config.startX,
      y: canvas.height * config.startY,
      targetX: canvas.width * config.startX,
      targetY: canvas.height * config.startY,
      radius: 200 + Math.random() * 150,
      targetRadius: 200 + Math.random() * 150,
      color1: config.color1,
      color2: config.color2,
      rotation: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.2,
    }));

    let animationId: number;

    const animateBlobs = () => {
      timeRef.current += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = isNightMode ? "screen" : "multiply";

      blobsRef.current.forEach((blob, index) => {
        blob.x += (blob.targetX - blob.x) * 0.01;
        blob.y += (blob.targetY - blob.y) * 0.01;
        blob.radius += (blob.targetRadius - blob.radius) * 0.01;

        if (Math.random() < 0.003) {
          blob.targetX = Math.random() * canvas.width;
          blob.targetY = Math.random() * canvas.height;
        }

        if (Math.random() < 0.005) {
          blob.targetRadius = 200 + Math.random() * 200;
        }

        const offsetX = Math.sin(timeRef.current * blob.speed + index) * 80;
        const offsetY = Math.cos(timeRef.current * blob.speed * 0.7 + index) * 60;

        const finalX = blob.x + offsetX;
        const finalY = blob.y + offsetY;

        const gradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, blob.radius);

        const opacity1 = isNightMode ? "AA" : "66";
        const opacity2 = isNightMode ? "88" : "4D";

        gradient.addColorStop(0, blob.color1 + opacity1);
        gradient.addColorStop(0.5, blob.color2 + opacity2);
        gradient.addColorStop(1, blob.color1 + "00");

        ctx.save();
        ctx.filter = "blur(50px)";
        ctx.globalAlpha = isNightMode ? 0.7 : 0.4;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(finalX, finalY, blob.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.globalCompositeOperation = "source-over";
      animationId = requestAnimationFrame(animateBlobs);
    };

    animateBlobs();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [isNightMode, isCanvasReady]);

  useEffect(() => {
    const dayBlobConfigs = [
      { color1: "#FFC64C", color2: "#FFB5A0" },
      { color1: "#D4C5F9", color2: "#E8D5FF" },
      { color1: "#B8E6FF", color2: "#B8F5D9" },
      { color1: "#FFB5A0", color2: "#FFC64C" },
    ];

    const nightBlobConfigs = [
      { color1: "#7C3AED", color2: "#A78BFA" },
      { color1: "#06B6D4", color2: "#22D3EE" },
      { color1: "#EC4899", color2: "#F472B6" },
      { color1: "#F59E0B", color2: "#FFC64C" },
    ];

    const configs = isNightMode ? nightBlobConfigs : dayBlobConfigs;

    blobsRef.current.forEach((blob, index) => {
      if (configs[index]) {
        blob.color1 = configs[index].color1;
        blob.color2 = configs[index].color2;
      }
    });
  }, [isNightMode]);

  useEffect(() => {
    if (!isCanvasReady) return;

    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    particlesRef.current = [];

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    const createParticle = (): Particle => {
      const dayColors = ["#FFC64C", "#D4C5F9", "#B8E6FF", "#FFB5A0"];
      const nightColors = ["#22D3EE", "#A78BFA", "#F472B6", "#FFC64C"];
      const colors = isNightMode ? nightColors : dayColors;

      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.2,
        size: 1 + Math.random() * 1.5,
        opacity: isNightMode ? 0.5 + Math.random() * 0.4 : 0.2 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      };
    };

    const maxParticles = 100;
    for (let i = 0; i < maxParticles; i++) {
      particlesRef.current.push(createParticle());
    }

    let animationId: number;

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particlesRef.current.length > maxParticles * 1.5) {
        particlesRef.current = particlesRef.current.slice(-maxParticles);
      }

      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.001;

        if (particle.life <= 0 || particle.y < -20) {
          particlesRef.current[index] = createParticle();
          return;
        }

        ctx.save();
        ctx.globalAlpha = particle.opacity * particle.life;
        ctx.shadowBlur = isNightMode ? 16 : 8;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
      particlesRef.current = [];
    };
  }, [isNightMode, isCanvasReady]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      blobsRef.current.forEach((blob) => {
        const dx = e.clientX - blob.x;
        const dy = e.clientY - blob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
          const force = (300 - distance) / 300;
          blob.targetX = blob.x + (dx / distance) * force * 30;
          blob.targetY = blob.y + (dy / distance) * force * 30;
        }
      });
    };

    const handleClick = (e: MouseEvent) => {
      if (particlesRef.current.length > 150) return;

      const dayColors = ["#FFC64C", "#D4C5F9", "#B8E6FF"];
      const nightColors = ["#22D3EE", "#A78BFA", "#F472B6"];
      const colors = isNightMode ? nightColors : dayColors;

      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 2 + Math.random() * 2,
          opacity: 0.7,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 0.8,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [isNightMode, isCanvasReady]);

  const dayBackground = `radial-gradient(circle at 30% 50%, #FFFFFF 0%, #FAFAFA 60%, #F0F0F0 100%)`;
  const nightBackground = `radial-gradient(circle at 30% 50%, #0A0A0A 0%, #000000 60%, #000000 100%)`;

  return (
    <section
      className="hero-section relative min-h-screen w-full flex items-center overflow-hidden transition-all duration-700"
      style={{ background: isNightMode ? nightBackground : dayBackground }}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ willChange: 'transform, opacity', zIndex: 1 }}
      />

      <canvas 
        ref={particleCanvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ willChange: 'transform, opacity', zIndex: 2 }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(0deg, transparent 0px, rgba(0, 0, 0, 0.01) 1px, transparent 2px, transparent 40px)`,
          opacity: 0.2,
          zIndex: 3,
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen py-24 lg:py-20">
        
        {/* LEFT SIDE - Video */}
        <div className="flex items-center justify-center order-2 lg:order-1 mb-16 lg:mb-0">
          <div className="relative w-full max-w-md lg:max-w-3xl group">
            <div 
              className="absolute -inset-1 rounded-2xl lg:rounded-3xl opacity-75 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg"
              style={{
                backgroundImage: isNightMode
                  ? 'linear-gradient(135deg, #7C3AED, #06B6D4, #EC4899, #7C3AED)'
                  : 'linear-gradient(135deg, #FFC64C, #D4C5F9, #B8E6FF, #FFC64C)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 6s ease infinite',
              }}
            />
            
            <div 
              className="relative rounded-2xl lg:rounded-3xl overflow-hidden"
              style={{
                boxShadow: isNightMode 
                  ? '0 0 60px rgba(124, 58, 237, 0.3), 0 0 100px rgba(6, 182, 212, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.9)' 
                  : '0 0 60px rgba(255, 198, 76, 0.3), 0 0 100px rgba(212, 197, 249, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover aspect-[4/3]"
              >
                <source src="/assets/video/heroteamwork.mp4" type="video/mp4" />
              </video>
              
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isNightMode
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)'
                }}
              />

              <div 
                className="absolute top-3 left-3 lg:top-4 lg:left-4 w-8 h-8 lg:w-12 lg:h-12 border-l-2 border-t-2 rounded-tl-lg opacity-60"
                style={{ borderColor: '#FFC64C' }}
              />
              <div 
                className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 w-8 h-8 lg:w-12 lg:h-12 border-r-2 border-b-2 rounded-br-lg opacity-60"
                style={{ borderColor: '#FFC64C' }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Content */}
        <div className="max-w-xl order-1 lg:order-2 lg:ml-auto text-center lg:text-left mx-auto lg:mx-0">
          <h2
            className="text-lg md:text-xl font-medium mb-3"
            style={{ color: isNightMode ? "#F8F8F8" : "#6B6B6B" }}
        >
          Smart Strategies
          </h2>

        <h1
            className="text-7xl md:text-8xl lg:text-9xl font-black mb-6 lg:mb-8 leading-[0.95]"
            style={{ color: isNightMode ? "#F8F8F8" : "#1A1A1A" }}
        >
            REAL<br />GROWTH
        </h1>

          <p
            className="text-base md:text-lg font-normal mb-4 lg:mb-6"
            style={{ color: isNightMode ? "#F8F8F8" : "#6B6B6B", lineHeight: '1.7' }}
          >
            Vizantir is a remote-first digital marketing agency that helps businesses grow with{" "}
            <span className="font-medium">SEO</span>,{" "}
            <span className="font-medium">Answer Engine Optimization (AEO)</span>,{" "}
            <span className="font-medium">local GEO marketing</span>,{" "}
            <span className="font-medium">conversion-focused web design</span>, and{" "}
            <span className="font-medium">PPC ads that convert</span>.
          </p>

          <p
            className="text-base md:text-lg font-normal mb-8 lg:mb-10 italic"
            style={{ color: isNightMode ? "#F8F8F8" : "#6B6B6B", lineHeight: '1.7' }}
          >
            No offices. No wasted overhead. Just measurable results.
          </p>

          <div className="flex justify-center lg:justify-start">
            <Button
              size="lg"
              asChild
              className="text-base lg:text-lg px-8 lg:px-10 py-6 lg:py-7 font-bold border-0 transition-all duration-300 hover:scale-105"
              style={{
                background: "#FFC64C",
                color: "#1A1A1A",
                borderRadius: "8px",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Link href="/contact">Schedule a Call</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-20">
        {/* Mouse icon */}
        <div 
          className="w-6 h-10 rounded-full border-2 flex justify-center pt-2"
          style={{ 
            borderColor: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Scroll wheel dot */}
          <div 
            className="w-1 h-2 rounded-full animate-scroll-wheel"
            style={{ 
              backgroundColor: isNightMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
        <span 
          className="text-xs uppercase tracking-widest"
          style={{ 
            color: isNightMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
          }}
        >
          Scroll
        </span>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
