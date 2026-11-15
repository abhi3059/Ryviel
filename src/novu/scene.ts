/* eslint-disable @typescript-eslint/no-explicit-any */
// Scroll-scrubbed orbit scene.
// Every frame of the clip is decoded once in software (mp4box.js + WebCodecs), turned into a JPEG
// by a small worker pool, and cached. The canvas then plays the cached frames forward or backward
// as the stage scrolls, blending neighbouring frames for sub-frame smoothness.
import { loadScript } from './loadScript.ts'

const MP4BOX_SRC = 'https://cdn.jsdelivr.net/npm/mp4box@0.5.2/dist/mp4box.all.min.js'
const FALLBACK_FPS = 24
const BITMAP_WINDOW = 56
const PHONE_BITMAP_WINDOW = 28
const isPhone = () => window.innerWidth <= 820
const MAX_INFLIGHT = 8

type RGB = [number, number, number]

export interface SceneOptions {
  url: string
  canvas: HTMLCanvasElement
  stage: HTMLElement
  /** True while Lenis is smoothing the scroll (the playhead can then follow more tightly). */
  smoothScrolling: () => boolean
  onFirstFrame: () => void
}

export interface SceneHandle {
  destroy: () => void
  /** Frames cached so far / total, for debugging. */
  stats: () => { cached: number; total: number; current: number }
}

const WORKER_SRC = `
let cv, cx, sc, sx; const q = []; let busy = false;
const centroid = () => {
  if (!sc) { sc = new OffscreenCanvas(96, 54); sx = sc.getContext('2d', { willReadFrequently: true }); }
  sx.drawImage(cv, 0, 0, 96, 54);
  const d = sx.getImageData(0, 0, 96, 54).data; let n = 0, sum = 0;
  for (let y = 0; y < 54; y++) for (let x = 0; x < 96; x++) { const k = (y * 96 + x) * 4;
    if (Math.abs(d[k] - 233) + Math.abs(d[k + 1] - 230) + Math.abs(d[k + 2] - 225) > 60) { n++; sum += x; } }
  let edge = 0;
  for (let x = 0; x < 96; x++) { const k = (53 * 96 + x) * 4;
    if (Math.abs(d[k] - 233) + Math.abs(d[k + 1] - 230) + Math.abs(d[k + 2] - 225) > 60) edge++; }
  return [n > 12 ? (sum / n + 0.5) / 96 : 0.5, edge > 2 ? 1 : 0];
};
const avg = (x, h) => {
  const d = cx.getImageData(x, 0, 4, h).data; let r = 0, g = 0, b = 0;
  for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; }
  const n = d.length / 4; return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
};
async function next() {
  const job = q.shift(); if (!job) { busy = false; return; } busy = true;
  const { i, t, frame } = job; const w = frame.displayWidth, h = frame.displayHeight;
  if (!cv || cv.width !== w || cv.height !== h) { cv = new OffscreenCanvas(w, h); cx = cv.getContext('2d', { willReadFrequently: true }); }
  cx.drawImage(frame, 0, 0, w, h); frame.close();
  const L = avg(0, h), R = avg(w - 4, h), [fx, fc] = centroid();
  const blob = await cv.convertToBlob({ type: 'image/jpeg', quality: 0.88 });
  postMessage({ i, t, blob, L, R, fx, fc });
  next();
}
onmessage = (e) => { q.push(e.data); if (!busy) next(); };
`

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rgb = (c: RGB, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

export function startScene(opts: SceneOptions): SceneHandle {
  const { url, canvas, stage, smoothScrolling, onFirstFrame } = opts
  const ctx = canvas.getContext('2d')!
  const disposers: (() => void)[] = []
  const abort = new AbortController()
  let destroyed = false

  // ── frame store ────────────────────────────────────────────────────────────
  const blobs: (Blob | undefined)[] = []
  const edges: ([RGB, RGB] | undefined)[] = []
  const figX: (number | undefined)[] = []
  const figCut: (number | undefined)[] = [] // 1 where the clip cuts the figure off at its bottom edge
  let total = 0
  let videoW = 1280
  let videoH = 720
  let started = false
  let dirty = true

  function store(i: number, blob: Blob, L: RGB, R: RGB, fx = 0.5, fc = 0) {
    if (destroyed || i < 0 || (total && i >= total)) return
    blobs[i] = blob
    edges[i] = [L, R]
    figX[i] = fx
    figCut[i] = fc
    if (i === 0 && !started) {
      started = true
      resize()
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!destroyed) onFirstFrame()
        }),
      )
    }
    if (Math.abs(i - cur) < 16) dirty = true
  }

  // ── canvas sizing ──────────────────────────────────────────────────────────
  let W = 0
  let H = 0
  function resize() {
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
  resize()
  window.addEventListener('resize', resize)
  disposers.push(() => window.removeEventListener('resize', resize))

  // ── decoded-bitmap LRU window ──────────────────────────────────────────────
  const bitmaps = new Map<number, ImageBitmap>()
  const inflight = new Set<number>()
  let cur = 0

  function evict() {
    const keep = Math.floor(cur)
    for (const key of bitmaps.keys()) {
      if (bitmaps.size <= (isPhone() ? PHONE_BITMAP_WINDOW : BITMAP_WINDOW)) break
      if (key === keep || key === keep + 1) continue
      bitmaps.get(key)!.close()
      bitmaps.delete(key)
    }
  }
  function want(i: number) {
    if (i < 0 || i >= total || inflight.size >= MAX_INFLIGHT) return
    if (bitmaps.has(i)) {
      const b = bitmaps.get(i)! // refresh LRU position
      bitmaps.delete(i)
      bitmaps.set(i, b)
      return
    }
    const blob = blobs[i]
    if (!blob || inflight.has(i)) return
    inflight.add(i)
    createImageBitmap(blob).then(
      (bm) => {
        inflight.delete(i)
        if (destroyed) return bm.close()
        bitmaps.set(i, bm)
        evict()
        dirty = true
      },
      () => inflight.delete(i),
    )
  }
  function nearest(i: number) {
    if (bitmaps.has(i)) return i
    for (let d = 1; d <= 12; d++) {
      if (bitmaps.has(i - d)) return i - d
      if (bitmaps.has(i + d)) return i + d
    }
    return -1
  }

  // ── render loop ────────────────────────────────────────────────────────────
  let raf = 0
  let lastT = performance.now()
  let lastKey = ''

  function stageProgress() {
    const r = stage.getBoundingClientRect()
    const span = r.height - window.innerHeight
    return span > 0 ? clamp01(-r.top / span) : 0
  }

  function draw(a: number, b: number, frac: number, t: number) {
    // Rect 0: hero framing, cover-fit into a full-width box at least 900/1440 of the width tall, top-anchored.
    const boxH = Math.max((W * 900) / 1440, H)
    const s0 = Math.max(W / videoW, boxH / videoH)
    const w0 = videoW * s0
    const h0 = videoH * s0
    const x0 = (W - w0) / 2
    const y0 = (boxH - h0) / 2
    // Rect 1: full canvas height, centred, so the walking feet stay in view.
    const h1 = H
    const w1 = (H * videoW) / videoH
    const x1 = (W - w1) / 2
    let x = lerp(x0, x1, t)
    let y = lerp(y0, 0, t)
    let w = lerp(w0, w1, t)
    let h = lerp(h0, h1, t)
    if (isPhone()) {
      // Tall screen: wordmark and copy sit above the close-up, then the figure rises into the upper part
      // of the screen for the walk (story text sits below). The crop follows him left and right.
      // The figure lifts to the top of the screen early (while the hero text scrolls away), so the clip's
      // own top edge, where the hair is cut off, is already off-screen when the back view arrives.
      const tp = easeInOutCubic(clamp01((cur / Math.max(1, total - 1) - 0.22) / 0.2))
      h = lerp(H * 0.62, H * 0.6, tp)
      w = (h * videoW) / videoH
      y = lerp(H - H * 0.62, 0, tp)
      let sum = 0
      let n = 0
      const f = Math.round(cur)
      for (let k = f - 6; k <= f + 6; k++) {
        const v = figX[k]
        if (v !== undefined) {
          sum += v
          n++
        }
      }
      const fx = n ? sum / n : 0.5
      x = Math.min(0, Math.max(W - w, W / 2 - fx * w))
    }

    const [L, R] = edges[a] ?? [
      [233, 230, 225],
      [233, 230, 225],
    ]
    const gapLeft = x > 0.5
    const gapRight = x + w < W - 0.5
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, W, H) // the frame may not cover the whole canvas (tall phone screens)
    if (gapLeft || gapRight) {
      const half = Math.round(W / 2)
      ctx.fillStyle = rgb(L)
      ctx.fillRect(0, 0, half, H)
      ctx.fillStyle = rgb(R)
      ctx.fillRect(half, 0, W - half, H)
    }
    ctx.drawImage(bitmaps.get(a)!, x, y, w, h)
    if (b >= 0) {
      ctx.globalAlpha = frac
      ctx.drawImage(bitmaps.get(b)!, x, y, w, h)
      ctx.globalAlpha = 1
    }
    if (isPhone()) {
      let cut = 0
      let n = 0
      const f = Math.round(cur)
      for (let k = f - 3; k <= f + 3; k++) {
        if (figCut[k] !== undefined) {
          cut += figCut[k]!
          n++
        }
      }
      cut = n ? cut / n : 0
      if (cut > 0.05 && y + h < H) {
        const fadeH = h * 0.2
        const g = ctx.createLinearGradient(0, y + h - fadeH, 0, y + h)
        g.addColorStop(0, 'rgba(0,0,0,0)')
        g.addColorStop(1, `rgba(0,0,0,${cut})`)
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = g
        ctx.fillRect(0, y + h - fadeH, W, fadeH + 2)
        ctx.restore()
      }
    }
    const feather = w * 0.06
    if (gapLeft) {
      const g = ctx.createLinearGradient(x, 0, x + feather, 0)
      g.addColorStop(0, rgb(L))
      g.addColorStop(1, rgb(L, 0))
      ctx.fillStyle = g
      ctx.fillRect(x - 1, 0, feather + 1, H)
    }
    if (gapRight) {
      const g = ctx.createLinearGradient(x + w - feather, 0, x + w, 0)
      g.addColorStop(0, rgb(R, 0))
      g.addColorStop(1, rgb(R))
      ctx.fillStyle = g
      ctx.fillRect(x + w - feather, 0, feather + 1, H)
    }
  }

  function tick(now: number) {
    raf = requestAnimationFrame(tick)
    const dt = Math.min(100, now - lastT)
    lastT = now
    if (!total) return
    const last = total - 1
    const target = Math.min(1, stageProgress() / 0.85) * last
    const k = smoothScrolling() ? 0.6 : 0.25
    cur += (target - cur) * (1 - Math.pow(1 - k, dt / 16.7))
    if (Math.abs(target - cur) < 0.02) cur = target

    // Queue decodes: playhead → target plus 14 ahead, and 4 behind.
    const f = Math.floor(cur)
    want(f)
    want(f + 1)
    const lo = Math.floor(Math.min(cur, target)) - 4
    const hi = Math.ceil(Math.max(cur, target)) + 14
    for (let i = lo; i <= hi; i++) want(i)

    if (!started) return
    const frac = cur - f
    const t = easeInOutCubic(clamp01((cur / last - 0.35) / 0.55))
    const a = nearest(f)
    if (a < 0) return
    const b = a === f && frac > 0.005 && bitmaps.has(f + 1) ? f + 1 : -1
    const key = `${a}|${b}|${b >= 0 ? frac.toFixed(2) : 0}|${t.toFixed(3)}|${W}x${H}`
    if (key === lastKey && !dirty) return
    lastKey = key
    dirty = false
    draw(a, b, frac, t)
  }
  raf = requestAnimationFrame(tick)
  disposers.push(() => cancelAnimationFrame(raf))

  // ── decoding: mp4box + WebCodecs + JPEG worker pool ────────────────────────
  async function decodeWithWebCodecs() {
    await loadScript(MP4BOX_SRC)
    if (destroyed) return
    const MP4Box = (window as any).MP4Box
    const DataStream = (window as any).DataStream ?? MP4Box.DataStream
    const file = MP4Box.createFile()

    const poolSize = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1))
    const workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
    const workers = Array.from({ length: poolSize }, () => new Worker(workerUrl))
    disposers.push(() => {
      workers.forEach((w) => w.terminate())
      URL.revokeObjectURL(workerUrl)
    })

    let decoder: VideoDecoder | null = null
    const queue: EncodedVideoChunk[] = []
    let pending = 0 // frames handed to workers, not yet back
    let fed = 0
    let outIndex = 0
    let streamDone = false
    let flushed = false

    const done = new Promise<void>((resolve, reject) => {
      const fail = (e: unknown) => reject(e instanceof Error ? e : new Error(String(e)))

      const pump = () => {
        if (destroyed || !decoder || decoder.state !== 'configured') return
        while (queue.length && decoder.decodeQueueSize < 4 && pending < 3 * poolSize) {
          decoder.decode(queue.shift()!)
          fed++
        }
        if (streamDone && !queue.length && fed === total && !flushed) {
          flushed = true
          decoder.flush().then(resolve, fail)
        }
      }

      workers.forEach((w) => {
        w.onmessage = (e: MessageEvent) => {
          pending--
          const { i, blob, L, R, fx, fc } = e.data
          store(i, blob, L, R, fx, fc)
          pump()
        }
        w.onerror = (e) => fail(e.message)
      })

      file.onError = fail
      file.onReady = (info: any) => {
        const track = info.videoTracks[0]
        if (!track) return fail('No video track')
        total = track.nb_samples
        videoW = track.video?.width ?? track.track_width
        videoH = track.video?.height ?? track.track_height
        const trak = file.getTrackById(track.id)
        let description: Uint8Array | undefined
        for (const entry of trak.mdia.minf.stbl.stsd.entries) {
          const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C
          if (box) {
            const ds = new DataStream(undefined, 0, DataStream.BIG_ENDIAN)
            box.write(ds)
            description = new Uint8Array(ds.buffer, 8)
            break
          }
        }
        decoder = new VideoDecoder({
          output: (frame) => {
            const i = outIndex++
            if (destroyed) return frame.close()
            pending++
            workers[i % poolSize].postMessage({ i, t: frame.timestamp, frame }, [frame as unknown as Transferable])
          },
          error: fail,
        })
        decoder.configure({
          codec: track.codec,
          codedWidth: videoW,
          codedHeight: videoH,
          description,
          hardwareAcceleration: 'prefer-software',
        })
        decoder.addEventListener('dequeue', pump)
        disposers.push(() => {
          if (decoder && decoder.state !== 'closed') decoder.close()
        })
        file.setExtractionOptions(track.id, null, { nbSamples: 12 })
        file.start()
      }
      file.onSamples = (id: number, _user: unknown, samples: any[]) => {
        for (const s of samples) {
          queue.push(
            new EncodedVideoChunk({
              type: s.is_sync ? 'key' : 'delta',
              timestamp: (1e6 * s.cts) / s.timescale,
              duration: (1e6 * s.duration) / s.timescale,
              data: s.data,
            }),
          )
        }
        file.releaseUsedSamples(id, samples[samples.length - 1].number + 1)
        pump()
      }

      // Stream the file straight into mp4box; Kling puts the index first, so decoding starts immediately.
      ;(async () => {
        const res = await fetch(url, { mode: 'cors', signal: abort.signal })
        if (!res.ok || !res.body) throw new Error(`Fetching the clip failed (${res.status})`)
        const reader = res.body.getReader()
        let offset = 0
        for (;;) {
          const { done: end, value } = await reader.read()
          if (end) break
          const buf = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer & {
            fileStart: number
          }
          buf.fileStart = offset
          offset += buf.byteLength
          file.appendBuffer(buf)
        }
        file.flush()
        streamDone = true
        pump()
      })().catch(fail)
    })
    await done
  }

  // ── fallback: play once off-screen and capture each presented frame ────────
  function captureWithVideoElement() {
    const v = document.createElement('video')
    v.muted = true
    v.playsInline = true
    v.crossOrigin = 'anonymous'
    v.preload = 'auto'
    v.src = url
    v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1'
    document.body.appendChild(v)
    disposers.push(() => {
      v.pause()
      v.removeAttribute('src')
      v.load()
      v.remove()
    })
    if (!('requestVideoFrameCallback' in v)) return
    const cv = document.createElement('canvas')
    const cx = cv.getContext('2d', { willReadFrequently: true })!
    const avg = (x: number): RGB => {
      const d = cx.getImageData(x, 0, 4, cv.height).data
      let r = 0
      let g = 0
      let b = 0
      for (let k = 0; k < d.length; k += 4) {
        r += d[k]
        g += d[k + 1]
        b += d[k + 2]
      }
      const n = d.length / 4
      return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
    }
    const onFrame = (_now: number, meta: VideoFrameCallbackMetadata) => {
      if (destroyed) return
      const i = Math.min(total - 1, Math.round(meta.mediaTime * FALLBACK_FPS))
      cx.drawImage(v, 0, 0, cv.width, cv.height)
      const L = avg(0)
      const R = avg(cv.width - 4)
      cv.toBlob((blob) => blob && store(i, blob, L, R), 'image/jpeg', 0.88)
      if (!v.ended) v.requestVideoFrameCallback(onFrame)
    }
    v.addEventListener(
      'loadedmetadata',
      () => {
        videoW = v.videoWidth
        videoH = v.videoHeight
        total = Math.round(v.duration * FALLBACK_FPS) + 1
        cv.width = videoW
        cv.height = videoH
        v.playbackRate = 0.5
        v.requestVideoFrameCallback(onFrame)
        v.play().catch(() => {})
      },
      { once: true },
    )
  }

  const canUseWebCodecs =
    'VideoDecoder' in window &&
    'EncodedVideoChunk' in window &&
    'Worker' in window &&
    'OffscreenCanvas' in window &&
    'ReadableStream' in window
  if (canUseWebCodecs) {
    decodeWithWebCodecs().catch((err) => {
      if (destroyed || (err as Error)?.name === 'AbortError') return
      console.warn('[scene] WebCodecs pipeline failed, falling back to <video> capture:', err)
      captureWithVideoElement()
    })
  } else {
    captureWithVideoElement()
  }

  return {
    destroy() {
      destroyed = true
      abort.abort()
      disposers.forEach((d) => d())
      bitmaps.forEach((b) => b.close())
      bitmaps.clear()
    },
    stats: () => ({ cached: blobs.filter(Boolean).length, total, current: cur }),
  }
}
