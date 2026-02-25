// public/sw.js

// Service Worker Install hona
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// Background mein notification dikhane ka logic
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NEW_ORDER') {
    const options = {
      body: event.data.body,
      icon: '/favicon.ico', // Aapka shop logo path
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: 'new-order-notification', // Duplicate notifications rokne ke liye
      renotify: true,
      data: { url: '/merchant/dashboard' }
    };

    self.registration.showNotification(event.data.title, options);
  }
});

// Notification click karne par app khulega
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/merchant/dashboard');
    })
  );
});