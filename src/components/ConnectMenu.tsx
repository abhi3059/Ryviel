import { useEffect, useRef, useState, type ReactNode } from 'react'
import { INSTAGRAM_URL, KICK_URL, YOUTUBE_URL } from '../media.ts'
import { useKickLive } from '../hooks/useKickLive.ts'
import { InstagramLogo, KickLogo, YouTubeLogo } from '../novu/logos.tsx'
import './connect.css'

type Item = { key: string; logo: ReactNode; label: string; sub: string; href: string; external: boolean; live?: boolean }

const CLOSE_DELAY = 180

/**
 * One pill that opens a small panel with every way to follow Ryviel: hover or focus on a mouse,
 * tap on a phone. When he is live on Kick the pill (and the Watch row) turn Kick-green.
 */
export default function ConnectMenu() {
  const { live, title, viewers } = useKickLive()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.clearTimeout(closeTimer.current)
    }
  }, [])

  const items: Item[] = [
    {
      key: 'watch',
      logo: <KickLogo className="cm-logo" />,
      label: live ? 'Watch live now' : 'Watch the stream',
      sub: live ? `${title} · ${viewers} watching` : 'Kick · not live right now',
      href: KICK_URL,
      external: true,
      live,
    },
    {
      key: 'streams',
      logo: <span className="cm-logo cm-logo-streams">▶</span>,
      label: 'Latest streams',
      sub: 'Recent Kick broadcasts and uploads',
      href: '#streams',
      external: false,
    },
    {
      key: 'ig',
      logo: <InstagramLogo className="cm-logo" />,
      label: 'Follow on Instagram',
      sub: '@ryviel_ig',
      href: INSTAGRAM_URL,
      external: true,
    },
    {
      key: 'yt',
      logo: <YouTubeLogo className="cm-logo" />,
      label: 'Subscribe on YouTube',
      sub: '@Ryviel',
      href: `${YOUTUBE_URL}?sub_confirmation=1`,
      external: true,
    },
  ]

  return (
    <div
      ref={root}
      className="cm"
      data-open={open}
      data-live={live}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
      onFocus={show}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && hide()}
    >
      <div className="cm-panel" role="menu" aria-hidden={!open}>
        {items.map((it, i) => (
          <a
            key={it.key}
            role="menuitem"
            href={it.href}
            className={`cm-item${it.live ? ' cm-item--live' : ''}`}
            style={{ transitionDelay: open ? `${60 + i * 55}ms` : '0ms' }}
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            {...(it.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {it.logo}
            <span className="cm-text">
              <span className="cm-label">{it.label}</span>
              <span className="cm-sub">{it.sub}</span>
            </span>
            <i className="cm-arrow" aria-hidden="true">
              ↗
            </i>
          </a>
        ))}
      </div>

      <button
        type="button"
        className="cm-pill"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {live && <span className="cm-live-dot" aria-hidden="true" />}
        <span>{live ? 'Live now on Kick' : 'Watch & follow'}</span>
        <svg className="cm-plus" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
