import { useEffect, useRef, useState } from 'react'
import { KICK_URL } from '../media.ts'
import { useKickLive } from '../hooks/useKickLive.ts'
import { openSchedule } from '../lib/ui.ts'
import { dayLabel, timeLabel, upcomingSlots } from '../lib/schedule.ts'
import './topnav.css'

const ALERTS_KEY = 'ryviel.liveAlerts'
const readPref = () => {
  try {
    return localStorage.getItem(ALERTS_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Notification bell, fixed next to the hamburger in both frames. A green dot appears when Ryviel is
 * live on Kick; the card shows what he is playing, or when the next stream starts. Optional browser
 * alerts fire while the page is open.
 */
export default function NotificationBell() {
  const { live, title, viewers } = useKickLive()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(() => readPref() && 'Notification' in window && Notification.permission === 'granted')
  const root = useRef<HTMLDivElement>(null)
  const wasLive = useRef(live)

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
    }
  }, [])

  // Browser alert the moment he goes live (only while this page is open).
  useEffect(() => {
    if (live && !wasLive.current && alerts && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Ryviel is live on Kick', { body: title, icon: '/ryviel/cut/room.png' })
    }
    wasLive.current = live
  }, [live, alerts, title])

  const toggleAlerts = async () => {
    if (alerts) {
      setAlerts(false)
      try {
        localStorage.setItem(ALERTS_KEY, '0')
      } catch {
        /* ignore */
      }
      return
    }
    if (!('Notification' in window)) return
    const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permission === 'granted') {
      setAlerts(true)
      try {
        localStorage.setItem(ALERTS_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }

  const next = upcomingSlots()[0]
  const canAlert = 'Notification' in window && Notification.permission !== 'denied'

  return (
    <div ref={root} className="nvbell" data-live={live} data-open={open}>
      <button
        type="button"
        className="nvbell-btn"
        aria-label={live ? 'Ryviel is live now. Open notifications' : 'Open notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.2 6.8 2.2 6.8H3.8S6 15 6 9.5z" />
          <path d="M10 19.5a2.2 2.2 0 0 0 4 0" />
        </svg>
        {live && <span className="nvbell-dot" aria-hidden="true" />}
      </button>

      <div className="nvbell-card" role="dialog" aria-label="Notifications" aria-hidden={!open}>
        {live ? (
          <>
            <p className="nvbell-tag nvbell-tag--live">● Live now on Kick</p>
            <p className="nvbell-title">{title}</p>
            <p className="nvbell-sub">{viewers} watching</p>
            <a className="nvbell-cta nvbell-cta--live" href={KICK_URL} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
              Watch now ↗
            </a>
          </>
        ) : (
          <>
            <p className="nvbell-tag">Not live right now</p>
            <p className="nvbell-title">
              Next up: {dayLabel(next.start)} at {timeLabel(next.start)}
            </p>
            <p className="nvbell-sub">
              {next.title} · {next.note}
            </p>
            <button
              type="button"
              className="nvbell-cta"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false)
                openSchedule()
              }}
            >
              See the schedule
            </button>
          </>
        )}
        {canAlert && (
          <button type="button" className="nvbell-toggle" aria-pressed={alerts} onClick={toggleAlerts} tabIndex={open ? 0 : -1}>
            <span className="nvbell-switch" data-on={alerts} aria-hidden="true" />
            <span>
              Alert me when he goes live
              <small>Works while this page is open</small>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
