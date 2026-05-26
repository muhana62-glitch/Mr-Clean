const CACHE_NAME = 'mrclean-v1'
const STATIC_ASSETS = [
  '/',
  '/pelanggan/login',
  '/karyawan/login',
  '/owner/login',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Hanya cache GET requests
  if (event.request.method !== 'GET') return

  // Jangan cache Supabase API calls
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response baru
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => {
        // Kalau offline, ambil dari cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // Fallback ke halaman utama
          return caches.match('/')
        })
      })
  )
})
