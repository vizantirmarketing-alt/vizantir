'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { mounted } = useTheme()

  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return <>{children}</>
}
