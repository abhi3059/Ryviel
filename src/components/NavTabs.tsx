import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './topnav.css'

const TABS = [
  { id: 'gaming', label: 'Gaming', href: '#gaming' },
  { id: 'streams', label: 'Streams', href: '#streams' },
  { id: 'socials', label: 'Socials', href: '#socials' },
] as const
type TabId = (typeof TABS)[number]['id']

/**
 * Section tabs: one glass pill, fixed at the top centre in both frames. A black highlight slides
 * to the tab you hover, and rests on the section you are currently in.
 */
export default function NavTabs() {
  const [active, setActive] = useState<TabId>('gaming')
  const [hover, setHover] = useState<TabId | null>(null)
  const refs = useRef<Partial<Record<TabId, HTMLAnchorElement | null>>>({})
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)

  // Active tab follows the scroll position: the last section whose top has passed 40% of the screen.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.4
      let current: TabId = 'gaming'
      for (const t of TABS) {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top <= line) current = t.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const target = hover ?? active
  // Only update when the measurement actually changed, so this can never re-render in a loop.
  const measure = useCallback(() => {
    const el = refs.current[target]
    if (!el) return
    setBox((prev) => (prev && prev.left === el.offsetLeft && prev.width === el.offsetWidth ? prev : { left: el.offsetLeft, width: el.offsetWidth }))
  }, [target])
  useLayoutEffect(measure, [measure])
  // Re-measure whenever a tab changes size (the web font arriving, a window resize).
  useEffect(() => {
    const ro = new ResizeObserver(measure)
    Object.values(refs.current).forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [measure])

  return (
    <nav className="nvtabs" aria-label="Sections" onPointerLeave={() => setHover(null)}>
      <span
        className="nvtabs-glow"
        aria-hidden="true"
        style={box ? { width: box.width, transform: `translateX(${box.left}px)`, opacity: 1 } : undefined}
      />
      {TABS.map((t) => (
        <a
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el
          }}
          href={t.href}
          className="nvtabs-link"
          data-active={target === t.id}
          aria-current={active === t.id ? 'location' : undefined}
          onPointerEnter={() => setHover(t.id)}
          onFocus={() => setHover(t.id)}
          onBlur={() => setHover(null)}
        >
          {t.label}
        </a>
      ))}
    </nav>
  )
}
