import StoryPhone from './StoryPhone.tsx'

/**
 * Instagram section: the Instagram handle and the posts, which play like stories inside a phone
 * (see StoryPhone). Post images live in public/instagram/; the list is src/data/instagram.json.
 */
export default function Socials() {
  return (
    <div className="nv-socials" id="socials">
      <span className="nv-p-label">04 /</span>
      <h2 className="nv-p-head">Socials</h2>
      <StoryPhone />
    </div>
  )
}
