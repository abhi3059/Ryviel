import data from '../data/schedule.json'

export type Slot = { day: number; time: string; title: string; note: string; platform: 'kick' | 'youtube' }
export type Upcoming = Slot & { start: number; end: number }

const MIN = 60_000
const DAY = 24 * 60 * MIN

/** The next occurrence of each weekly slot (or the one running now), soonest first. */
export function upcomingSlots(now = Date.now()): Upcoming[] {
  const offset = data.utcOffsetMinutes * MIN
  const zoneNow = new Date(now + offset)
  const y = zoneNow.getUTCFullYear()
  const m = zoneNow.getUTCMonth()
  const d = zoneNow.getUTCDate()
  return (data.slots as Slot[])
    .map((slot) => {
      const [h, min] = slot.time.split(':').map(Number)
      for (let add = -1; add <= 7; add++) {
        const day = new Date(Date.UTC(y, m, d + add))
        if (day.getUTCDay() !== slot.day) continue
        const start = Date.UTC(y, m, d + add, h, min) - offset
        const end = start + data.durationMinutes * MIN
        if (end > now) return { ...slot, start, end }
      }
      const start = now + DAY * 7
      return { ...slot, start, end: start + data.durationMinutes * MIN }
    })
    .sort((a, b) => a.start - b.start)
}

const dayName = (ms: number, opts: Intl.DateTimeFormatOptions) => new Date(ms).toLocaleDateString(undefined, opts)

/** "Today", "Tomorrow" or a weekday, in the visitor's own time zone. */
export function dayLabel(start: number, now = Date.now()) {
  const key = (ms: number) => dayName(ms, { year: 'numeric', month: 'numeric', day: 'numeric' })
  if (key(start) === key(now)) return 'Today'
  if (key(start) === key(now + DAY)) return 'Tomorrow'
  return dayName(start, { weekday: 'long' })
}

export const timeLabel = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export const zoneLabel = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')
  } catch {
    return 'your time'
  }
}
