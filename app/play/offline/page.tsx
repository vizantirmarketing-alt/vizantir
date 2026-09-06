import type { Metadata } from 'next'
import Link from 'next/link'

import { OfflineRetryButton } from '@/components/arcade/OfflineRetryButton'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: { absolute: 'OFFLINE' },
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <section className="arcade-offline" role="dialog" aria-labelledby="arcade-offline-title" aria-modal="true">
      <h1 id="arcade-offline-title" className="arcade-offline-title">
        OFFLINE
      </h1>
      <p className="arcade-offline-copy">
        This game needs to be opened online once before it can play offline.
      </p>
      <div className="arcade-overlay-actions">
        <Link href="/play" className="arcade-overlay-btn">
          ARCADE
        </Link>
        <OfflineRetryButton />
      </div>
    </section>
  )
}
