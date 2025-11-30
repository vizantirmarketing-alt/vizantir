'use client'

import { createContext, useContext, useState, useLayoutEffect, useEffect, ReactNode } from 'react'

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

// Helper to get initial theme - safe for SSR
function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true // Default to dark for SSR
  
  try {
    const saved = localStorage.getItem('vizantir-theme')
    if (saved) {
      return saved === 'dark'
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return true // Default to dark on error
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize with function to read from localStorage synchronously on client
  const [isNightMode, setIsNightMode] = useState(() => getInitialTheme())
  const [mounted, setMounted] = useState(false)

  // Use useLayoutEffect to read theme before first paint (prevents flash)
  useLayoutEffect(() => {
    const initialMode = getInitialTheme()
    setIsNightMode(initialMode)
    setMounted(true)
    
    // Sync data-theme attribute and background immediately
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialMode ? 'dark' : 'light')
      document.documentElement.style.backgroundColor = initialMode ? '#000000' : '#FAFAFA'
      if (document.body) {
        document.body.style.backgroundColor = initialMode ? '#000000' : '#FAFAFA'
      }
    }
  }, [])

  useEffect(() => {
    // Update data-theme attribute and background when theme changes
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isNightMode ? 'dark' : 'light')
      // Add smooth transitions to document elements
      document.documentElement.style.transition = 'background-color 0.5s ease'
      document.documentElement.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
      if (document.body) {
        document.body.style.transition = 'background-color 0.5s ease'
        document.body.style.backgroundColor = isNightMode ? '#000000' : '#FAFAFA'
      }
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
