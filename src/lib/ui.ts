import { useSyncExternalStore } from 'react'

// Tiny shared UI state: the stream-schedule panel can be opened from the bottom bar, the menu and the bell.
let scheduleOpen = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const openSchedule = () => {
  if (!scheduleOpen) {
    scheduleOpen = true
    emit()
  }
}
export const closeSchedule = () => {
  if (scheduleOpen) {
    scheduleOpen = false
    emit()
  }
}

export function useScheduleOpen() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => scheduleOpen,
  )
}
