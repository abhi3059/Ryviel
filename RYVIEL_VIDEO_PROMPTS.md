# Ryviel clips (optional upgrade)

**Status:** both motions now use your Viggle clips. The sources are kept in `design/`
(`ryviel-look2.mp4`, the watermark-free sitting clip, for the hero; `ryviel-walk.mp4` for the scroll orbit).
`scripts/bone-walk.swift` re-composites them onto the site's bone studio. Re-run it if you
replace a clip:

```bash
swiftc -O scripts/bone-walk.swift -o /tmp/bone-walk
```

```bash
/tmp/bone-walk design/ryviel-look2.mp4 public/clips/ryviel-look2-bone.mp4 look
```

```bash
/tmp/bone-walk design/ryviel-walk.mp4 public/clips/ryviel-walk-bone.mp4
```

The prompts below are what the clips should show if you regenerate them.

Use an image-to-video model (Kling 3.0 on Higgsfield made the originals). For each clip:
first make a **start frame** with an image model, using your character sheet as the
reference (`design/ryviel-sheet.webp`, plus `design/ryviel-gaming-room.webp` for the
tee and headphone details). Then animate that start frame with the video prompt.

Character description to paste into every prompt:

> Ryviel: stylised 3D cartoon boy, messy dark-brown curly hair, round thin-rimmed
> glasses, large dark over-ear headphones with a glowing blue "G" on each cup and a
> thin cable, cream oversized tee with a red "HEAVY!" box logo, dark charcoal cargo
> pants, white and burgundy high-top sneakers. Grumpy, deadpan expression.

---

## Clip 1: hero look-around (mouse-scrubbed)

Moving the mouse left and right scrubs this clip, so Ryviel seems to follow the cursor.
What matters: **one slow, even head turn, a locked-off camera, and a flat background.**

**Start frame (image, 16:9, 1920×1080)**

> [Character description]. Head-and-shoulders portrait. He sits right of centre, with his
> face at about 65–70% of the frame width. The top of his hair is close to the top edge
> and his shoulders are cut by the bottom edge. Body angled slightly toward frame left;
> head and eyes looking toward the left edge of the frame. Plain seamless studio
> backdrop in one saturated colour (deep red like the original, or cobalt blue). Soft
> key light from the left, soft falloff. No props, no text.

**Video prompt (4–5 s, 1920×1080, 24 fps)**

> Locked-off camera: no zoom, no pan, no cuts. The character stays in exactly the same
> place and size for the whole clip. Over the full duration his head and eyes turn
> slowly and evenly from looking toward the left edge of the frame, past the camera,
> to looking toward the right edge, with a slight natural head tilt and one blink.
> Hair and headphone cable move subtly with the turn, gentle breathing. The background
> never changes. Constant speed from the first frame to the last, no pauses.

Save as `public/clips/ryviel-look.mp4`.

The white hero text sits over the left third, so keep that area empty and flat.

Optional: one keyframe per frame makes the scrub snappier. If you have ffmpeg:

```bash
ffmpeg -i ryviel-look-raw.mp4 -c:v libx264 -crf 18 -g 1 -an -movflags +faststart public/clips/ryviel-look.mp4
```

---

## Clip 2: orbit walk (scroll-scrubbed)

Scrolling plays this clip forward and backward through the "Ryviel GAMING" hero and the
two story panels. What matters: **Ryviel walks in place the whole time and only the
camera moves.**

**Start frame (image, 16:9, 1280×720)**

> [Character description], hands in his pockets. Low-angle front close-up of his head
> and shoulders, centred slightly right, with a large empty area above his head (a
> giant wordmark sits there). Plain seamless bone-white studio (#e9e6e1), soft floor
> shadow, warm grade, light film grain. No text.

**Video prompt (10 s, 1280×720, 24 fps)**

> One continuous 10-second shot, no cuts. The character walks in place the whole time,
> like on a treadmill: a steady walk cycle with his hands in his pockets, his head,
> shoulders, hair and headphone cable bobbing with each step. His body always faces the
> same direction and never moves forward in the frame. Only the camera moves. It starts
> on a low-angle front close-up of his head and shoulders, then orbits smoothly to his
> left profile. It continues behind him to show the back of his cream tee, then carries
> on to his right-side profile while pulling back and lowering, so his full body walks
> on the left side of the frame. It ends on a front full-body view with him right of
> centre. Plain seamless bone-white studio, soft floor shadow, warm grade, film grain.
> No text, no other characters.

Save as `public/clips/ryviel-orbit.mp4`.

Keep these compositions. Story panel 01 appears on the right during the profile walk,
and panel 02 appears on the left over the final front view. Any length works, because
the code reads the real frame count. About 10 s at 24 fps (≈241 frames) matches the
scroll length best.

---

## Swap them in

In `src/media.ts`:

```ts
export const HERO_CLIP = '/clips/ryviel-look.mp4'
export const ORBIT_CLIP = '/clips/ryviel-orbit.mp4'
```

Phones and reduced-motion visitors see stills instead of the orbit. Export two frames
from the orbit clip: the first frame (front close-up) and one front full-body frame.
Save them as `public/ryviel/hero.jpg` and `public/ryviel/story.jpg`, then set
`HERO_STILL` and `STORY_STILL` to those paths.

If you host the clips somewhere else instead of `public/clips/`, the server must send
`Access-Control-Allow-Origin` (the orbit clip is fetched and decoded in the browser).
