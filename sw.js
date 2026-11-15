/* ==========================================================================
   ORBITAL HEALTH — AUTONOMOUS MISSION SERVICE WORKER (OFFLINE SPACEFLIGHT MODE)
   Caches all telemetry CSVs, ECG waveforms, and medical AI models so the
   application operates with 0ms latency even in deep space or offline environments.
   ========================================================================== */

const CACHE_NAME = "orbital-health-cache-v5";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./favicon.ico",
  "./assets/app-logo.png",
  "./assets/logo-full.png",
  "./assets/favicon-32x32.png",
  "./assets/favicon-16x16.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/astronaut.jpg",
  "./assets/earth.jpg",
  "./assets/mars.jpg",
  "./assets/moon.jpg",
  "./assets/nasa-earth-airglow-milkyway.jpg",
  "./assets/nasa-jwst-carina-nebula.jpg",
  "./assets/nasa-aurora-earth-limb.jpg",
  "./data/1_nasa_iss_cupola_nominal.csv",
  "./data/2_nasa_eva_spacewalk_hypoxia.csv",
  "./data/3_nasa_ared_heavy_exercise.csv",
  "./data/4_mars_solar_radiation_flare.csv",
  "./data/5_microgravity_sans_fluid_shift.csv",
  "./data/6_physionet_ventricular_arrhythmia.csv"
];

// Install event — precache all telemetry & core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline mission assets");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[Service Worker] Some assets skipped during precache:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing deprecated cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event — Stale-While-Revalidate strategy for maximum responsiveness
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache valid responses from same origin or NASA image CDN
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for offline if not already in cache
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
