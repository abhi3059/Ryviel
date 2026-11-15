import posts from '../data/instagram.json'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../media.ts'
import { InstagramLogo, ReelIcon } from './logos.tsx'

const external = { target: '_blank', rel: 'noreferrer' } as const

/**
 * Instagram grid. Each post drops in as it scrolls into view, softened into the bone page
 * (multiply blend + slight desaturation) and coming to full colour on hover.
 * Post images live in public/instagram/; the list is src/data/instagram.json.
 */
export default function Socials() {
  return (
    <div className="nv-socials" id="socials">
      <span className="nv-p-label">04 /</span>
      <div className="nv-socials-head">
        <h2 className="nv-p-head">Socials</h2>
        <a className="nv-ig-handle" href={INSTAGRAM_URL} {...external}>
          <InstagramLogo className="nv-ig-logo" />
          <span>
            <span className="nv-ig-name">Instagram</span>
            <span className="nv-ig-at">@{INSTAGRAM_HANDLE}</span>
          </span>
          <span className="nv-label nv-ig-follow-btn">
            Follow <i>↗</i>
          </span>
        </a>
      </div>
      <div className="nv-ig-grid">
        {posts.map((p) => (
          <a key={p.code} className="nv-ig-tile" href={p.url} data-reveal="" {...external}>
            <img src={p.image} alt={`${p.type === 'reel' ? 'Reel' : 'Post'} by @${INSTAGRAM_HANDLE}, ${p.date}`} loading="lazy" />
            {p.type === 'reel' && <ReelIcon className="nv-ig-reel" />}
            <span className="nv-ig-date nv-label">{p.date}</span>
          </a>
        ))}
        <a className="nv-ig-tile nv-ig-more" href={INSTAGRAM_URL} data-reveal="" {...external}>
          <InstagramLogo className="nv-ig-more-logo" />
          <span className="nv-label">
            More on
            <br />@{INSTAGRAM_HANDLE} ↗
          </span>
        </a>
      </div>
    </div>
  )
}
