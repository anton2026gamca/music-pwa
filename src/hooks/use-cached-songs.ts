import { SongData } from "@/app/api/actions";
import { SongListKey, useSongsList } from "@/context/songs-list-context";

export function useCachedSongs() {
  const { getSongsList, addSong, removeSong, includesSong, getSongData } = useSongsList();

  return {
    songs: getSongsList(SongListKey.Cached),
    addSong: (song: SongData) => addSong(SongListKey.Cached, song),
    removeSong: (id: string) => removeSong(SongListKey.Cached, id),
    includesSong: (id: string) => includesSong(SongListKey.Cached, id),
    getSongData: getSongData,
  };
}
