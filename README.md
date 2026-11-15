# Ryviel® Gaming

One-page site for the streamer avatar **Ryviel**, built with React, TypeScript, Vite and Tailwind CSS.

- **Hero:** Ryviel sits on a bone-white studio and turns his head as the mouse moves left and right (a mouse-scrubbed video).
- **Gaming / Walk:** as you scroll, the camera orbits Ryviel while he walks in place (a scroll-scrubbed video, decoded frame by frame with WebCodecs), with the "Ryviel ® GAMING" wordmark and two story panels.
- **Latest Streams:** recent Kick broadcasts and YouTube uploads, with a live "Live now" badge from Kick.
- **Socials:** the Instagram posts as stories in a phone: auto-advancing with progress bars, tap to skip, hold to pause.

## Run it

Requires Node 20+.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

## Content

| What | Where |
| --- | --- |
| Links, email, clip paths | `src/media.ts` |
| Kick + YouTube listings | Checked live on every visit (Kick: its current broadcast list from the same endpoint kick.com uses, so links always open — Kick deletes broadcasts about a week after the stream; YouTube: each saved video must still exist). `src/data/streams.json` is the saved fallback and where new YouTube uploads come from: run `npm run feeds` to refresh it |
| Weekly stream schedule | `src/data/schedule.json` (placeholder times: edit to your real ones; shown in each visitor's time zone) |
| Instagram posts | `src/data/instagram.json` + images in `public/instagram/` |
| Hero / orbit clips | `public/clips/` (sources in `design/`) |

## Live status

The hero pill, the Watch row and the bell turn green when `kick.com/ryviel` is live (checked every minute). To preview that state without streaming, open the site with `?live=1`.

## Motion clips

The hero and orbit clips are Viggle renders of Ryviel, re-composited onto the site's bone studio with
`scripts/bone-walk.swift` (macOS: Vision subject lifting + AVFoundation). See `RYVIEL_VIDEO_PROMPTS.md`
for the commands and the prompts used to generate the clips.

```bash
swiftc -O scripts/bone-walk.swift -o /tmp/bone-walk
```

```bash
/tmp/bone-walk design/ryviel-look2.mp4 public/clips/ryviel-look2-bone.mp4 look
```

```bash
/tmp/bone-walk design/ryviel-walk.mp4 public/clips/ryviel-walk-bone.mp4
```

`scripts/cutout.swift` lifts Ryviel out of still images as transparent PNGs (used for the phone and
reduced-motion stills, and the fallback renderers in `src/components/RyvielLook.tsx` and
`src/novu/ryvielOrbit.ts`).
