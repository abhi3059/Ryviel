import { useCallback, useEffect, useRef, useState } from 'react'
import posts from '../data/instagram.json'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../media.ts'
import { InstagramLogo, ReelIcon } from './logos.tsx'

const N = posts.length
const DURATION = 3800 // ms each post stays up

/**
 * Instagram posts as stories: they play one after another inside a phone, with progress bars.
 * Tap the right of the screen for the next post, the left third for the previous one; hold to pause;
 * or pick a bubble. Paused while off screen, and no auto-advance with reduced motion.
 */
export default function StoryPhone() {
  const [cur, setCur] = useState(0)
  const curRef = useRef(0)
  const bars = useRef<(HTMLElement | null)[]>([])
  const st = useRef({ elapsed: 0, held: false, visible: false })
  const root = useRef<HTMLDivElement>(null)
  const reduced = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const paintBars = useCallback((progress: number) => {
    bars.current.forEach((b, k) => {
      if (b) b.style.width = k < curRef.current ? '100%' : k === curRef.current ? `${progress * 100}%` : '0%'
    })
  }, [])

  const go = useCallback(
    (i: number) => {
      const next = (i + N) % N
      curRef.current = next
      st.current.elapsed = 0
      setCur(next)
      paintBars(0)
    },
    [paintBars],
  )

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => (st.current.visible = e.isIntersecting), { threshold: 0.35 })
    io.observe(root.current!)
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - last)
      last = now
      const s = st.current
      if (!s.visible || s.held || reduced.current || document.hidden) return
      s.elapsed += dt
      if (s.elapsed >= DURATION) go(curRef.current + 1)
      else paintBars(s.elapsed / DURATION)
    }
    paintBars(0)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [go, paintBars])

  const post = posts[cur]
  const hold = (held: boolean) => () => (st.current.held = held)

  return (
    <div ref={root} className="nv-story-wrap">
      <div className="nv-story-head" data-reveal="">
        <span className="nv-label nv-story-eyebrow">Stories, on the website</span>
        <h3>Tap through like the app</h3>
        <p>Posts play one after another with progress bars. Tap the screen to skip, hold to pause, or pick a bubble.</p>
        <a className="nv-ig-handle" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
          <InstagramLogo className="nv-ig-logo" />
          <span>
            <span className="nv-ig-name">Instagram</span>
            <span className="nv-ig-at">@{INSTAGRAM_HANDLE}</span>
          </span>
          <span className="nv-label nv-ig-follow-btn">
            Follow <i>↗</i>
          </span>
        </a>
      </div>

      <div className="nv-phone" data-reveal="">
        <div
          className="nv-screen"
          role="group"
          aria-roledescription="carousel"
          aria-label={`Instagram posts from @${INSTAGRAM_HANDLE}. Tap to go to the next post.`}
          tabIndex={0}
          onPointerDown={hold(true)}
          onPointerUp={hold(false)}
          onPointerLeave={hold(false)}
          onPointerCancel={hold(false)}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) return
            const r = e.currentTarget.getBoundingClientRect()
            go(e.clientX - r.left < r.width / 3 ? cur - 1 : cur + 1)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              go(cur + 1)
            }
            if (e.key === 'ArrowLeft') go(cur - 1)
          }}
        >
          {posts.map((p, i) => (
            <span key={p.code} className={`nv-slide${i === cur ? ' on' : ''}`}>
              <img className="bg" src={p.image} alt="" loading={i < 2 ? 'eager' : 'lazy'} draggable={false} />
              <img
                className="fg"
                src={p.image}
                alt={i === cur ? `${p.type === 'reel' ? 'Reel' : 'Post'} from ${p.date}` : ''}
                loading={i < 2 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </span>
          ))}
          <div className="nv-story-shade" aria-hidden="true" />
          <div className="nv-story-bars" aria-hidden="true">
            {posts.map((p, i) => (
              <i key={p.code}>
                <b ref={(el) => void (bars.current[i] = el)} />
              </i>
            ))}
          </div>
          <div className="nv-story-who">
            <span className="nv-story-av">R</span>
            {INSTAGRAM_HANDLE}
            <em>· {post.date}</em>
            {post.type === 'reel' && <ReelIcon className="nv-story-reel" />}
          </div>
          <a className="nv-story-open nv-label" href={post.url} target="_blank" rel="noreferrer">
            Open on Instagram <i>↗</i>
          </a>
        </div>
      </div>

      <div className="nv-story-foot" data-reveal="">
        <div className="nv-story-thumbs">
          {posts.map((p, i) => (
            <button
              key={p.code}
              type="button"
              className={i === cur ? 'on' : ''}
              aria-label={`Show post from ${p.date}`}
              aria-current={i === cur}
              onClick={() => go(i)}
            >
              <img src={p.image} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
