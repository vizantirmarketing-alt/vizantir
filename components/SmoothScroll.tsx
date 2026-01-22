'use client'

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset scroll position on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  // Use CSS smooth scrolling instead of JS-based Lenis
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    return () => {
      document.documentElement.style.scrollBehavior = '';
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return <>{children}</>;
}

