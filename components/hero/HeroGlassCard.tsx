'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface GlassCardProps {
  icon?: React.ReactNode
  label: string
  description?: string
}

export default function HeroGlassCard({ icon, label, description }: GlassCardProps) {
  const { isNightMode } = useTheme()
  
  return (
    <div
      className="rounded-xl p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{
        background: isNightMode 
          ? 'rgba(255, 255, 255, 0.08)' 
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isNightMode 
          ? '1px solid rgba(255, 255, 255, 0.12)' 
          : '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      {icon && <div className="mb-3 text-primary">{icon}</div>}
      <h3 
        className="font-semibold mb-1"
        style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
      >
        {label}
      </h3>
      {description && (
        <p 
          className="text-sm"
          style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
        >
          {description}
        </p>
      )}
    </div>
  )
}

