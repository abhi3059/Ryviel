import { useEffect, useRef, useState, type ReactNode } from 'react'
import streams from '../data/streams.json'
import { useKickLive } from '../hooks/useKickLive.ts'
import { useStreamLists, type Row } from '../hooks/useStreamLists.ts'
import { KickLogo, YouTubeLogo } from './logos.tsx'

const thisYear = new Date().getFullYear()
const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== thisYear ? { year: 'numeric' } : {}),
  })
}
const fmtDuration = (ms: number) => {
  const m = Math.round(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`
}
const fmtViews = (n: number) =>
  `${n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : n} view${n === 1 ? '' : 's'}`

const external = { target: '_blank', rel: 'noreferrer' } as const

function Column({
  logo,
  name,
  meta,
  href,
  badge,
  rows,
  kind,
  ready,
  onBad,
  active,
  onActive,
}: {
  logo: ReactNode
  name: string
  meta: string
  href: string
  badge?: ReactNode
  rows: Row[]
  kind: 'kick' | 'youtube'
  ready: boolean
  onBad: (url: string) => void
  /** The stream being hovered (or centred on phones); its thumbnail fills this column's side of the page. */
  active: string | null
  onActive: (url: string | null) => void
}) {
  return (
    <div className={`nv-stream-col nv-stream-${kind}`}>
      <div className="nv-stream-bg" aria-hidden="true">
        {rows.map(
          (r) =>
            r.thumbnail && (
              <img key={r.url} src={r.thumbnail} alt="" referrerPolicy="no-referrer" draggable={false} className={active === r.url ? 'on' : ''} />
            ),
        )}
      </div>
      <a className="nv-stream-head" href={href} {...external}>
        {logo}
        <span className="nv-stream-name">{name}</span>
        <span className="nv-stream-meta">{meta}</span>
        {badge}
        <span className="nv-stream-open nv-label">
          Open channel <i>↗</i>
        </span>
      </a>
      <ul className="nv-stream-list" aria-busy={!ready} onMouseLeave={() => onActive(null)}>
        {!ready &&
          Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="nv-stream-skel" aria-hidden="true">
              <span />
              <span />
            </li>
          ))}
        {ready && rows.length === 0 && <li className="nv-stream-empty">Nothing to show right now. Open the channel to see what's new.</li>}
        {ready &&
          rows.map((r) => (
          <li key={r.url} data-reveal="" data-url={r.url}>
            <a
              className="nv-stream-row"
              href={r.url}
              {...external}
              onMouseEnter={() => onActive(r.url)}
              onFocus={() => onActive(r.url)}
              onBlur={() => onActive(null)}
            >
              <span className="nv-stream-thumb">
                <img src={r.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => onBad(r.url)} />
                {r.durationMs ? <em>{fmtDuration(r.durationMs)}</em> : r.short ? <em>Short</em> : null}
              </span>
              <span className="nv-stream-text">
                <span className="nv-stream-title">{r.title}</span>
                <span className="nv-stream-sub">
                  {fmtDate(r.date)} · {fmtViews(r.views)}
                </span>
              </span>
              <i className="nv-stream-arrow" aria-hidden="true">
                ↗
              </i>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Latest Kick broadcasts and YouTube uploads, listed side by side and re-checked on every visit. */
export default function Streams() {
  const { live, title, viewers } = useKickLive()
  const { kick, youtube, kickReady, youtubeReady, drop } = useStreamLists()
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<{ kick: string | null; youtube: string | null }>({ kick: null, youtube: null })

  // Rows arrive after the checks finish, so they are revealed here as they scroll into view.
  useEffect(() => {
    const rows = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)') ?? [])
    if (!rows.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const arriving = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
        arriving.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i, 8) * 85}ms`
          el.classList.add('in')
          io.unobserve(el)
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    )
    rows.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [kick, youtube, kickReady, youtubeReady])

  // No hover on touch screens: the stream sitting in the middle of the screen takes the background instead.
  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return
    let raf = 0
    const pick = () => {
      raf = 0
      const mid = window.innerHeight * 0.5
      const next = { kick: null as string | null, youtube: null as string | null }
      root.current?.querySelectorAll<HTMLElement>('.nv-stream-col').forEach((col) => {
        const box = col.getBoundingClientRect()
        if (box.top > mid || box.bottom < mid) return
        let best = Infinity
        col.querySelectorAll<HTMLElement>('li[data-url]').forEach((li) => {
          const r = li.getBoundingClientRect()
          const d = Math.abs(r.top + r.height / 2 - mid)
          if (d < best) {
            best = d
            next[col.classList.contains('nv-stream-kick') ? 'kick' : 'youtube'] = li.dataset.url!
          }
        })
      })
      setActive((a) => (a.kick === next.kick && a.youtube === next.youtube ? a : next))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick)
    }
    pick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [kick, youtube, kickReady, youtubeReady])

  return (
    <div className="nv-streams" ref={root}>
      <span className="nv-p-label">03 /</span>
      <h2 className="nv-p-head">
        Latest
        <br />
        Streams
      </h2>
      <div className="nv-stream-cols">
        <Column
          kind="kick"
          logo={<KickLogo className="nv-stream-logo" />}
          name="Kick"
          meta="@ryviel"
          href={streams.kick.url}
          badge={
            live ? (
              <span className="nv-live" title={title}>
                ● Live now · {viewers} watching
              </span>
            ) : undefined
          }
          rows={kick}
          ready={kickReady}
          onBad={drop}
          active={active.kick}
          onActive={(url) => setActive((a) => ({ ...a, kick: url }))}
        />
        <Column
          kind="youtube"
          logo={<YouTubeLogo className="nv-stream-logo" />}
          name="YouTube"
          meta="@Ryviel"
          href={streams.youtube.url}
          rows={youtube}
          ready={youtubeReady}
          onBad={drop}
          active={active.youtube}
          onActive={(url) => setActive((a) => ({ ...a, youtube: url }))}
        />
      </div>
    </div>
  )
}
