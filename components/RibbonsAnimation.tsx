'use client'

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Ribbon {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color: string;
  opacity: number;
  offset: number;
  speed: number;
  angle: number;
}

const RibbonsAnimation = () => {
  const { isNightMode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ribbonsRef = useRef<Ribbon[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dayRibbonConfigs = [
      { color: "#FFC64C", angle: 35, startY: 0.15, speed: 0.5, width: 180, opacity: 0.35 },
      { color: "#FFB5A0", angle: -25, startY: 0.45, speed: 0.4, width: 200, opacity: 0.3 },
      { color: "#D4C5F9", angle: 50, startY: 0.7, speed: 0.55, width: 160, opacity: 0.32 },
      { color: "#B8E6FF", angle: -40, startY: 0.85, speed: 0.45, width: 140, opacity: 0.28 },
    ];

    const nightRibbonConfigs = [
      { color: "#00D9FF", angle: 35, startY: 0.15, speed: 0.5, width: 180, opacity: 0.45 },
      { color: "#C084FC", angle: -25, startY: 0.45, speed: 0.4, width: 200, opacity: 0.4 },
      { color: "#FF6B9D", angle: 50, startY: 0.7, speed: 0.55, width: 160, opacity: 0.42 },
      { color: "#FFC64C", angle: -40, startY: 0.85, speed: 0.45, width: 140, opacity: 0.35 },
    ];

    const ribbonConfigs = isNightMode ? nightRibbonConfigs : dayRibbonConfigs;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const updateRibbons = () => {
      ribbonsRef.current = ribbonConfigs.map((config, index) => {
        const angleRad = (config.angle * Math.PI) / 180;
        const length = canvas.width * 2.5;
        return {
          startX: -canvas.width * 0.5,
          startY: canvas.height * config.startY,
          endX: -canvas.width * 0.5 + Math.cos(angleRad) * length,
          endY: canvas.height * config.startY + Math.sin(angleRad) * length,
          width: config.width,
          color: config.color,
          opacity: config.opacity,
          offset: (index * canvas.width * 0.5), // Stagger ribbons evenly
          speed: config.speed,
          angle: angleRad,
        };
      });
    };
    
    setCanvasSize();
    updateRibbons();
    
    const handleResize = () => {
      setCanvasSize();
      updateRibbons();
    };
    
    window.addEventListener("resize", handleResize);

    const animateRibbons = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ribbonsRef.current.forEach((ribbon) => {
        ribbon.offset += ribbon.speed;
        
        // Reset when ribbon moves past screen - creates seamless loop
        const resetThreshold = canvas.width * 2;
        if (ribbon.offset > resetThreshold) {
          ribbon.offset = -canvas.width * 0.8;
        }

        const currentStartX = ribbon.startX + ribbon.offset;
        const currentStartY = ribbon.startY;
        const currentEndX = ribbon.endX + ribbon.offset;
        const currentEndY = ribbon.endY;

        const gradient = ctx.createLinearGradient(
          currentStartX,
          currentStartY,
          currentEndX,
          currentEndY
        );

        gradient.addColorStop(0, ribbon.color + "00");
        gradient.addColorStop(0.15, ribbon.color + "40");
        gradient.addColorStop(0.5, ribbon.color + "AA");
        gradient.addColorStop(0.85, ribbon.color + "40");
        gradient.addColorStop(1, ribbon.color + "00");

        ctx.save();
        ctx.globalCompositeOperation = isNightMode ? "screen" : "multiply";
        ctx.filter = `blur(${30}px)`;
        ctx.globalAlpha = ribbon.opacity;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = ribbon.width;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(currentStartX, currentStartY);
        ctx.lineTo(currentEndX, currentEndY);
        ctx.stroke();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animateRibbons);
    };

    animateRibbons();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isNightMode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 1,
        imageRendering: 'crisp-edges',
        // @ts-ignore - WebkitImageRendering is valid CSS
        WebkitImageRendering: 'crisp-edges',
      }}
    />
  );
};

export default RibbonsAnimation;