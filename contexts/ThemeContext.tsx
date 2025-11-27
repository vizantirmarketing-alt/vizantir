'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  isNightMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isNightMode: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isNightMode, setIsNightMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('vizantir-theme')
    if (saved) setIsNightMode(saved === 'dark')
  }, [])

  const toggleTheme = () => {
    setIsNightMode(prev => {
      const newMode = !prev
      localStorage.setItem('vizantir-theme', newMode ? 'dark' : 'light')
      return newMode
    })
  }

  return (
    <ThemeContext.Provider value={{ isNightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
