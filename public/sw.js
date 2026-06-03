// __BUILD_ID__ is replaced with a unique id at build time (see vite.config.js)
// so every deploy gets a fresh cache name and the worker self-updates.
const CACHE = 'c445-__BUILD_ID__'

const PRECACHE = [
  '/',
  '/index.html',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const req = e.request
  const isPageRequest =
    req.mode === 'navigate' || req.destination === 'document'

  // Network-first for the app shell (HTML) so a new deploy loads immediately.
  // Falls back to the cached page only when offline.
  if (isPageRequest) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(req, clone))
          }
          return res
        })
        .catch(() =>
          caches.match(req).then(c => c || caches.match('/index.html'))
        )
    )
    return
  }

  // Cache-first for hashed assets (immutable) and everything else, with a
  // background refresh so the cache stays current.
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(req, clone))
        }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})
