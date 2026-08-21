# Audio in this repo

## room-tone.mp3

Chopin, Nocturne in C sharp minor, B. 49 ("Lento con gran espressione").

Recording from Musopen's crowdfunded Complete Works of Chopin, released under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), which places it
in the public domain: free to copy, host, modify and use commercially, with no
attribution required. Source item:
<https://archive.org/details/musopen-chopin-complete-works-flac>

Encoded here to mono 80 kbps and loudness-normalised to -23 LUFS so it sits
under the room rather than on top of it. Regenerate with:

    ffmpeg -i <source>.mp3 \
      -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,afade=t=in:st=0:d=1.2,loudnorm=I=-23:TP=-3" \
      -ac 1 -ar 44100 -b:a 80k -map_metadata -1 public/audio/room-tone.mp3

## Nothing else belongs here

Abby's six favourite songs are commercial recordings. Buying a copy licenses
listening, not redistribution, and this repo is public and serves the live
site, so an mp3 of any of them here would be public distribution. They play
through Spotify's embed instead: see `TRACKS` in `src/museum/music.js`.

Anything added to this folder must be public domain, CC0, or licensed for
commercial redistribution, with the licence recorded above.
