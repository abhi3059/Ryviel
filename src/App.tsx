import BackgroundVideo from './components/BackgroundVideo.tsx'
import RyvielLook from './components/RyvielLook.tsx'
import Navbar from './components/Navbar.tsx'
import NavTabs from './components/NavTabs.tsx'
import NotificationBell from './components/NotificationBell.tsx'
import SchedulePanel from './components/SchedulePanel.tsx'
import Hero from './components/Hero.tsx'
import Orbit from './novu/Orbit.tsx'
import { HERO_CLIP } from './media.ts'

// One page: the mouse-scrubbed hero, then the scroll-scrubbed orbit section slides up over it.
// The tabs, bell, hamburger and schedule panel are shared by both frames.
export default function App() {
  return (
    <>
      {HERO_CLIP ? <BackgroundVideo src={HERO_CLIP} /> : <RyvielLook />}
      <Navbar />
      <NavTabs />
      <NotificationBell />
      <Hero />
      <Orbit />
      <SchedulePanel />
    </>
  )
}
