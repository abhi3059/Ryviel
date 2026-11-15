import { useEffect, useRef, useState } from 'react'
import { useTypewriter } from '../hooks/useTypewriter.ts'
import { EMAIL, KICK_URL, INSTAGRAM_URL } from '../media.ts'
import RegisteredMark from './RegisteredMark.tsx'
import './hero.css'

const NAME = 'Ryviel'
const MESSAGE = 'Glad you dropped in. Headphones on, mic hot. So, what are we playing tonight?'
const PILLS = [
  { label: 'Watch the stream', href: KICK_URL },
  { label: 'Latest streams', href: '#streams' },
  { label: 'Follow on Instagram', href: INSTAGRAM_URL },
  { label: 'See him walk', href: '#walk' },
]
const INTRO_BLUR_MAX = 8 // px of blur on the intro line once scrolled
const INTRO_BLUR_DISTANCE = 0.35 // fraction of the viewport height to reach full blur

const pillBase =
  'inline-flex items-center justify-center rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap transition-colors duration-200 cursor-pointer'
const whitePill = `${pillBase} bg-white text-black border border-black/10 hover:bg-black hover:text-white`

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="8" height="8" rx="1" stroke="currentColor" />
      <rect x="0.5" y="0.5" width="8" height="8" rx="1" stroke="currentColor" />
    </svg>
  )
}

export default function Hero({ tone = "dark" }: { tone?: "dark" | "light" }) {
  // Light tone = white copy, for a hero on a dark background.
  const light = tone === "light"
  const inkHex = light ? "#fff" : "#0b0b0b"
  const { displayed, done } = useTypewriter(MESSAGE, 38, 600)
  const [pillsVisible, setPillsVisible] = useState(false)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setPillsVisible(true), 400)
    return () => window.clearTimeout(t)
  }, [])

  // The name rises in letter by letter, the same entrance as the GAMING wordmark below.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const letters = Array.from(nameRef.current!.querySelectorAll('[data-char]'))
    const anims = letters.map((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(60%) rotate(4deg)' }, {}], {
        duration: 1100,
        delay: 150 + i * 55,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'backwards',
      }),
    )
    return () => anims.forEach((a) => a.cancel())
  }, [])

  // The intro line is sharp at the top of the page and blurs away as you scroll.
  useEffect(() => {
    const el = introRef.current!
    let raf = 0
    const update = () => {
      raf = 0
      const s = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * INTRO_BLUR_DISTANCE)))
      el.style.filter = s > 0.001 ? `blur(${(s * INTRO_BLUR_MAX).toFixed(2)}px)` : 'none'
      el.style.opacity = (1 - s * 0.4).toFixed(3)
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

  return (
    <section
      id="top"
      className="relative z-[1] h-screen min-h-[560px] flex flex-col justify-between pt-[84px] sm:pt-[100px] pb-10 sm:pb-12 px-5 sm:px-8 md:px-10 overflow-hidden"
    >
      {/* Title pinned top-left; the copy sits at the bottom, leaving open room between them. */}
      <h1 ref={nameRef} id="hero-name" className={`hero-name relative z-10${light ? " hero-name--light" : ""}`} aria-label="Ryviel">
        {[...NAME].map((c, i) => (
          <span key={i} data-char="" aria-hidden="true">
            {c}
          </span>
        ))}
        <span data-char="" className="hero-name-r" aria-hidden="true">
          <RegisteredMark />
        </span>
      </h1>

      <div className="max-w-xl relative z-10">
        <p
          ref={introRef}
          className="mb-5 sm:mb-6"
          style={{
            fontSize: 'clamp(18px, 4vw, 26px)',
            lineHeight: 1.3,
            fontWeight: 400,
            color: inkHex,
            willChange: 'filter, opacity',
          }}
        >
          Hey there, meet Ryviel,
          <br />
          Ryviel Gaming's resident streamer and over-thinker
        </p>

        <p
          className={`${light ? "text-white" : "text-[#0b0b0b]"} mb-5 sm:mb-6`}
          style={{ fontSize: 'clamp(18px, 4vw, 26px)', lineHeight: 1.35, fontWeight: 400, minHeight: 54 }}
        >
          {displayed}
          {!done && (
            <span
              className={`inline-block w-[2px] h-[1.1em] ${light ? "bg-white" : "bg-[#0b0b0b]"} align-middle ml-[2px]`}
              style={{ animation: 'blink 1s step-end infinite' }}
            />
          )}
        </p>

        <div
          className="flex flex-wrap gap-y-1"
          style={{
            opacity: pillsVisible ? 1 : 0,
            transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {PILLS.map((p) =>
            p.href ? (
              <a
                key={p.label}
                href={p.href}
                className={whitePill}
                {...(p.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {p.label}
              </a>
            ) : (
              <button key={p.label} type="button" className={whitePill}>
                {p.label}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(EMAIL).catch(() => {})}
            className={`${pillBase} gap-2 sm:gap-3 bg-transparent ${light ? "text-white border-white hover:bg-white hover:text-black" : "text-[#0b0b0b] border-[#0b0b0b] hover:bg-[#0b0b0b] hover:text-white"} border`}
          >
            <span>
              Reach us: <span className="underline underline-offset-1">{EMAIL}</span>
            </span>
            <CopyIcon />
          </button>
        </div>
      </div>
    </section>
  )
}
