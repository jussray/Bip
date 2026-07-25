/**
 * Service Worker - Offline Support & Caching Strategy
 * Enables Bip to work without network connection
 * Implements local-first architecture
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `sekret-bip-${CACHE_VERSION}`
const RUNTIME_CACHE = `sekret-bip-runtime-${CACHE_VERSION}`

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/app.js',
  '/offline.html',
]

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Skip waiting to activate new SW immediately
  self.skipWaiting()
})

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName.startsWith('sekret-bip-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

/**
 * Fetch event - implement caching strategy
 * Strategy: Network-first for API, Cache-first for assets
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API calls: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Assets: cache-first, fallback to network
  if (isAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Navigation: network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request))
    return
  }
})

/**
 * Network-first strategy
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Network failed, try cache
    console.log('[SW] Network failed, using cache:', request.url)
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline')
    }
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Cache-first strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Check if URL is an asset (not API)
 */
function isAsset(pathname: string): boolean {
  return /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/i.test(pathname)
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
