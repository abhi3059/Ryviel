import { useEffect, useRef } from 'react'
import './ryvielLook.css'

const SENSITIVITY = 0.8
const START_AT = 0.4 // start roughly facing the camera, so the mouse can turn him either way

/**
 * Hero clip scrubbed by horizontal mouse movement (used when HERO_CLIP is set in media.ts).
 * It sits on the same scrolling bone stage as the cut-out rig, so it flows into the orbit below.
 */
export default function BackgroundVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetTime = useRef(0)
  const seeking = useRef(false)

  // Seek, then let onSeeked queue the next seek if the target moved meanwhile, so seeks never flood.
  const seek = () => {
    const video = videoRef.current
    if (!video) return
    if (Math.abs(video.currentTime - targetTime.current) < 0.001) {
      seeking.current = false
      return
    }
    seeking.current = true
    video.currentTime = targetTime.current
  }

  const onMetadata = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    targetTime.current = video.duration * START_AT
    seek()
  }

  useEffect(() => {
    let prevX: number | null = null
    const onMove = (e: MouseEvent) => {
      const video = videoRef.current
      if (prevX === null) {
        prevX = e.clientX
        return
      }
      const delta = e.clientX - prevX
      prevX = e.clientX
      // Only scrub while the hero is on screen; the orbit section below has its own scene.
      if (window.scrollY > window.innerHeight) return
      if (!video || !video.duration || Number.isNaN(video.duration)) return
      const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration
      targetTime.current = Math.min(Math.max(targetTime.current + offset, 0), video.duration)
      if (!seeking.current) seek()
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="ryl-stage ryl-stage--clip" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-clip"
        src={src}
        muted
        playsInline
        preload="auto"
        onSeeked={seek}
        onLoadedMetadata={onMetadata}
      />
    </div>
  )
}
