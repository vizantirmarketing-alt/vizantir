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
    // Only read localStorage after component mounts (client-side only)
    const saved = localStorage.getItem('vizantir-theme')
    if (saved !== null) {
      setIsNightMode(saved === 'dark')
    }
    setMounted(true)
    
    // Sync data-theme attribute and background after mount
    if (typeof document !== 'undefined') {
      const theme = saved === 'dark' || (saved === null && true) // Default to dark if no saved preference
      document.documentElement.setAttribute('data-theme', theme ? 'dark' : 'light')
      document.documentElement.style.backgroundColor = theme ? '#000000' : '#FAFAFA'
      document.documentElement.style.transition = 'background-color 0.5s ease'
      if (document.body) {
        document.body.style.backgroundColor = theme ? '#000000' : '#FAFAFA'
        document.body.style.transition = 'background-color 0.5s ease'
      }
    }
  }, [])

  useEffect(() => {
    // Only save to localStorage after initial mount
    if (mounted) {
      localStorage.setItem('vizantir-theme', isNightMode ? 'dark' : 'light')
      
      // Update data-theme attribute and background when theme changes
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', isNightMode ? 'dark' : 'light')
        document.documentElement.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
        if (document.body) {
          document.body.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
        }
      }
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
