import { useEffect, useState } from 'react'
import { EMAIL } from '../media.ts'

const LINKS = [
  { label: 'Gaming', href: '#gaming' },
  { label: 'Walk', href: '#walk' },
  { label: 'Streams', href: '#streams' },
  { label: 'Socials', href: '#socials' },
]

export default function Navbar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  // Light tone = white text, for a hero on a dark background.
  const ink = tone === "light" ? "text-white" : "text-[#0b0b0b]"
  const bar = tone === "light" ? "bg-white" : "bg-[#0b0b0b]"
  const [open, setOpen] = useState(false)
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
    <>
      <nav className={`mf-nav fixed top-0 left-0 w-full z-10 px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center ${ink}`}>
        <a
          href="#top"
          className="flex items-center gap-3 transition-[opacity,transform] duration-400"
          style={{
            opacity: nameInView && !open ? 0 : 1,
            transform: nameInView && !open ? 'translateY(-6px)' : 'none',
            pointerEvents: nameInView && !open ? 'none' : undefined,
          }}
          aria-hidden={nameInView && !open}
          tabIndex={nameInView && !open ? -1 : undefined}
        >
          <span
            className={`text-[21px] sm:text-[26px] tracking-tight ${ink}`}
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ryviel®
          </span>
          <span
            className={`text-[25px] sm:text-[30px] ${ink} select-none`}
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
        </a>

        <div className={`hidden md:block text-[23px] ${ink}`}>
          {LINKS.map((link, i) => (
            <span key={link.label}>
              <a href={link.href} className="hover:opacity-60 transition-opacity">
                {link.label}
              </a>
              {i < LINKS.length - 1 && ', '}
            </span>
          ))}
        </div>

        <a
          href={`mailto:${EMAIL}`}
          className={`hidden md:inline text-[23px] ${ink} underline underline-offset-2 hover:opacity-60 transition-opacity`}
        >
          Get in touch
        </a>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex flex-col gap-[5px] p-1"
        >
          <span
            className={`block w-6 h-[2px] ${bar} transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`}
          />
          <span
            className={`block w-6 h-[2px] ${bar} transition-all duration-300 ${open ? 'opacity-0' : 'opacity-100'}`}
          />
          <span
            className={`block w-6 h-[2px] ${bar} transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
          />
        </button>
      </nav>

      <div
        className="mf-nav md:hidden fixed inset-0 z-[9] bg-[#e9e6e1]/90 backdrop-blur-md flex flex-col justify-center items-start px-8 gap-8 text-[#0b0b0b] transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        aria-hidden={!open}
      >
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={() => setOpen(false)}
            className="text-[32px] font-medium hover:opacity-60 transition-opacity"
          >
            {link.label}
          </a>
        ))}
        <a
          href={`mailto:${EMAIL}`}
          onClick={() => setOpen(false)}
          className="text-[32px] font-medium underline underline-offset-2 hover:opacity-60 transition-opacity"
        >
          Get in touch
        </a>
      </div>
    </>
  )
}
