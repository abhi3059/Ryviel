import { useSyncExternalStore } from 'react'
import { KICK_SLUG } from '../media.ts'

export type KickLive = { live: boolean; title: string; viewers: number }

const POLL_MS = 60_000
const OFFLINE: KickLive = { live: false, title: '', viewers: 0 }
// Preview the live state without streaming: open the site with ?live=1
const SIMULATED = new URLSearchParams(window.location.search).get('live') === '1'

let state: KickLive = SIMULATED
  ? { live: true, title: 'BGMI LIVE | RYVIEL GAMING (preview)', viewers: 37 }
  : OFFLINE
const listeners = new Set<() => void>()
let timer: number | undefined

const set = (next: KickLive) => {
  if (next.live === state.live && next.title === state.title && next.viewers === state.viewers) return
  state = next
  listeners.forEach((l) => l())
}

async function check() {
  if (SIMULATED) return
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${KICK_SLUG}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return
    const c = await res.json()
    set(
      c?.livestream
        ? { live: true, title: c.livestream.session_title || 'Live on Kick', viewers: c.livestream.viewer_count ?? 0 }
        : OFFLINE,
    )
  } catch {
    /* offline or blocked: keep the last known state */
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    check()
    timer = window.setInterval(check, POLL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.clearInterval(timer)
  }
}

/** Whether the Kick channel is live right now, shared by every component and polled once a minute. */
export function useKickLive(): KickLive {
  return useSyncExternalStore(subscribe, () => state)
}
