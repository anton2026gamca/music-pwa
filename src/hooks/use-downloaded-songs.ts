import { SongData } from "@/app/api/actions";
import { SongListKey, useSongsList } from "@/context/songs-list-context";

export function useDownloadedSongs() {
  const { getSongsList, addSong, removeSong, includesSong, getSongData } = useSongsList();

  return {
    songs: getSongsList(SongListKey.Downloaded),
    addSong: (song: SongData) => addSong(SongListKey.Downloaded, song),
    removeSong: (id: string) => removeSong(SongListKey.Downloaded, id),
    includesSong: (id: string) => includesSong(SongListKey.Downloaded, id),
    getSongData: getSongData,
  };
}
