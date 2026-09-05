/**
 * QuantNiti Service Worker
 * Progressive Web App Caching & Offline Resilience
 */

const CACHE_VERSION = "quantniti-v1.0.0";
const PRECACHE_ASSETS = [
  "/",
  "/app",
  "/client",
  "/static/index.html",
  "/static/styles.css",
  "/static/app.js",
  "/static/manifest.json",
  "/static/offline.html",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "/static/icons/icon-maskable-192.png",
  "/static/icons/icon-maskable-512.png",
  "/static/icons/icon.svg",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/lucide@latest",
  "https://cdn.jsdelivr.net/npm/chart.js",
];

// Install Event: Pre-cache App Shell & Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { mode: "cors" }))).catch((err) => {
          // In offline or restricted network environments, cache local assets individually
          return Promise.allSettled(
            PRECACHE_ASSETS.map((url) =>
              fetch(url, { mode: "cors" })
                .then((res) => {
                  if (res.ok) return cache.put(url, res);
                })
                .catch(() => {})
            )
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches & Claim Clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_VERSION) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for API, Cache-First / Stale-While-Revalidate for App Shell, Offline Fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // API Requests: Network-First strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // If offline and request is an API request, return a JSON error response or cached data
          return new Response(
            JSON.stringify({
              error: "Network unavailable",
              offline: true,
              message: "QuantNiti is running in offline mode. Live updates will resume once connected.",
            }),
            {
              headers: { "Content-Type": "application/json" },
              status: 503,
            }
          );
        })
    );
    return;
  }

  // Navigation requests (HTML pages): Network first with cached index/offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const cachedRoot = await caches.match("/");
          if (cachedRoot) return cachedRoot;
          const offlinePage = await caches.match("/static/offline.html");
          if (offlinePage) return offlinePage;
          return new Response("QuantNiti is offline.", {
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Icons, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// =====================================================================
// Ticket #20: Web Push Notifications & Notification Interaction
// =====================================================================

self.addEventListener("push", (event) => {
  let data = {
    title: "QuantNiti Smart Alert",
    message: "A new quantitative market signal was detected.",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const options = {
    body: data.message,
    icon: "/static/icons/icon-192.png",
    badge: "/static/icons/icon.svg",
    vibrate: [100, 50, 100],
    data: {
      url: "/app",
      alertId: data.alert_id,
      type: data.type,
    },
    actions: [
      { action: "explore", title: "View Alert" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "QuantNiti Smart Alert", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes("/app") || client.url.includes("/")) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow("/app");
      }
    })
  );
});

