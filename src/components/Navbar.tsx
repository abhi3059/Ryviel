import { useEffect, useState } from 'react'
import { EMAIL } from '../media.ts'

/**
 * Top bar for the first frame: logo (once the big hero name has scrolled away) and "Get in touch".
 * The section tabs, the notification bell and the hamburger are shared with the second frame
 * (see NavTabs, NotificationBell and the orbit header), so they never change between the two.
 */
export default function Navbar() {
  // The big hero name is the logo at the top; the small nav wordmark appears once it scrolls away.
  const [nameInView, setNameInView] = useState(true)

  useEffect(() => {
    const name = document.getElementById('hero-name')
    if (!name) return
    const io = new IntersectionObserver(([entry]) => setNameInView(entry.isIntersecting), {
      rootMargin: '-72px 0px 0px 0px',
    })
    io.observe(name)
    return () => io.disconnect()
  }, [])

  return (
    <nav className="mf-nav fixed top-0 left-0 w-full z-10 px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center text-[#0b0b0b]">
      <a
        href="#top"
        className="flex items-center gap-3 transition-[opacity,transform] duration-400"
        style={{
          opacity: nameInView ? 0 : 1,
          transform: nameInView ? 'translateY(-6px)' : 'none',
          pointerEvents: nameInView ? 'none' : undefined,
        }}
        aria-hidden={nameInView}
        tabIndex={nameInView ? -1 : undefined}
      >
        <span className="text-[21px] sm:text-[26px] tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Ryviel®
        </span>
        <span className="text-[25px] sm:text-[30px] select-none" style={{ letterSpacing: '-0.02em' }}>
          ✳︎
        </span>
      </a>

      <a href={`mailto:${EMAIL}`} className="mf-touch hidden md:inline">
        Get in touch
      </a>
    </nav>
  )
}
