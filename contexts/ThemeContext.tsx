'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  isNightMode: boolean
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always start with dark mode on server to prevent mismatch
  const [isNightMode, setIsNightMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only read localStorage after mount (client-side)
    const saved = localStorage.getItem('vizantir-theme')
    if (saved === 'light') {
      setIsNightMode(false)
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
