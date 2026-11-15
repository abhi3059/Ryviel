import { useEffect, useRef } from 'react'
import { HERO_CUTOUT } from '../media.ts'
import './ryvielLook.css'

// Mouse-scrubbed "look-around" for the hero, built from the Ryviel cut-out.
// It follows the Mainframe clip's rule exactly: horizontal mouse movement scrubs a 0–1 playhead
// (delta ÷ viewport width × 0.8). The playhead drives a 2.5D rig: the head layer turns and tilts
// toward the side he looks at, the body follows a little, and a soft shade sells the turn.
const SENSITIVITY = 0.8
const MAX_YAW = 24 // degrees the head turns at either end
const MAX_TILT = 2.5 // degrees of head tilt at either end

export default function RyvielLook() {
  const headRef = useRef<HTMLImageElement>(null)
  const bodyRef = useRef<HTMLImageElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const head = headRef.current!
    const body = bodyRef.current!
    const shade = shadeRef.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let target = 0.5 // start looking straight out of the screen
    let cur = 0.5
    let prevX: number | null = null
    let raf = 0
    let lastKey = ''
    const start = performance.now()

    const onMove = (e: MouseEvent) => {
      if (prevX === null) {
        prevX = e.clientX
        return
      }
      const delta = e.clientX - prevX
      prevX = e.clientX
      if (window.scrollY > window.innerHeight) return // only while the hero is on screen
      target = Math.min(1, Math.max(0, target + (delta / window.innerWidth) * SENSITIVITY))
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (window.scrollY > window.innerHeight + 40) return
      cur += (target - cur) * (reduce ? 1 : 0.14)
      if (Math.abs(target - cur) < 0.0005) cur = target
      const look = (cur - 0.5) * 2 // −1 = looking left, +1 = looking right
      const breathe = reduce ? 0 : Math.sin(((now - start) / 1000) * 1.6)
      const key = `${look.toFixed(4)}|${breathe.toFixed(3)}`
      if (key === lastKey) return
      lastKey = key
      head.style.transform =
        `translate3d(${(look * 2.4).toFixed(3)}%, ${(breathe * 0.12).toFixed(3)}%, 0) ` +
        `rotateY(${(look * MAX_YAW).toFixed(2)}deg) rotateZ(${(look * MAX_TILT).toFixed(2)}deg)`
      body.style.transform =
        `translate3d(${(look * 0.6).toFixed(3)}%, 0, 0) rotateY(${(look * 7).toFixed(2)}deg) ` +
        `scaleY(${(1 + breathe * 0.0035).toFixed(4)})`
      // The cheek turning away from the viewer falls into shadow.
      shade.style.setProperty('--shade-l', Math.max(0, look).toFixed(3))
      shade.style.setProperty('--shade-r', Math.max(0, -look).toFixed(3))
      shade.style.transform = head.style.transform
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="ryl-stage" aria-hidden="true">
      <div className="ryl-fig">
        <img ref={bodyRef} className="ryl-layer ryl-body" src={HERO_CUTOUT} alt="" draggable={false} />
        <img ref={headRef} className="ryl-layer ryl-head" src={HERO_CUTOUT} alt="" draggable={false} />
        <div ref={shadeRef} className="ryl-layer ryl-shade" style={{ ['--cut' as string]: `url(${HERO_CUTOUT})` }} />
      </div>
    </div>
  )
}
