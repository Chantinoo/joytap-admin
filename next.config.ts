/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['via.placeholder.com', 'images.unsplash.com'],
  },
  experimental: {
    // 开发时启用 Turbopack 文件系统缓存，冷启动约快 10 倍
    turbopackFileSystemCacheForDev: true,
  },
}

module.exports = nextConfig
