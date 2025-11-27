'use client'

import { useTheme } from '@/contexts/ThemeContext'

const Hero = () => {
  const { isNightMode } = useTheme()

  return (
    <section
      className="min-h-[60vh] flex items-center justify-center px-4 pt-24"
      style={{ background: isNightMode ? '#000' : '#FAFAFA' }}
    >
      <div className="text-center max-w-4xl">
        <h1
          className="text-5xl md:text-7xl font-black mb-6"
          style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
        >
          About
        </h1>
      </div>
    </section>
  )
}

export default Hero

