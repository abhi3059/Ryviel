import { useCallback, useEffect, useState } from 'react'
import streams from '../data/streams.json'
import { KICK_CHANNEL_ID, KICK_SLUG } from '../media.ts'

export type Row = {
  title: string
  url: string
  thumbnail: string
  date: string
  views: number
  durationMs?: number
  short?: boolean
  /** Kick deletes broadcasts after a while; the saved list hides them once this has passed. */
  expiresAt?: string
}

const KICK_COUNT = 6
const YOUTUBE_COUNT = 5
const GIVE_UP_MS = 3500 // show the saved list if the checks are still pending after this long
const kickVideoUrl = (uuid: string) => `https://kick.com/${KICK_SLUG}/videos/${uuid}`

/**
 * Kick's own list of broadcasts that still exist, from the same endpoint kick.com uses
 * (removed or expired ones are simply not in it, and its ids are the ones kick.com/<channel>/videos/<id> opens).
 */
async function fetchKick(signal: AbortSignal): Promise<Row[] | null> {
  try {
    const res = await fetch(`https://web.kick.com/api/v1/channels/${KICK_CHANNEL_ID}/videos`, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const list = (await res.json())?.data
    if (!Array.isArray(list)) return null
    const now = Date.now()
    return list
      .filter((v) => v?.id && v.status === 'public' && !v.is_live && !(v.original_expires_at && Date.parse(v.original_expires_at) < now))
      .slice(0, KICK_COUNT)
      .map((v) => ({
        title: String(v.title || 'Kick stream').trim(),
        url: kickVideoUrl(v.id),
        thumbnail: v.thumbnail?.src || '',
        date: v.start_time,
        durationMs: (v.duration || 0) * 1000,
        views: v.viewer_count ?? 0,
        expiresAt: v.original_expires_at,
      }))
  } catch {
    return null
  }
}

/** True unless YouTube says the video is gone or private. A network failure or a temporary error keeps it. */
async function youtubeExists(url: string, signal: AbortSignal) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`, { signal })
    // 200 = exists. 400/401/403/404 = removed, private or invalid. 429 and 5xx are temporary, so keep it.
    return res.ok || res.status === 429 || res.status >= 500
  } catch {
    return true
  }
}

/**
 * The Kick and YouTube lists, checked on every visit so nobody lands on a 404:
 *  - Kick: replaced by Kick's current list of broadcasts (its ids change when Kick migrates, so saved ones can't be trusted).
 *  - YouTube: the saved list (its feed can't be read from a browser), minus anything removed or private.
 * Until the checks finish, `ready` is false so the page can show placeholders instead of stale rows.
 * A row whose thumbnail fails to load is also dropped (report it with `drop`).
 */
export function useStreamLists() {
  // The saved Kick list is only a stand-in while the live one loads, and only for broadcasts that haven't expired.
  const [kick, setKick] = useState<Row[]>(() => (streams.kick.items as Row[]).filter((r) => r.expiresAt && Date.parse(r.expiresAt) > Date.now()))
  const [youtube, setYoutube] = useState<Row[]>(streams.youtube.items)
  const [kickReady, setKickReady] = useState(false)
  const [youtubeReady, setYoutubeReady] = useState(false)
  const [dropped, setDropped] = useState<Set<string>>(new Set())

  useEffect(() => {
    const ctrl = new AbortController()
    fetchKick(ctrl.signal).then((rows) => {
      if (ctrl.signal.aborted) return
      if (rows) setKick(rows)
      setKickReady(true)
    })
    Promise.all(streams.youtube.items.map((r) => youtubeExists(r.url, ctrl.signal))).then((ok) => {
      if (ctrl.signal.aborted) return
      setYoutube(streams.youtube.items.filter((_, i) => ok[i]))
      setYoutubeReady(true)
    })
    const t = window.setTimeout(() => {
      setKickReady(true)
      setYoutubeReady(true)
    }, GIVE_UP_MS)
    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [])

  const drop = useCallback((url: string) => setDropped((d) => new Set(d).add(url)), [])
  const visible = (rows: Row[], n: number) => rows.filter((r) => !dropped.has(r.url)).slice(0, n)

  return {
    kick: visible(kick, KICK_COUNT),
    youtube: visible(youtube, YOUTUBE_COUNT),
    kickReady,
    youtubeReady,
    drop,
  }
}
