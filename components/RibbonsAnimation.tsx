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

    // Get DPR - will be recalculated in resizeCanvas to handle changes
    const initialDpr = window.devicePixelRatio || 1;

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

    const updateRibbons = () => {
      const rect = canvas.getBoundingClientRect();
      const visualWidth = rect.width;
      const visualHeight = rect.height;
      
      ribbonsRef.current = ribbonConfigs.map((config, index) => {
        const angleRad = (config.angle * Math.PI) / 180;
        const length = visualWidth * 2.5;
        return {
          startX: -visualWidth * 0.5,
          startY: visualHeight * config.startY,
          endX: -visualWidth * 0.5 + Math.cos(angleRad) * length,
          endY: visualHeight * config.startY + Math.sin(angleRad) * length,
          width: config.width,
          color: config.color,
          opacity: config.opacity,
          offset: (index * visualWidth * 0.5), // Stagger ribbons evenly
          speed: config.speed,
          angle: angleRad,
        };
      });
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const currentDpr = window.devicePixelRatio || 1;
      
      // Set actual canvas size (physical pixels)
      // Setting width/height automatically resets the context, so we must set transform after
      canvas.width = rect.width * currentDpr;
      canvas.height = rect.height * currentDpr;
      
      // CRITICAL: Always reset transform before scaling
      // This prevents transform accumulation that causes blurriness
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(currentDpr, currentDpr);
      
      // Set display size (CSS pixels)
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Debug logging - remove after confirming fix
      console.log('Canvas resize:', {
        width: canvas.width,
        height: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height,
        dpr: currentDpr,
        transform: ctx.getTransform()
      });
    };
    
    resizeCanvas();
    updateRibbons();
    
    const handleResize = () => {
      resizeCanvas();
      updateRibbons();
    };
    
    window.addEventListener("resize", handleResize);

    const animateRibbons = () => {
      const rect = canvas.getBoundingClientRect();
      const visualWidth = rect.width;
      const visualHeight = rect.height;
      const currentDpr = window.devicePixelRatio || 1;
      
      // Verify canvas dimensions match expected size
      // If they don't, trigger a resize (this handles edge cases)
      const expectedWidth = rect.width * currentDpr;
      const expectedHeight = rect.height * currentDpr;
      if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
        resizeCanvas();
        return; // Skip this frame, let resize complete
      }
      
      // Clear the canvas in scaled coordinates
      ctx.clearRect(0, 0, visualWidth, visualHeight);
      
      ribbonsRef.current.forEach((ribbon) => {
        ribbon.offset += ribbon.speed;
        
        // Reset when ribbon moves past screen - creates seamless loop
        const resetThreshold = visualWidth * 2;
        if (ribbon.offset > resetThreshold) {
          ribbon.offset = -visualWidth * 0.8;
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
        // Blur is in the scaled coordinate system, so 30px gives 30px visual blur
        // But on high DPR, we may need to adjust for crisp rendering
        ctx.filter = `blur(${30}px)`;
        ctx.globalAlpha = ribbon.opacity;
        ctx.strokeStyle = gradient;
        // lineWidth is in scaled coordinates (already accounts for DPR via ctx.scale)
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
      style={{ zIndex: 1 }}
    />
  );
};

export default RibbonsAnimation;