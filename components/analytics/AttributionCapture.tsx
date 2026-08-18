'use client'

import { useEffect } from 'react'
import { captureClientAttribution } from '@/lib/forms/attribution'

export function AttributionCapture() {
  useEffect(() => {
    captureClientAttribution()
  }, [])

  return null
}
