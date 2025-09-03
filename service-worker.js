// 缓存名称和版本
const CACHE_NAME = 'hello-world-cache-v1';
// 需要缓存的资源
const urlsToCache = [
  '.',
  'index.html',
  'index.js',
  'manifest.json',
  'icon-192x192.svg',
  'icon-512x512.svg'
];

// 安装阶段
self.addEventListener('install', (event) => {
  // 确保缓存完成后再结束安装
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活阶段
self.addEventListener('activate', (event) => {
  // 删除旧版本缓存
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有匹配的资源，直接返回
        if (response) {
          return response;
        }

        // 克隆请求，因为请求是一个流，只能使用一次
        const fetchRequest = event.request.clone();

        // 发送网络请求
        return fetch(fetchRequest).then(
          (response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应，因为响应是一个流，只能使用一次
            const responseToCache = response.clone();

            // 缓存新的响应
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // 网络请求失败时，可以返回一个备用响应
          return new Response('无法连接到网络，请检查您的网络连接', {
            status: 408,
            headers: {'Content-Type': 'text/plain'}
          });
        });
      })
  );
});

// 监听消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});