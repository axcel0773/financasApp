/* Service worker: SOMENTE app shell e arquivos estáticos. Dados financeiros nunca são guardados em cache. */
const SHELL = 'shell-v1';
const STATIC = 'static-v1';
const OFFLINE_URL = '/offline.html';
const FORM_URL = '/gastos/novo'; // formulário de lançamento (só nomes de carteiras e categorias) abre offline

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll([OFFLINE_URL, '/icon-192.png'])));
  // Sem skipWaiting automático: a nova versão só assume quando a pessoa tocar em "Atualizar".
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => ![SHELL, STATIC].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'LIMPAR') e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // Server Actions (POST) e escritas: sempre rede
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Estáticos versionados do Next, ícones, fontes: cache primeiro
  if (url.pathname.startsWith('/_next/static/') || /\.(?:png|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.open(STATIC).then(async (c) => (await c.match(req)) ?? fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  // Navegações (HTML)
  if (req.mode === 'navigate') {
    if (url.pathname === FORM_URL) {
      e.respondWith(fetch(req).then((r) => { if (r.ok) caches.open(SHELL).then((c) => c.put(FORM_URL, r.clone())); return r; })
        .catch(async () => (await caches.match(FORM_URL)) ?? caches.match(OFFLINE_URL)));
      return;
    }
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
  // Demais GET (dados, RSC): rede, sem cache
});
