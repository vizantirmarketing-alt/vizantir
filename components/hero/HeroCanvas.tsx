'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { CanvasVariant } from './types'

interface HeroCanvasProps {
  variant?: CanvasVariant
}

export default function HeroCanvas({ variant = 'gradient' }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isNightMode } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (variant === 'blobs') {
        // Soft breathing blobs
        const colors = isNightMode 
          ? ['#7C3AED', '#06B6D4', '#EC4899'] 
          : ['#FFC64C', '#D4C5F9', '#B8E6FF']
        
        colors.forEach((color, i) => {
          const x = canvas.width * (0.3 + i * 0.2) + Math.sin(time + i) * 50
          const y = canvas.height * (0.4 + i * 0.1) + Math.cos(time + i) * 30
          const radius = 200 + Math.sin(time * 0.5 + i) * 50

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          gradient.addColorStop(0, color + (isNightMode ? '60' : '40'))
          gradient.addColorStop(1, color + '00')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        })
      } else if (variant === 'gradient') {
        // Flowing gradient
        const gradient = ctx.createLinearGradient(
          0, 0, 
          canvas.width, canvas.height
        )
        if (isNightMode) {
          gradient.addColorStop(0, '#0A0A0A')
          gradient.addColorStop(0.5, '#1a1a2e')
          gradient.addColorStop(1, '#0A0A0A')
        } else {
          gradient.addColorStop(0, '#FAFAFA')
          gradient.addColorStop(0.5, '#F0F0F0')
          gradient.addColorStop(1, '#FAFAFA')
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [variant, isNightMode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}

