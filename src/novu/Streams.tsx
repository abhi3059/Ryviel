import { useEffect, useState, type ReactNode } from 'react'
import streams from '../data/streams.json'
import { KICK_SLUG } from '../media.ts'
import { KickLogo, YouTubeLogo } from './logos.tsx'

type Row = {
  title: string
  url: string
  thumbnail: string
  date: string
  views: number
  durationMs?: number
  short?: boolean
}

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
}: {
  logo: ReactNode
  name: string
  meta: string
  href: string
  badge?: ReactNode
  rows: Row[]
  kind: 'kick' | 'youtube'
}) {
  return (
    <div className={`nv-stream-col nv-stream-${kind}`}>
      <a className="nv-stream-head" href={href} {...external}>
        {logo}
        <span className="nv-stream-name">{name}</span>
        <span className="nv-stream-meta">{meta}</span>
        {badge}
        <span className="nv-stream-open nv-label">
          Open channel <i>↗</i>
        </span>
      </a>
      <ul className="nv-stream-list">
        {rows.map((r) => (
          <li key={r.url} data-reveal="">
            <a className="nv-stream-row" href={r.url} {...external}>
              <span className="nv-stream-thumb">
                <img src={r.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
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

/** Latest Kick broadcasts and YouTube uploads, listed side by side. */
export default function Streams() {
  // Kick's public API allows browser requests, so the live badge is checked on every visit.
  const [live, setLive] = useState<{ title: string; viewers: number } | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`https://kick.com/api/v2/channels/${KICK_SLUG}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c?.livestream) setLive({ title: c.livestream.session_title, viewers: c.livestream.viewer_count ?? 0 })
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  const { kick, youtube } = streams
  return (
    <div className="nv-streams">
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
          href={kick.url}
          badge={
            live ? (
              <span className="nv-live" title={live.title}>
                ● Live now · {live.viewers} watching
              </span>
            ) : undefined
          }
          rows={kick.items}
        />
        <Column
          kind="youtube"
          logo={<YouTubeLogo className="nv-stream-logo" />}
          name="YouTube"
          meta="@Ryviel"
          href={youtube.url}
          rows={youtube.items.slice(0, 5)}
        />
      </div>
    </div>
  )
}
