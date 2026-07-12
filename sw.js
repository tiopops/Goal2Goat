/* Service worker mínimo — solo lo necesario para que el navegador
   ofrezca "Añadir a pantalla de inicio" / instalar como app.
   No cachea nada de forma agresiva a propósito: el juego se actualiza
   con frecuencia (game.js lleva ?v=timestamp para evitar caché), y no
   queremos que un service worker sirva versiones antiguas por error.
   Solo pasa las peticiones directamente a la red. */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
