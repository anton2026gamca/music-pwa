import { SongData } from "@/app/api/actions";
import { SongListKey, useSongsList } from "@/context/songs-list-context";

import { useCallback, useMemo } from 'react';

export function useDownloadedSongs() {
  const { getSongsList, addSong, removeSong, includesSong, getSongData } = useSongsList();

  const songs = useMemo(() => {
    return getSongsList(SongListKey.Downloaded);
  }, [getSongsList]);

  const handleAddSong = useCallback((song: SongData) => {
    addSong(SongListKey.Downloaded, song);
  }, [addSong]);

  const handleRemoveSong = useCallback((id: string) => {
    removeSong(SongListKey.Downloaded, id);
  }, [removeSong]);

  const handleIncludesSong = useCallback((id: string) => {
    return includesSong(SongListKey.Downloaded, id);
  }, [includesSong]);

  return useMemo(() => ({
    songs,
    addSong: handleAddSong,
    removeSong: handleRemoveSong,
    includesSong: handleIncludesSong,
    getSongData,
  }), [songs, handleAddSong, handleRemoveSong, handleIncludesSong, getSongData]);
}
