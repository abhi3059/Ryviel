// Refreshes the stream listings: latest Kick broadcasts + latest YouTube uploads.
// Writes src/data/streams.json, which the Streams section reads. Run: npm run feeds
import { writeFileSync } from 'node:fs'

const KICK_SLUG = 'ryviel'
const YOUTUBE_HANDLE = '@Ryviel'
const LIMIT = 6
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh) ryviel-site-feeds', Accept: 'application/json' }

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
// Drop trailing hashtag runs ("… #bgmi #bgmiindia") so titles read cleanly in a list.
const cleanTitle = (s) => decode(s).replace(/(\s*#[^\s#]+)+\s*$/u, '').trim()

async function kick() {
  const channel = await (await fetch(`https://kick.com/api/v2/channels/${KICK_SLUG}`, { headers: UA })).json()
  // The list kick.com itself uses; its ids are the ones kick.com/<channel>/videos/<id> opens.
  const res = await (await fetch(`https://web.kick.com/api/v1/channels/${channel.id}/videos`, { headers: UA })).json()
  const now = Date.now()
  return {
    url: `https://kick.com/${KICK_SLUG}`,
    followers: Number(channel.followers_count) || 0,
    items: (res.data || [])
      .filter((v) => v.id && v.status === 'public' && !v.is_live && !(v.original_expires_at && Date.parse(v.original_expires_at) < now))
      .slice(0, LIMIT)
      .map((v) => ({
        title: cleanTitle(v.title || 'Kick stream'),
        url: `https://kick.com/${KICK_SLUG}/videos/${v.id}`,
        thumbnail: v.thumbnail?.src || '',
        date: v.start_time,
        durationMs: (v.duration || 0) * 1000,
        views: v.viewer_count ?? 0,
        category: v.category?.name || '',
        expiresAt: v.original_expires_at,
      })),
  }
}

async function youtube() {
  const page = await (await fetch(`https://www.youtube.com/${YOUTUBE_HANDLE}`, { headers: UA })).text()
  const channelId = page.match(/"externalId":"([^"]+)"/)?.[1]
  if (!channelId) throw new Error('YouTube channel id not found')
  const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)).text()
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1])
  return {
    url: `https://www.youtube.com/${YOUTUBE_HANDLE}`,
    channelId,
    items: entries.slice(0, LIMIT).map((e) => {
      const id = e.match(/<yt:videoId>(.*?)</)[1]
      const link = e.match(/<link rel="alternate" href="(.*?)"/)?.[1] || `https://www.youtube.com/watch?v=${id}`
      return {
        title: cleanTitle(e.match(/<title>([\s\S]*?)<\/title>/)[1]),
        url: link,
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        date: e.match(/<published>(.*?)</)[1],
        views: Number(e.match(/views="(\d+)"/)?.[1] || 0),
        short: link.includes('/shorts/'),
      }
    }),
  }
}

const [k, y] = await Promise.allSettled([kick(), youtube()])
if (k.status === 'rejected') console.warn('Kick failed:', k.reason.message)
if (y.status === 'rejected') console.warn('YouTube failed:', y.reason.message)
const data = {
  fetchedAt: new Date().toISOString(),
  kick: k.status === 'fulfilled' ? k.value : { url: `https://kick.com/${KICK_SLUG}`, followers: 0, items: [] },
  youtube: y.status === 'fulfilled' ? y.value : { url: `https://www.youtube.com/${YOUTUBE_HANDLE}`, items: [] },
}
writeFileSync(new URL('../src/data/streams.json', import.meta.url), JSON.stringify(data, null, 2) + '\n')
console.log(`streams.json: ${data.kick.items.length} Kick, ${data.youtube.items.length} YouTube`)
