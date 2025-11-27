'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ServicesPage() {
  const { isNightMode } = useTheme()
  return (
    <div 
      className="min-h-screen pt-24 px-4"
      style={{ background: isNightMode ? '#000' : '#FAFAFA' }}
    >
      <div className="container mx-auto">
        <h1 
          className="text-5xl font-black"
          style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
        >
          Services
        </h1>
      </div>
    </div>
  )
}

