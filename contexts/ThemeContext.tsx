'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
} from 'react'

interface ThemeContextType {
  isNightMode: boolean
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'vizantir-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isNightMode, setIsNightMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setIsNightMode(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setIsNightMode((prev) => {
      const next = !prev
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next ? 'night' : 'day')
        } catch {
          /* ignore */
        }
      }
      return next
    })
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
