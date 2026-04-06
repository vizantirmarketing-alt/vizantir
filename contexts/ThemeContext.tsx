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

const THEME_KEY = 'theme'

function applyThemeToDocument(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.documentElement.style.backgroundColor = isDark ? '#000000' : '#FAFAFA'
}

function readStoredTheme(): boolean {
  try {
    let stored = localStorage.getItem(THEME_KEY)
    if (stored !== 'dark' && stored !== 'light') {
      const legacy = localStorage.getItem('vizantir-theme')
      if (legacy === 'dark' || legacy === 'light') {
        localStorage.setItem(THEME_KEY, legacy)
        localStorage.removeItem('vizantir-theme')
        stored = legacy
      }
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return stored === 'dark' || (!stored && prefersDark)
  } catch {
    return false
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isNightMode, setIsNightMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    const isDark = readStoredTheme()
    setIsNightMode(isDark)
    applyThemeToDocument(isDark)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyThemeToDocument(isNightMode)
    try {
      localStorage.setItem(THEME_KEY, isNightMode ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isNightMode, mounted])

  const toggleTheme = () => {
    setIsNightMode((prev) => !prev)
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
