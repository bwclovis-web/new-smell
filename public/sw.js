const STATIC_CACHE = 'voodoo-static-v2'
const DYNAMIC_CACHE = 'voodoo-dynamic-v2'

// Only cache critical assets for faster initial load
const CRITICAL_ASSETS = [
  '/',
  '/images/home.webp',
  '/images/scent.webp'
]

// Install event - cache only critical assets
self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(CRITICAL_ASSETS)))
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName)
          }
        }))))
  self.clients.claim()
})

// Fetch event - optimized caching strategy
self.addEventListener('fetch', event => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  const url = new URL(request.url)
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }
  
  // Handle critical assets with cache-first strategy
  if (CRITICAL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(response => 
        response || fetch(request)
      )
    )
    return
  }
  
  // Handle other requests with network-first and cache on success
  event.respondWith(
    fetch(request).then(fetchResponse => {
      // Cache successful responses
      if (fetchResponse.status === 200) {
        const responseClone = fetchResponse.clone()
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, responseClone)
        })
      }
      return fetchResponse
    }).catch(() => 
      // Fallback to cache
      caches.match(request)
    )
  )
})

// Removed unused background sync functionality to reduce bundle size
