import { museum } from './store'

// Abby's playlist. Drop an mp3 at public/audio/<file> and the track plays in-page.
// Until then the dock falls back to the Spotify link. `spotify` is a track ID:
// fill it in to swap the fallback link for a real embed.
export const TRACKS = [
  { title: 'Wuthering Heights', artist: 'Kate Bush', file: 'wuthering-heights.mp3', spotify: '' },
  { title: 'Heroes', artist: 'David Bowie', file: 'heroes.mp3', spotify: '' },
  { title: 'Amsterdam', artist: 'Gregory Alan Isakov, with the Colorado Symphony', file: 'amsterdam.mp3', spotify: '' },
  { title: 'I, Carrion (Icarian)', artist: 'Hozier', file: 'i-carrion.mp3', spotify: '' },
  { title: 'And I Love Her', artist: 'The Beatles', file: 'and-i-love-her.mp3', spotify: '' },
  { title: 'Cherry Wine', artist: 'Hozier', file: 'cherry-wine.mp3', spotify: '' },
]

export const spotifyLink = t => t.spotify
  ? `https://open.spotify.com/track/${t.spotify}`
  : `https://open.spotify.com/search/${encodeURIComponent(t.title + ' ' + t.artist)}`

// One element for the whole session, so music survives closing the guide
// and walking around. Lives outside React on purpose.
let el = null
function audio() {
  if (el) return el
  el = new Audio()
  el.volume = 0.5
  el.addEventListener('ended', () => play(museum.get().trackAt + 1))
  el.addEventListener('error', () => museum.set({ trackOn: false, trackErr: true }))
  return el
}

export function play(i) {
  const at = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length
  const a = audio()
  const src = import.meta.env.BASE_URL + 'audio/' + TRACKS[at].file
  if (!a.src.endsWith(TRACKS[at].file)) a.src = src
  museum.set({ trackAt: at, trackErr: false })
  a.play().then(
    () => museum.set({ trackOn: true }),
    () => museum.set({ trackOn: false, trackErr: true }),
  )
}

export function toggle() {
  const s = museum.get()
  if (!s.trackOn) return play(s.trackAt)
  audio().pause()
  museum.set({ trackOn: false })
}

export const step = d => play(museum.get().trackAt + d)
