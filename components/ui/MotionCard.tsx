'use client'

import { motion } from 'framer-motion'

import { Card } from '@/components/ui/Card'

/** Card with framer-motion props (initial, whileInView, variants...). */
export const MotionCard = motion.create(Card)
