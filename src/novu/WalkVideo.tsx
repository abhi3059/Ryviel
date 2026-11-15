import { useEffect, useRef } from 'react'
import { ORBIT_CLIP } from '../media.ts'

/**
 * Phones don't get the scroll-scrubbed orbit, so the walk plays here instead: the same clip, muted
 * and looping, only while it is on screen (it never plays in the background).
 */
export default function WalkVideo() {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(wrap.current!)
    return () => io.disconnect()
  }, [])

  if (!ORBIT_CLIP) return null
  return (
    <div ref={wrap} className="nv-story-video" aria-hidden="true">
      <video ref={video} src={ORBIT_CLIP} muted loop playsInline preload="metadata" />
    </div>
  )
}
