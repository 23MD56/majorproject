import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

function generatePwaServiceWorkerPlugin(): Plugin {
  return {
    name: "vite-plugin-quantniti-sw",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "src/app/static/dist");
      const assetsDir = path.resolve(distDir, "assets");
      const swSrcPath = path.resolve(__dirname, "src/app/static/sw.js");

      if (!fs.existsSync(assetsDir)) return;

      const assetFiles = fs.readdirSync(assetsDir);
      const assetUrls = assetFiles.map((file) => `/static/dist/assets/${file}`);

      const baseAssets = [
        "/",
        "/app",
        "/client",
        "/vite",
        "/static/dist/index.html",
        "/static/manifest.json",
        "/static/offline.html",
        "/static/icons/icon-192.png",
        "/static/icons/icon-512.png",
        "/static/icons/icon-maskable-192.png",
        "/static/icons/icon-maskable-512.png",
        "/static/icons/icon.svg",
      ];

      const allPrecache = Array.from(new Set([...baseAssets, ...assetUrls]));
      const timestamp = Date.now();

      const swContent = `/**
 * QuantNiti Service Worker
 * Progressive Web App Caching & Offline Resilience
 * Auto-generated with Vite production asset bundle
 */

const CACHE_VERSION = "quantniti-v${timestamp}";
const PRECACHE_ASSETS = ${JSON.stringify(allPrecache, null, 2)};

// Install Event: Pre-cache App Shell & Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { mode: "cors" })
              .then((res) => {
                if (res.ok) return cache.put(url, res);
              })
              .catch(() => {})
          )
        );
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

// Fetch Event: Network-First for API, Cache-First/Stale-While-Revalidate for Assets, Offline Fallback for Navigation
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
      fetch(request).catch(() => {
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

  // Navigation requests: Network-First with cached shell/offline fallback
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
          const cachedRoot = (await caches.match("/static/dist/index.html")) || (await caches.match("/"));
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

  // Static Assets: Stale-While-Revalidate
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

// Web Push Notifications & Notification Click
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
      for (const client of windowClients) {
        if (client.url.includes("/app") || client.url.includes("/") || client.url.includes("/vite")) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/app");
      }
    })
  );
});
`;

      fs.writeFileSync(swSrcPath, swContent, "utf-8");
      fs.writeFileSync(path.resolve(distDir, "sw.js"), swContent, "utf-8");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), generatePwaServiceWorkerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/frontend"),
    },
  },
  base: "/static/dist/",
  server: {
    host: "0.0.0.0",
    port: 5173,
    cors: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    cors: true,
  },
  build: {
    outDir: "src/app/static/dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["chart.js", "react-chartjs-2"],
          "vendor-motion": ["framer-motion"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/frontend/setup.ts"],
  },
} as any);
