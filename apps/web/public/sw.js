/* Service Worker — Mẹ & Bé.
 * Chiến lược:
 *  - Trang chính (navigation): network-first, fallback cache (offline shell).
 *  - Static assets (_next/static, font, icon): cache-first.
 *  - API GET: network-first, fallback cache — chỉ cache GET, không cache response lỗi.
 *  - POST/PUT/PATCH/DELETE: không cache (để trình duyệt fetch bình thường).
 * Bump VERSION khi deploy đổi tài sản tĩnh để phá cache cũ.
 */
const VERSION = 'v2'
const SHELL_CACHE = `mevabe-shell-${VERSION}`
const STATIC_CACHE = `mevabe-static-${VERSION}`
const API_CACHE = `mevabe-api-${VERSION}`

/* Trang chính cần chạy offline: dashboard, ghi nhanh, hướng dẫn. */
const SHELL_PATHS = [
  '/',
  '/dashboard',
  '/tuan',
  '/timeline',
  '/do-luong',
  '/trieu-chung',
  '/be',
  '/cai-dat',
]

const OFFLINE_HTML = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Đang ngoại tuyến — Mẹ & Bé</title>
  <style>
    body{font-family:system-ui,sans-serif;background:#faf7f4;color:#2b211c;display:grid;place-items:center;min-height:100dvh;margin:0;text-align:center;padding:24px}
    .card{background:#fff;border:1px solid #eadfd8;border-radius:16px;padding:32px;max-width:380px;width:100%}
    .dot{font-size:40px;line-height:1}
    h1{color:#af614e;font-size:20px;margin:12px 0 8px}
    p{color:#6b5d55;font-size:14px;line-height:1.6;margin:0}
    ol{text-align:left;color:#6b5d55;font-size:13px;line-height:1.8;margin:16px 0 0;padding-left:20px}
    button{margin-top:20px;background:#af614e;color:#fff;border:0;border-radius:999px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer}
    button:active{transform:scale(.97)}
    .app{margin-top:20px;font-size:12px;color:#a89a91}
  </style>
</head>
<body>
  <div class="card">
    <div class="dot">🌸</div>
    <h1>Đang ngoại tuyến</h1>
    <p>Mẹ &amp; Bé chưa kết nối được mạng.<br>Nội dung đã lưu trên máy vẫn xem được offline.</p>
    <ol>
      <li>Kiểm tra Wi-Fi / dữ liệu di động.</li>
      <li>Bật &amp; tắt Chế độ máy bay để nối lại mạng.</li>
      <li>Nhấn <b>Thử lại</b> bên dưới.</li>
    </ol>
    <button type="button" onclick="location.reload()">Thử lại</button>
    <div class="app">Mẹ &amp; Bé — Đồng hành thai kỳ của bạn 💛</div>
  </div>
</body>
</html>`

/* API lỗi khi offline: trả JSON đúng convention { error } thay vì HTML. */
const OFFLINE_API = JSON.stringify({
  error: { code: 'OFFLINE', message: 'Không có kết nối mạng.' },
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Precache offline shell — bỏ qua trang lỗi để không chặn install.
      const cache = await caches.open(SHELL_CACHE)
      await Promise.all(
        SHELL_PATHS.map((path) =>
          fetch(path)
            .then((res) => res.ok && cache.put(path, res.clone()))
            .catch(() => {})
        )
      )
      // Cập nhật tức thì: SW mới activate ngay, không chờ 2 lần reload.
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Dọn cache phiên bản cũ (v1 không để lại rác).
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('mevabe-') && !key.endsWith(`-${VERSION}`))
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

// Vòng đời cập nhật: trang chủ post SKIP_WAITING khi SW mới đã cài xong.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response && response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    // Chỉ cache response thành công — không cache lỗi (status != 200).
    if (response && response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (options.fallback) {
      const cachedFallback = await caches.match(options.fallback)
      if (cachedFallback) return cachedFallback
    }
    // Chưa có cache → trả nội dung offline theo loại (HTML trang / JSON API).
    return new Response(options.body || null, {
      status: options.status || 200,
      headers: options.headers || { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  // Chỉ xử lý GET; POST/PUT/PATCH/DELETE để trình duyệt fetch bình thường.
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // bỏ qua nguồn khác (Google Fonts, ảnh ngoài)

  // API GET (có tham số query/path): network-first, fallback cache — trả JSON lỗi khi offline.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirst(request, API_CACHE, {
        body: OFFLINE_API,
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    )
    return
  }

  // Static assets: cache-first.
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Điều hướng trang: network-first, fallback offline shell, cuối cùng là trang ngoại tuyến.
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, SHELL_CACHE, { fallback: '/dashboard', body: OFFLINE_HTML })
    )
    return
  }

  // Font, icon, ảnh...: cache-first.
  event.respondWith(cacheFirst(request, STATIC_CACHE))
})
