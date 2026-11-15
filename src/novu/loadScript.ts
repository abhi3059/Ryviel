const cache = new Map<string, Promise<void>>()

/** Injects a <script> once and resolves when it has loaded. */
export function loadScript(src: string): Promise<void> {
  let p = cache.get(src)
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.crossOrigin = 'anonymous'
      s.onload = () => resolve()
      s.onerror = () => {
        cache.delete(src)
        s.remove()
        reject(new Error(`Failed to load ${src}`))
      }
      document.head.appendChild(s)
    })
    cache.set(src, p)
  }
  return p
}
