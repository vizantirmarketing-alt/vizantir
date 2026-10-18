'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackCTAClick } from '@/lib/analytics'

export function PricingOverviewCta() {
  return (
    <Button
      asChild
      variant="default"
      className="group mt-6 rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt"
    >
      <Link href="/services" onClick={() => trackCTAClick('view_pricing', 'pricing_overview')}>
        See full pricing
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  )
}
