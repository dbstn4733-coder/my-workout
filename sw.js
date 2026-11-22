// Increment the revision when releasing changes to the offline shell.
const prefix = "my-workout-shell-";
const cacheName = prefix + "v1";
const base = self.registration.scope;
const home = new URL("index.html", base).href;
const files = ["index.html", "manifest.json", "icons/icon-192.png",
  "icons/icon-512.png", "icons/apple-touch-icon.png"].map(path => new URL(path, base).href);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll(files.map(url => new Request(url, {cache: "reload"})))
  ));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  url.search = "";
  const key = request.mode === "navigate" && url.href === base ? home : url.href;
  if (!files.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(key) || fetch(request);
  })());
});