'use client'

import { useEffect } from 'react'

export function ArcadeServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const skipWaiting = (worker: ServiceWorker | null) => {
      worker?.postMessage('SKIP_WAITING')
    }

    const register = () => {
      void navigator.serviceWorker.register('/play-sw.js', { scope: '/play' }).then((registration) => {
        skipWaiting(registration.waiting)
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') skipWaiting(worker)
          })
        })
      })
    }

    if (document.readyState === 'complete') {
      register()
      return
    }

    window.addEventListener('load', register, { once: true })
    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
