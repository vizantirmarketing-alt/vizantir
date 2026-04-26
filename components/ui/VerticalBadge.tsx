'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export interface VerticalBadgeProps {
  icon: LucideIcon
  label: string
  isNightMode: boolean
}

export function VerticalBadge({ icon: Icon, label, isNightMode }: VerticalBadgeProps) {
  const surface = isNightMode
    ? {
        background: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(255, 198, 76, 0.3)',
      }
    : {
        background: 'rgba(0, 0, 0, 0.02)',
        borderColor: 'rgba(180, 83, 9, 0.3)',
      }

  const iconColor = isNightMode ? '#FFC64C' : '#B45309'
  const labelColor = isNightMode ? '#FFC64C' : '#1A1A1A'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full border backdrop-blur-md"
      style={{
        background: surface.background,
        borderColor: surface.borderColor,
      }}
    >
      <Icon size={16} style={{ color: iconColor }} />
      <span className="text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </span>
    </motion.div>
  )
}
