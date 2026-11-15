/* eslint-disable @typescript-eslint/no-explicit-any */
// Behaviour for the orbit section: scaling units, wordmark fitting, scroll states, story panels,
// opening animation, Lenis smooth scroll, menu, and the scroll reveals.
import { startScene, type SceneHandle } from './scene.ts'
import { startRyvielOrbit } from './ryvielOrbit.ts'
import { loadScript } from './loadScript.ts'
import { ORBIT_CLIP, HERO_STILL, STORY_STILL } from '../media.ts'

const LENIS_SRC = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js'

// Wordmark geometry in frame units (u). "Ryviel" is wider than the original "Novu",
// so the ® and the second word sit further right; spans are fitted exactly by letter-spacing.
const WORDMARK = {
  a: { left: 53, right: 566 },
  rLeft: 584,
  b: { left: 690, right: 1387 },
}

const EASE = 'cubic-bezier(.16,1,.3,1)'
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function initOrbit(): () => void {
  const html = document.documentElement
  const body = document.body
  const q = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T
  const qa = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll(s)) as T[]

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isPhone = () => window.innerWidth <= 820
  // The scroll-scrubbed scene runs on phones too (framed for a tall screen); only reduced motion gets stills.
  const sceneMode = !reduce

  let destroyed = false
  const cleanups: (() => void)[] = []
  const on = (t: EventTarget, ev: string, fn: (e: any) => void, opts?: AddEventListenerOptions) => {
    t.addEventListener(ev, fn, opts)
    cleanups.push(() => t.removeEventListener(ev, fn, opts))
  }
  const classes = ['pre', 'video-bg', 'stills', 'scene-on', 'scrolled', 'at-end', 'in-novu', 'menu-open', 'novu-ready', 'past-top', 'name-out']
  cleanups.push(() => body.classList.remove(...classes))

  const stage = q('.nv-stage')
  const hero = q('.nv-hero')
  const story = q('#walk')
  const partners = q('#streams')
  const wordmark = q('.nv-wordmark')
  const wmA = q('.nv-wm-a')
  const wmB = q('.nv-wm-b')
  const heroStill = q<HTMLImageElement>('.nv-hero-still')
  const storyStill = q<HTMLImageElement>('.nv-story-still')
  const storyBg = q<HTMLImageElement>('.nv-story-bg')

  body.classList.add(reduce ? 'novu-ready' : 'pre', sceneMode ? 'video-bg' : 'stills')

  // ── units: --vw is the viewport width without the scrollbar ──────────────
  html.style.setProperty('--wm-a-left', String(WORDMARK.a.left))
  html.style.setProperty('--wm-r-left', String(WORDMARK.rLeft))
  html.style.setProperty('--wm-b-left', String(WORDMARK.b.left))
  const setVw = () => html.style.setProperty('--vw', `${html.clientWidth}px`)
  setVw()
  on(window, 'resize', setVw)

  // ── stills only on phones / reduced motion (never requested on desktop) ──
  if (!sceneMode) {
    heroStill.src = HERO_STILL
    storyStill.src = STORY_STILL
    if (!isPhone() && !STORY_STILL.endsWith('.png')) storyBg.src = STORY_STILL // no blurred copy of a cut-out
  }

  // ── wordmark fitting: ink spans exactly from left to right target ────────
  const fit = () => {
    if (isPhone()) {
      wmA.style.letterSpacing = ''
      wmB.style.letterSpacing = ''
      return
    }
    const u = html.clientWidth / 1440
    for (const [el, span] of [
      [wmA, WORDMARK.a],
      [wmB, WORDMARK.b],
    ] as const) {
      el.style.letterSpacing = '0px'
      const natural = el.getBoundingClientRect().width
      const letters = el.children.length
      el.style.letterSpacing = `${((span.right - span.left) * u - natural) / (letters - 1)}px`
    }
  }
  const fontsReady = Promise.all([
    document.fonts.load('650 177px Archivo'),
    document.fonts.load('600 30px Outfit'),
    document.fonts.ready,
  ]).catch(() => undefined)
  fontsReady.then(() => !destroyed && fit())
  on(window, 'resize', fit)

  // ── Lenis smooth scrolling ───────────────────────────────────────────────
  let lenis: any = null
  let lenisRaf = 0
  if (!reduce) {
    loadScript(LENIS_SRC)
      .then(() => {
        if (destroyed) return
        const Lenis = (window as any).Lenis
        lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, anchors: true })
        const raf = (t: number) => {
          lenis.raf(t)
          lenisRaf = requestAnimationFrame(raf)
        }
        lenisRaf = requestAnimationFrame(raf)
      })
      .catch(() => {})
  }
  cleanups.push(() => {
    cancelAnimationFrame(lenisRaf)
    lenis?.destroy()
    lenis = null
  })
  const absTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY

  // ── scroll-driven state ──────────────────────────────────────────────────
  const p1 = q('.nv-p1')
  const p2 = q('.nv-p2')
  const dashes = q('.nv-dashes')
  const dashFills = qa('.nv-dashes b')
  const panelParts = (panel: HTMLElement) => ({
    panel,
    label: panel.querySelector('.nv-panel-label') as HTMLElement,
    lines: Array.from(panel.querySelectorAll('h2 .nv-line > span')) as HTMLElement[],
    para: panel.querySelector('p') as HTMLElement,
  })
  const P1 = panelParts(p1)
  const P2 = panelParts(p2)

  const applyPanel = (P: ReturnType<typeof panelParts>, a: number, fromRight: boolean) => {
    const e = easeInOut(a)
    P.panel.style.opacity = String(a)
    P.panel.style.visibility = a > 0 ? 'visible' : 'hidden'
    P.lines.forEach((ln, i) => (ln.style.transform = `translateY(${(1 - e) * (105 + i * 20)}%)`))
    P.para.style.transform = `translateY(${(1 - e) * 24}px)`
    P.label.style.transform = `translateX(${(fromRight ? 1 : -1) * (1 - e) * 16}px)`
  }

  const update = () => {
    const vh = window.innerHeight
    const y = window.scrollY
    const stageTop = absTop(stage)
    body.classList.toggle('past-top', y > 24)
    body.classList.toggle('in-novu', y >= stageTop - vh * 0.2) // after the hero copy has left the screen
    body.classList.toggle('scrolled', y > stageTop + vh * 0.35)
    body.classList.toggle('at-end', partners.getBoundingClientRect().top < vh * 0.55)

    if (!sceneMode) {
      wordmark.style.transform = ''
      return
    }
    // Wordmark drifts up faster than the page as the hero scrolls away.
    const s = clamp01((y - stageTop) / vh)
    wordmark.style.transform = `translate3d(0, ${-40 * s}%, 0)`

    const r = story.getBoundingClientRect()
    const p = clamp01(-r.top / (r.height - vh))
    let a1: number
    let a2: number
    if (sceneMode) {
      a1 = clamp01((p - 0.2) / 0.06) * (1 - clamp01((p - 0.43) / 0.06))
      a2 = clamp01((p - 0.64) / 0.08)
    } else {
      a1 = p < 0.5 ? 1 : 0
      a2 = p < 0.5 ? 0 : 1
    }
    applyPanel(P1, a1, true)
    applyPanel(P2, a2, false)
    dashFills[0].style.transform = `scaleX(${clamp01((p - 0.2) / 0.35)})`
    dashFills[1].style.transform = `scaleX(${clamp01((p - 0.55) / 0.45)})`
    dashes.style.opacity = String(Math.max(a1, a2))
    dashes.classList.toggle('right', sceneMode && (a1 > a2 || p < 0.55))
  }
  on(window, 'scroll', update, { passive: true })
  on(window, 'resize', update)
  update()

  // ── scroll-scrubbed orbit scene (desktop, motion allowed) ────────────────
  let scene: SceneHandle | null = null
  if (sceneMode) {
    const sceneOpts = {
      canvas: q<HTMLCanvasElement>('.nv-scene canvas'),
      stage,
      smoothScrolling: () => !!lenis,
      onFirstFrame: () => body.classList.add('scene-on'),
    }
    // A real orbit clip wins if one is configured; otherwise Ryviel is animated from his cut-outs.
    scene = ORBIT_CLIP ? startScene({ url: ORBIT_CLIP, ...sceneOpts }) : startRyvielOrbit(sceneOpts)
    cleanups.push(() => {
      scene?.destroy()
    })
  }

  // ── opening animation: runs the first time the orbit hero comes into view ─
  let introStarted = false
  const timers: number[] = []
  cleanups.push(() => timers.forEach((t) => window.clearTimeout(t)))
  const runIntro = () => {
    if (introStarted || destroyed) return
    introStarted = true
    if (reduce) return
    const anims: Animation[] = []
    const A = (el: Element | null, from: Keyframe, duration: number, delay: number) => {
      if (!el) return
      anims.push(el.animate([from, {}], { duration, delay, easing: EASE, fill: 'backwards' }))
    }
    if (!sceneMode) A(heroStill, { opacity: 0, transform: 'scale(1.08)', filter: 'blur(10px)' }, 1800, 0)
    const chars = [...qa('.nv-wm-a span'), q('.nv-wm-r'), ...qa('.nv-wm-b span')]
    chars.forEach((c, i) => A(c, { opacity: 0, transform: 'translateY(60%) rotate(4deg)' }, 1100, 250 + i * 55))
    qa('.nv-copy .nv-line > span').forEach((l, i) => A(l, { opacity: 0, transform: 'translateY(100%)' }, 900, 850 + i * 70))
    A(q('.nv-tag'), { opacity: 0, transform: 'translateX(-20px)' }, 900, 1300)
    qa('[data-intro="nav"]').forEach((n, i) => A(n, { opacity: 0, transform: 'translateY(-24px)' }, 900, 500 + i * 80))
    qa('[data-intro="bar"]').forEach((b, i) =>
      A(
        b,
        { opacity: 0, transform: 'translateY(24px)' },
        900,
        700 + i * 80,
      ),
    )
    body.classList.remove('pre')
    const finish = () => {
      anims.forEach((a) => a.cancel())
      body.classList.remove('pre')
      body.classList.add('novu-ready')
    }
    Promise.all(anims.map((a) => a.finished)).then(finish, () => {})
    timers.push(window.setTimeout(() => body.classList.remove('pre'), 4000))
    timers.push(window.setTimeout(finish, 6000))
  }
  // Small logo: shown once the big hero name has scrolled out of view.
  const heroName = document.getElementById('hero-name')
  if (heroName) {
    const nameIO = new IntersectionObserver(([e]) => body.classList.toggle('name-out', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' })
    nameIO.observe(heroName)
    cleanups.push(() => nameIO.disconnect())
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) fontsReady.then(runIntro)
    },
    { threshold: 0.35 },
  )
  io.observe(hero)
  cleanups.push(() => io.disconnect())

  // ── menu ─────────────────────────────────────────────────────────────────
  const menuBtn = q('.nv-menu-btn')
  const menu = q('.nv-menu')
  const setMenu = (open: boolean) => {
    body.classList.toggle('menu-open', open)
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    menuBtn.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-hidden', String(!open))
  }
  on(menuBtn, 'click', () => setMenu(!body.classList.contains('menu-open')))
  qa('.nv-menu a, .nv-menu button').forEach((a) => on(a, 'click', () => setMenu(false)))

  on(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') setMenu(false)
  })

  // ── scroll reveal: stream rows and Instagram posts drop in as they arrive ─
  // Items entering together (a grid row, a few list rows) are staggered in reading order.
  const revealables = qa('[data-reveal]')
  if (reduce) {
    revealables.forEach((el) => el.classList.add('in'))
  } else {
    const revealIO = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) => {
            const ra = a.getBoundingClientRect()
            const rb = b.getBoundingClientRect()
            return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left
          })
        arriving.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i, 8) * 85}ms`
          el.classList.add('in')
          revealIO.unobserve(el)
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    )
    revealables.forEach((el) => revealIO.observe(el))
    cleanups.push(() => revealIO.disconnect())
  }

  return () => {
    destroyed = true
    cleanups.forEach((c) => c())
  }
}
