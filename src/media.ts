// ─────────────────────────────────────────────────────────────────────────────
// Ryviel's motion.
//   • hero: the Viggle sitting clip, scrubbed by the mouse. ryviel-look2-bone.mp4 is the source
//     (design/ryviel-look2.mp4) re-composited onto the bone studio by scripts/bone-walk.swift.
//     Set HERO_CLIP to null to fall back to the cut-out head-turn rig (components/RyvielLook.tsx).
//   • orbit: the Viggle walk clip, scrubbed by scroll. ryviel-walk-bone.mp4 is the original
//     (design/ryviel-walk.mp4) re-composited onto the site's bone studio by scripts/bone-walk.swift.
//     Set ORBIT_CLIP to null to fall back to the built-in turnaround renderer (novu/ryvielOrbit.ts).
// ─────────────────────────────────────────────────────────────────────────────

/** Optional hero clip, scrubbed by horizontal mouse movement. e.g. '/clips/ryviel-look.mp4' */
export const HERO_CLIP: string | null = '/clips/ryviel-look2-bone.mp4'

/** Orbit clip, scrubbed by scroll (decoded frame by frame in the browser). */
export const ORBIT_CLIP: string | null = '/clips/ryviel-walk-bone.mp4'

/** Ryviel cut-outs (transparent PNGs lifted from the character art with scripts/cutout.swift). */
export const HERO_CUTOUT = '/ryviel/cut/room.png'
export const ORBIT_VIEWS = {
  front: '/ryviel/cut/room.png',
  left: '/ryviel/cut/turn-left.png',
  back: '/ryviel/cut/turn-back.png',
  right: '/ryviel/cut/turn-right.png',
  threeQuarter: '/ryviel/cut/turn-three-quarter.png',
}

/** Stills used on phones and with reduced motion. */
export const HERO_STILL = '/ryviel/cut/room.png'
export const STORY_STILL = '/ryviel/cut/room.png'

/** Channels. Stream listings come from src/data/streams.json (refresh: npm run feeds). */
export const KICK_SLUG = 'ryviel'
export const KICK_URL = 'https://kick.com/ryviel'
export const YOUTUBE_URL = 'https://www.youtube.com/@Ryviel'
export const INSTAGRAM_HANDLE = 'ryviel_ig'
export const INSTAGRAM_URL = 'https://www.instagram.com/ryviel_ig/'

/** Contact address used by the hero pill and the nav. */
export const EMAIL = 'hello@ryviel.gg'
