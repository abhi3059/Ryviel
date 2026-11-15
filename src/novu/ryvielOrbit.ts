// Scroll-scrubbed Ryviel orbit, rendered live on the canvas from his cut-outs.
// Same playhead as the video scene (241 virtual frames, the last one reached at 85% of the stage,
// eased toward the scroll target), but each frame is drawn procedurally:
//   • camera script: front close-up → pull back → left profile → back → right-profile walk on the
//     left of frame → 3/4 → front full body right of centre (the original clip's beats);
//   • turns between turnaround views cross-dissolve with a squash and a little motion blur;
//   • a walk-in-place bob (body bounce, sway, breathing shadow) advances with the playhead.
import type { SceneHandle } from './scene.ts'
import { ORBIT_VIEWS } from '../media.ts'

const FRAMES = 241
const STRIDES = 20 // walk-cycle bounces over the whole orbit

type ViewKey = keyof typeof ORBIT_VIEWS
// Orbit angle (degrees) at which each turnaround view is seen.
const VIEW_AT: [number, ViewKey][] = [
  [0, 'front'],
  [90, 'left'],
  [180, 'back'],
  [270, 'right'],
  [315, 'threeQuarter'],
  [360, 'front'],
]
// Camera script, keyed by clip progress t (0–1).
const ANGLE: [number, number][] = [
  [0, 0],
  [0.3, 0],
  [0.4, 90],
  [0.5, 180],
  [0.58, 270],
  [0.8, 270],
  [0.87, 315],
  [0.94, 360],
  [1, 360],
]
const ZOOM: [number, number][] = [
  [0, 0],
  [0.08, 0],
  [0.3, 1],
  [1, 1],
] // 0 = head-and-shoulders close-up, 1 = full body
const CENTER_X: [number, number][] = [
  [0, 0.55],
  [0.3, 0.5],
  [0.45, 0.5],
  [0.58, 0.3],
  [0.8, 0.3],
  [0.92, 0.63],
  [1, 0.63],
]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const smoothstep = (a: number, b: number, v: number) => smooth(clamp01((v - a) / (b - a)))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function track(keys: [number, number][], t: number) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i]
    const [t1, v1] = keys[i + 1]
    if (t <= t1) return lerp(v0, v1, smooth(clamp01((t - t0) / (t1 - t0))))
  }
  return keys[keys.length - 1][1]
}

export interface OrbitOptions {
  canvas: HTMLCanvasElement
  stage: HTMLElement
  smoothScrolling: () => boolean
  onFirstFrame: () => void
}

export function startRyvielOrbit({ canvas, stage, smoothScrolling, onFirstFrame }: OrbitOptions): SceneHandle {
  const ctx = canvas.getContext('2d')!
  let destroyed = false
  let ready = false
  let W = 1
  let H = 1
  let dirty = true
  const images = {} as Record<ViewKey, HTMLImageElement>

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, Math.round(r.width * dpr))
    H = Math.max(1, Math.round(r.height * dpr))
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W
      canvas.height = H
    }
    dirty = true
  }
  window.addEventListener('resize', resize)

  Promise.all(
    (Object.keys(ORBIT_VIEWS) as ViewKey[]).map((k) => {
      const img = new Image()
      img.src = ORBIT_VIEWS[k]
      images[k] = img
      return img.decode()
    }),
  ).then(
    () => {
      if (destroyed) return
      ready = true
      resize()
      requestAnimationFrame(() => requestAnimationFrame(() => !destroyed && onFirstFrame()))
    },
    (err) => console.warn('[orbit] could not load the Ryviel cut-outs', err),
  )

  // ── drawing ────────────────────────────────────────────────────────────────
  function backdrop() {
    ctx.globalAlpha = 1
    ctx.filter = 'none'
    // Flat bone, identical to the hero above, so the edge sliding up over the hero is invisible.
    // (Edge falloff comes from the page-wide vignette overlay.)
    ctx.fillStyle = '#e9e6e1'
    ctx.fillRect(0, 0, W, H)
    // Seamless floor falling slightly darker toward the bottom.
    const floor = ctx.createLinearGradient(0, H * 0.78, 0, H)
    floor.addColorStop(0, 'rgba(150,135,120,0)')
    floor.addColorStop(1, 'rgba(150,135,120,0.12)')
    ctx.fillStyle = floor
    ctx.fillRect(0, H * 0.78, W, H * 0.22)
  }

  function shadow(cx: number, feetY: number, figH: number, lift: number) {
    if (feetY > H * 1.08) return
    const rx = figH * 0.27 * (1 - lift * 0.12)
    const ry = figH * 0.035
    ctx.save()
    ctx.translate(cx, feetY)
    ctx.scale(1, ry / rx)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    g.addColorStop(0, `rgba(60,48,38,${0.3 - lift * 0.08})`)
    g.addColorStop(1, 'rgba(60,48,38,0)')
    ctx.fillStyle = g
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2)
    ctx.restore()
  }

  function figure(img: HTMLImageElement, alpha: number, cx: number, feetY: number, figH: number, sx: number, rot: number, blur: number) {
    if (alpha <= 0.002) return
    const h = figH
    const w = (figH * img.naturalWidth) / img.naturalHeight
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none'
    ctx.translate(cx, feetY)
    ctx.rotate(rot)
    ctx.scale(sx, 1)
    ctx.drawImage(img, -w / 2, -h, w, h)
    ctx.restore()
  }

  function render(frame: number) {
    const t = frame / (FRAMES - 1)
    const angle = track(ANGLE, t)
    const z = track(ZOOM, t)
    const cx = track(CENTER_X, t) * W

    // Framing: close-up has the hair just under the wordmark; full body stands on the floor.
    const figH = Math.exp(lerp(Math.log(H * 1.55), Math.log(H * 0.8), z))
    const top = lerp(H * 0.27, H * 0.12, z)
    const feetY = top + figH

    // Walk in place: two bounces per stride, a little sway and roll.
    const phase = t * STRIDES * Math.PI * 2
    const bounce = Math.abs(Math.sin(phase))
    const bob = -bounce * figH * 0.011
    const sway = Math.sin(phase) * figH * 0.004
    const roll = Math.sin(phase) * 0.012

    backdrop()
    shadow(cx, feetY, figH, bounce)

    // Which two views bracket this angle, and how far through the turn are we?
    let i = 0
    while (i < VIEW_AT.length - 2 && angle > VIEW_AT[i + 1][0]) i++
    const [a0, v0] = VIEW_AT[i]
    const [a1, v1] = VIEW_AT[i + 1]
    const u = clamp01((angle - a0) / (a1 - a0))
    const turning = Math.sin(Math.PI * u) // 0 at a view, 1 mid-turn
    const sx = 1 - 0.2 * turning
    const blur = turning * 2.4 * (H / 900)
    const mix = smoothstep(0.3, 0.7, u)
    const x = cx + sway
    const y = feetY + bob
    // Keep the overlap opaque: the incoming view fades in over the outgoing one, then vice versa.
    if (mix < 0.5) {
      figure(images[v0], 1, x, y, figH, sx, roll, blur)
      figure(images[v1], mix * 2, x, y, figH, sx, roll, blur)
    } else {
      figure(images[v1], 1, x, y, figH, sx, roll, blur)
      figure(images[v0], (1 - mix) * 2, x, y, figH, sx, roll, blur)
    }
    ctx.filter = 'none'
    ctx.globalAlpha = 1
  }

  // ── playhead (same rules as the video scene) ───────────────────────────────
  let cur = 0
  let lastT = performance.now()
  let lastKey = ''
  let raf = 0
  const stageProgress = () => {
    const r = stage.getBoundingClientRect()
    const span = r.height - window.innerHeight
    return span > 0 ? clamp01(-r.top / span) : 0
  }
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(100, now - lastT)
    lastT = now
    if (!ready) return
    const target = Math.min(1, stageProgress() / 0.85) * (FRAMES - 1)
    const k = smoothScrolling() ? 0.6 : 0.25
    cur += (target - cur) * (1 - Math.pow(1 - k, dt / 16.7))
    if (Math.abs(target - cur) < 0.02) cur = target
    const key = `${cur.toFixed(3)}|${W}x${H}`
    if (key === lastKey && !dirty) return
    lastKey = key
    dirty = false
    render(cur)
  }
  raf = requestAnimationFrame(tick)

  return {
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    },
    stats: () => ({ cached: ready ? FRAMES : 0, total: FRAMES, current: cur }),
  }
}
