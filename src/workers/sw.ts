/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>
}

interface SkipWaitingMessage {
  type: 'SKIP_WAITING'
}

function isSkipWaitingMessage(data: unknown): data is SkipWaitingMessage {
  return typeof data === 'object' && data !== null && 'type' in data && data.type === 'SKIP_WAITING'
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ url }) => url.pathname.startsWith('/audio/'),
  new CacheFirst({
    cacheName: 'audio-cache-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 })]
  })
)

registerRoute(
  ({ url }) => url.pathname.endsWith('.wasm'),
  new CacheFirst({
    cacheName: 'wasm-cache-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 5 })]
  })
)

registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-cache' })
)

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (isSkipWaitingMessage(event.data)) {
    void self.skipWaiting()
  }
})

