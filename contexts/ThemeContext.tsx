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
  const [isNightMode, setIsNightMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      const shouldBeDark =
        stored === 'night' ||
        (stored === null && document.documentElement.classList.contains('dark'))
      setIsNightMode(shouldBeDark)
    } catch {
      /* ignore */
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (isNightMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isNightMode ? 'night' : 'day')
    } catch {
      /* ignore */
    }
  }, [isNightMode, mounted])

  const toggleTheme = () => setIsNightMode((prev) => !prev)

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
