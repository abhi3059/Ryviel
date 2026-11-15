import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../media.ts'
import { InstagramLogo } from './logos.tsx'
import StoryPhone from './StoryPhone.tsx'

const external = { target: '_blank', rel: 'noreferrer' } as const

/**
 * Instagram section: the posts play like Instagram stories inside a phone (see StoryPhone).
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
      <StoryPhone />
    </div>
  )
}
