"use client";
import { createContext, useContext } from "react";

type ThemeValue = { isNightMode: boolean; toggleTheme: () => void; mounted: boolean };

const ThemeContext = createContext<ThemeValue>({
  isNightMode: false,
  toggleTheme: () => {},
  mounted: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ isNightMode: false, toggleTheme: () => {}, mounted: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
