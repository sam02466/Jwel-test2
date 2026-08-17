// Minimal service worker — listens for push events and shows a
// notification. Moved here from the backend project: a service worker
// has to be registered by JS running on the page the person actually
// has open (the storefront/admin/agent app), not the API server, so it
// belongs in this project's public/ folder, not the backend's. See
// backend/lib/push.ts for the server side that sends these.

self.addEventListener('push', (event) => {
  let data = { title: 'Sarika Beauty Hub', body: 'You have an update.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
