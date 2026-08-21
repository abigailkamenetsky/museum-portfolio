import { museum } from './store'

// Abby's six. Every id was verified against open.spotify.com's own og: metadata,
// so each one is the original album cut and not a remaster, live take or cover.
// Commercial recordings cannot be hosted from this repo, so they play through
// Spotify's embed, which is the licensed way to put them on a page.
export const TRACKS = [
  { title: 'Wuthering Heights', artist: 'Kate Bush', album: 'The Kick Inside, 1978', spotify: '5YSI1311X8t31PBjkBG4CZ' },
  { title: 'Heroes', artist: 'David Bowie', album: '"Heroes", 1977', spotify: '7Jh1bpe76CNTCgdgAdBw4Z' },
  { title: 'Amsterdam', artist: 'Gregory Alan Isakov', album: 'with the Colorado Symphony, 2016', spotify: '2Dl1KHm3B5meHmri4xelmb' },
  { title: 'I, Carrion (Icarian)', artist: 'Hozier', album: 'Unreal Unearth, 2023', spotify: '3zsTgPLNF9uEPjwu9jbKaU' },
  { title: 'And I Love Her', artist: 'The Beatles', album: "A Hard Day's Night, 1964", spotify: '65vdMBskhx3akkG9vQlSH1' },
  { title: 'Cherry Wine', artist: 'Hozier', album: 'Hozier, 2014', spotify: '1C042FLYy7rP3MfnkOcnha' },
]

export const embedSrc = t => `https://open.spotify.com/embed/track/${t.spotify}`

// The bed the gallery actually plays. Musopen's crowdfunded Chopin recordings
// are CC0, so unlike the six above this one is ours to serve and to loop.
export const ROOM_TONE = {
  title: 'Nocturne in C sharp minor, B. 49',
  by: 'Chopin, played by Musopen',
  license: 'Public domain (CC0)',
}

let tone = null
function toneEl() {
  if (tone) return tone
  tone = new Audio(import.meta.env.BASE_URL + 'audio/room-tone.mp3')
  tone.loop = true
  tone.volume = 0.16
  return tone
}

export function toneStart() {
  toneEl().play().then(
    () => museum.set({ toneOn: true }),
    () => museum.set({ toneOn: false }),   // browser refused without a gesture
  )
}
export function toneStop() { toneEl().pause(); museum.set({ toneOn: false }) }
export const toneToggle = () => (museum.get().toneOn ? toneStop() : toneStart())
