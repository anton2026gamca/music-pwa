import { useAudio } from "@/context/audio-context";
import { SongItem } from "./song-item";
import { useFetchSongData } from "@/hooks/use-fetch-song-data";


export function CurrentlyPlaying() {
  const { state } = useAudio();
  const { song } = useFetchSongData(state.currentTrack?.id ?? null);

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : null;

  if (song === null || state.currentTime === 0) {
    return null;
  }

  return (
    <SongItem song={song} progress={progress} />
  )
}
