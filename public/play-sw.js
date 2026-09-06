/* Vizantir Arcade service worker. Scoped to /play. Plain script. */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `vizantir-arcade-${CACHE_VERSION}`
const NAV_TIMEOUT_MS = 3000
const OFFLINE_URL = '/play/offline'
const OPENED_PREFIX = '/__arcade-opened'

const PRECACHE_URLS = [
  '/play',
  '/play/breakout',
  '/play/stack',
  '/play/snake',
  '/play/pong',
  '/play/offline',
  '/play/manifest.webmanifest',
  '/play/icons/icon-192.png',
  '/play/icons/icon-512.png',
  '/play/icons/icon-512-maskable.png',
  '/play/icons/apple-touch-icon.png',
  '/play/icons/icon.svg',
]

const GAME_PATHS = ['/play/breakout', '/play/stack', '/play/snake', '/play/pong']

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function isPlayPath(pathname) {
  const path = normalizePath(pathname)
  return path === '/play' || path.startsWith('/play/')
}

function isGamePath(pathname) {
  return GAME_PATHS.includes(normalizePath(pathname))
}

function isRuntimeAsset(pathname) {
  if (pathname.startsWith('/_next/static/')) return true
  return pathname.startsWith('/assets/fonts/') && pathname.endsWith('.woff2')
}

function openedRequest(pathname) {
  return new Request(`${OPENED_PREFIX}${normalizePath(pathname)}`)
}

function isNavigation(request) {
  return request.mode === 'navigate' || request.destination === 'document'
}

async function markOpened(pathname) {
  if (!isGamePath(pathname)) return
  const cache = await caches.open(CACHE_NAME)
  await cache.put(openedRequest(pathname), new Response('1'))
}

async function wasOpened(pathname) {
  const cache = await caches.open(CACHE_NAME)
  return Boolean(await cache.match(openedRequest(pathname)))
}

async function matchCached(cache, request, pathname) {
  const exact = await cache.match(request)
  if (exact) return exact
  const byPath = await cache.match(pathname)
  if (byPath) return byPath
  return cache.match(new URL(pathname, self.location.origin).href)
}

async function fetchWithTimeout(request) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS)
  try {
    return await fetch(request, { signal: controller.signal, cache: 'no-store' })
  } finally {
    clearTimeout(timer)
  }
}

async function networkFirstNav(request) {
  const pathname = normalizePath(new URL(request.url).pathname)
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetchWithTimeout(request)
    if (response && response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
      await markOpened(pathname)
      return response
    }
  } catch {
    // Offline, aborted, or network error — fall through to cache.
  }

  if (isGamePath(pathname) && !(await wasOpened(pathname))) {
    const offline = await matchCached(cache, new Request(OFFLINE_URL), OFFLINE_URL)
    if (offline) return offline
  }

  const cached = await matchCached(cache, request, pathname)
  if (cached) return cached

  const offline = await matchCached(cache, new Request(OFFLINE_URL), OFFLINE_URL)
  if (offline) return offline

  return Response.error()
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.ok && response.type === 'basic') {
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('vizantir-arcade-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isNavigation(request) && isPlayPath(url.pathname)) {
    event.respondWith(networkFirstNav(request))
    return
  }

  if (isRuntimeAsset(url.pathname)) {
    event.respondWith(
      (async () => {
        const response = await cacheFirst(request)
        if (event.clientId) {
          const client = await self.clients.get(event.clientId)
          if (client) {
            try {
              await markOpened(new URL(client.url).pathname)
            } catch {
              // Ignore malformed client URLs.
            }
          }
        }
        return response
      })(),
    )
  }
})
