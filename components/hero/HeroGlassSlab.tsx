'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface GlassSlabProps {
  children: React.ReactNode
  className?: string
}

export default function HeroGlassSlab({ children, className = '' }: GlassSlabProps) {
  const { isNightMode } = useTheme()
  
  return (
    <div
      className={`rounded-2xl p-8 md:p-12 ${className}`}
      style={{
        background: isNightMode 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isNightMode 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isNightMode
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </div>
  )
}

