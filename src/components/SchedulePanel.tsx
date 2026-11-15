import { useEffect, useMemo } from 'react'
import { KICK_URL } from '../media.ts'
import { useKickLive } from '../hooks/useKickLive.ts'
import { closeSchedule, useScheduleOpen } from '../lib/ui.ts'
import { dayLabel, timeLabel, upcomingSlots, zoneLabel } from '../lib/schedule.ts'
import { KickLogo, YouTubeLogo } from '../novu/logos.tsx'
import './topnav.css'

/** Slide-up weekly schedule, opened from the bottom bar, the menu or the bell. Times show in the visitor's zone. */
export default function SchedulePanel() {
  const open = useScheduleOpen()
  const { live } = useKickLive()
  // Recomputed every time it opens, so "Today" and "Live" are always current.
  const rows = useMemo(() => (open ? upcomingSlots() : []), [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSchedule()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const now = Date.now()
  return (
    <>
      <div className="nvsched-scrim" data-open={open} onClick={closeSchedule} aria-hidden="true" />
      <section className="nvsched" data-open={open} role="dialog" aria-label="Stream schedule" aria-hidden={!open}>
        <header className="nvsched-head">
          <div>
            <h2>Stream schedule</h2>
            <p>Times in {zoneLabel()}</p>
          </div>
          <button type="button" className="nvsched-close" onClick={closeSchedule} aria-label="Close schedule" tabIndex={open ? 0 : -1}>
            <i />
            <i />
          </button>
        </header>
        <ul className="nvsched-list">
          {rows.map((r, i) => {
            const running = r.start <= now && now < r.end
            return (
              <li key={`${r.day}-${r.time}`} className="nvsched-row" data-first={i === 0} style={{ transitionDelay: open ? `${120 + i * 55}ms` : '0ms' }}>
                <span className="nvsched-when">
                  <b>{dayLabel(r.start, now)}</b>
                  <em>{timeLabel(r.start)}</em>
                </span>
                <span className="nvsched-what">
                  <b>{r.title}</b>
                  <em>{r.note}</em>
                </span>
                <span className="nvsched-side">
                  {running && live && r.platform === 'kick' ? (
                    <span className="nvsched-chip nvsched-chip--live">● Live</span>
                  ) : i === 0 ? (
                    <span className="nvsched-chip">{running ? 'On air window' : 'Next up'}</span>
                  ) : null}
                  {r.platform === 'kick' ? <KickLogo className="nvsched-logo" /> : <YouTubeLogo className="nvsched-logo" />}
                </span>
              </li>
            )
          })}
        </ul>
        <a className="nvsched-foot" href={KICK_URL} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
          Follow on Kick to never miss one <i>↗</i>
        </a>
      </section>
    </>
  )
}
