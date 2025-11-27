'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300)
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full"
      style={{ background: '#FFC64C' }}
    >
      <ArrowUp size={20} color="#1A1A1A" />
    </button>
  )
}

export default BackToTop

