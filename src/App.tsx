import BackgroundVideo from './components/BackgroundVideo.tsx'
import RyvielLook from './components/RyvielLook.tsx'
import Navbar from './components/Navbar.tsx'
import Hero from './components/Hero.tsx'
import Orbit from './novu/Orbit.tsx'
import { HERO_CLIP } from './media.ts'

// One page: the mouse-scrubbed hero, then the scroll-scrubbed orbit section slides up over it.
export default function App() {
  return (
    <>
      {HERO_CLIP ? <BackgroundVideo src={HERO_CLIP} /> : <RyvielLook />}
      <Navbar />
      <Hero />
      <Orbit />
    </>
  )
}
