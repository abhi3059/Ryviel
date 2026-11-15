import { useEffect, type ReactNode } from 'react'
import { initOrbit } from './controller.ts'
import { EMAIL, INSTAGRAM_URL, KICK_URL, YOUTUBE_URL } from '../media.ts'
import RegisteredMark from '../components/RegisteredMark.tsx'
import Streams from './Streams.tsx'
import Socials from './Socials.tsx'
import { openSchedule } from '../lib/ui.ts'
import './orbit.css'

// Wordmark parts: every character is its own span so the intro can animate it.
const Chars = ({ text }: { text: string }) => (
  <>
    {[...text].map((c, i) => (
      <span key={i}>{c}</span>
    ))}
  </>
)

// A masked line whose inner block can slide.
const Line = ({ children }: { children: ReactNode }) => (
  <span className="nv-line">
    <span>{children}</span>
  </span>
)

const Dots = () => (
  <div className="nv-dots" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
    ))}
  </div>
)

const NorthEast = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 8 8 2M3.6 2H8v4.4" />
  </svg>
)

export default function Orbit() {
  useEffect(() => initOrbit(), [])

  return (
    <div className="nv-font">
      <div className="nv-grain" aria-hidden="true" />
      <div className="nv-vignette" aria-hidden="true" />

      {/* ── fixed top nav ── */}
      <header className="nv-nav">
        <button type="button" className="nv-menu-btn" aria-label="Open menu" aria-expanded="false">
          <i />
          <i />
          <i />
        </button>
        <a className="nv-mini-logo" href="#top">
          Ryviel<sup>®</sup>
        </a>
      </header>

      <nav className="nv-menu" aria-hidden="true">
        <a href="#top">
          <span>01</span>Home
        </a>
        <a href="#streams">
          <span>02</span>Streams
        </a>
        <a href="#socials">
          <span>03</span>Socials
        </a>
        <button type="button" onClick={openSchedule}>
          <span>04</span>Schedule
        </button>
      </nav>

      {/* ── fixed bottom bar ── */}
      <div className="nv-bar">
        <button type="button" className="nv-pill nv-roadmap" onClick={openSchedule} data-intro="bar">
          <span className="nv-label">Stream schedule</span>
          <span className="nv-dot">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
              <rect x="1.4" y="2.2" width="9.2" height="8.4" rx="1.8" />
              <path d="M1.4 5h9.2M4 1v2.4M8 1v2.4" />
            </svg>
          </span>
        </button>
        <button type="button" className="nv-icon-btn" aria-label="Random Ryviel" data-intro="bar">
          <svg viewBox="0 0 28 28" aria-hidden="true">
            <path d="M4.2 15a9.8 9.8 0 0 1 19.6 0" fill="none" stroke="#0b0b0b" strokeWidth="2.2" />
            <circle cx="14" cy="15.6" r="8" fill="#0b0b0b" />
            <rect x="2.6" y="12.6" width="4.2" height="7.4" rx="1.8" fill="#ff5a1f" />
            <rect x="21.2" y="12.6" width="4.2" height="7.4" rx="1.8" fill="#ff5a1f" />
            <circle cx="11.2" cy="16" r="2.2" fill="none" stroke="#e9e6e1" strokeWidth="1.2" />
            <circle cx="16.8" cy="16" r="2.2" fill="none" stroke="#e9e6e1" strokeWidth="1.2" />
            <path d="M13.4 16h1.2" stroke="#e9e6e1" strokeWidth="1.2" />
          </svg>
        </button>
        <div className="nv-switch" data-intro="bar">
          <span className="nv-label nv-hint">Press</span>
          <button type="button" className="nv-key nv-label">
            Spacebar
          </button>
          <span className="nv-label nv-hint">to switch</span>
        </div>
        <a className="nv-label nv-index" href="#socials" data-intro="bar">
          Socials <NorthEast />
        </a>
        <div data-intro="bar" className="nv-bar-dots">
          <Dots />
        </div>
      </div>

      {/* ── stage: the hero and the story share one scroll-scrubbed background ── */}
      <div className="nv-stage" id="gaming">
        <div className="nv-scene" aria-hidden="true">
          <canvas />
        </div>

        <section className="nv-hero">
          <div className="nv-frame">
            <img className="nv-hero-still" alt="Ryviel in round glasses, glowing headphones and a HEAVY! tee" />
            <h1 className="nv-wordmark" aria-label="Ryviel Gaming">
              <span className="nv-wm nv-wm-a" aria-hidden="true">
                <Chars text="Ryviel" />
              </span>
              <span className="nv-wm-r" aria-hidden="true">
                <RegisteredMark />
              </span>
              <span className="nv-wm nv-wm-b" aria-hidden="true">
                <Chars text="GAMING" />
              </span>
            </h1>
            <p className="nv-copy nv-copy-1">
              <Line>
                <b>Headphones on,</b> mic
              </Line>
              <Line>hot, patience mostly</Line>
              <Line>optional</Line>
            </p>
            <p className="nv-copy nv-copy-2">
              <Line>Live four</Line>
              <Line>
                <b>nights a week,</b>
              </Line>
              <Line>chaos included</Line>
            </p>
            <div className="nv-label nv-tag">
              RYV0023.
              <svg viewBox="0 0 46 8" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                <path className="nv-draw" d="M1 4h44" pathLength={46} />
                <path d="M41.5 1.2 45 4l-3.5 2.8" />
              </svg>
            </div>
          </div>
        </section>

        <section className="nv-story" id="walk">
          <div className="nv-stick">
            <div className="nv-frame">
              <img className="nv-story-bg" alt="" aria-hidden="true" />
              <img className="nv-story-still" alt="Ryviel standing full length in his gaming room" />
              <article className="nv-panel nv-p1">
                <span className="nv-panel-label">01 /</span>
                <h2>
                  <Line>Ranked, but</Line>
                  <Line>made cozy</Line>
                </h2>
                <p>
                  Ranked grinds, cozy indies and whatever chat dares him to play. Drop in, pick a side and watch{' '}
                  <em>RYVIEL&apos;s</em> patience run out live.
                </p>
              </article>
              <article className="nv-panel nv-p2">
                <span className="nv-panel-label">02 /</span>
                <h2>
                  <Line>Run the</Line>
                  <Line>Ryvielwalk</Line>
                </h2>
                <p>
                  Hit squad night and flex your best plays. Become a <em>RYVIELMATE</em> and land your clip on the
                  highlight reel.
                </p>
              </article>
              <div className="nv-dashes" aria-hidden="true">
                <i>
                  <b />
                </i>
                <i>
                  <b />
                </i>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── streams + socials + footer ── */}
      <section className="nv-partners" id="streams">
        <Streams />
        <Socials />

        <footer className="nv-foot">
          <div>
            <p className="nv-quote">
              We queue, we clutch,
              <br />
              we lose. We laugh.
            </p>
            <p className="nv-manifest">Ryviel Stream Manifest</p>
          </div>
          <p className="nv-quote nv-connect">
            Connect
            <br /> with
            <br /> us
          </p>
          <div className="nv-links">
            <a href={KICK_URL} target="_blank" rel="noreferrer">
              Kick <i>↗</i>
            </a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer">
              YouTube <i>↗</i>
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              Instagram <i>↗</i>
            </a>
          </div>
          <div className="nv-links">
            <a href="#streams">
              Latest streams <i>↗</i>
            </a>
            <a href="#socials">
              Socials <i>↗</i>
            </a>
            <a href={`mailto:${EMAIL}`}>
              Email <i>↗</i>
            </a>
          </div>
        </footer>
        <div className="nv-legal">
          <span className="nv-mute">© 2026 • Ryviel Gaming</span>
          <span>
            <span className="nv-mute">Live on </span>
            <a href={KICK_URL} target="_blank" rel="noreferrer">
              kick.com/ryviel
            </a>
          </span>
          <span className="nv-spacer" />
          <a href="#">Terms &amp; Conditions</a>
          <a href="#">Privacy Policy</a>
          <Dots />
        </div>
      </section>
    </div>
  )
}
