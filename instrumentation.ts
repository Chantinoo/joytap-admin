/**
 * Next.js instrumentation - 在服务端启动时执行
 * 为 Node.js 环境提供 localStorage 兼容层，解决 Ant Design CSS-in-JS 在 SSR 时的报错
 */
const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
}

export async function register() {
  if (typeof window === 'undefined') {
    const g = global as unknown as Record<string, unknown>
    if (!g.localStorage || typeof (g.localStorage as Storage).getItem !== 'function') {
      g.localStorage = noopStorage
    }
    if (!g.sessionStorage || typeof (g.sessionStorage as Storage).getItem !== 'function') {
      g.sessionStorage = noopStorage
    }
  }
}
