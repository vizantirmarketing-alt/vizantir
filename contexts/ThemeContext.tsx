'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  isNightMode: boolean
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Light on server and first client paint so SSR/CSR match; localStorage applies after mount.
  const [isNightMode, setIsNightMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('vizantir-theme')
    if (saved === 'dark') {
      setIsNightMode(true)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Update DOM and localStorage when theme changes
      document.documentElement.setAttribute('data-theme', isNightMode ? 'dark' : 'light')
      document.documentElement.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
      localStorage.setItem('vizantir-theme', isNightMode ? 'dark' : 'light')
    }
  }, [isNightMode, mounted])

  const toggleTheme = () => {
    setIsNightMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isNightMode, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
