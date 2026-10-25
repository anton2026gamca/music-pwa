import { useAudio } from "@/context/audio-context";
import { SongItem } from "./song/song-item";
import { useFetchSongData } from "@/hooks/use-fetch-song-data";


export function CurrentlyPlaying() {
  const { state } = useAudio();
  const { song } = useFetchSongData(state.currentSong?.id ?? null);

  if (song === null || state.currentTime === 0) {
    return null;
  }

  return (
    <SongItem song={song} />
  )
}
