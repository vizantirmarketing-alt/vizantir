'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  isNightMode: boolean
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  isNightMode: true,
  toggleTheme: () => {},
  mounted: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isNightMode, setIsNightMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const saved = localStorage.getItem('vizantir-theme')
    const initialMode = saved ? saved === 'dark' : true
    setIsNightMode(initialMode)
    setMounted(true)
    
    // Sync data-theme attribute
    document.documentElement.setAttribute('data-theme', initialMode ? 'dark' : 'light')
    document.documentElement.style.backgroundColor = initialMode ? '#000000' : '#FAFAFA'
    document.body.style.backgroundColor = initialMode ? '#000000' : '#FAFAFA'
  }, [])

  useEffect(() => {
    // Update data-theme attribute and background when theme changes
    if (mounted) {
      document.documentElement.setAttribute('data-theme', isNightMode ? 'dark' : 'light')
      document.documentElement.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
      document.body.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
    }
  }, [isNightMode, mounted])

  const toggleTheme = () => {
    setIsNightMode(prev => {
      const newMode = !prev
      localStorage.setItem('vizantir-theme', newMode ? 'dark' : 'light')
      return newMode
    })
  }

  return (
    <ThemeContext.Provider value={{ isNightMode, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
