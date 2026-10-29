"use client";

import { getPlayNextSuggestions, SongData } from '@/app/api/actions';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAudio } from './audio-context';
import { useOnline } from '@/hooks/use-online';
import { useOfflineAssets } from '@/hooks/use-offline-assets';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OfflineAssets, revokeBlobUrls } from '@/lib/download-utils';
import { useSongsListContext } from './songs-list-context';
import { fetchSongsData } from '@/hooks/use-fetch-song-data';
import { useSearchParamsHelpers } from '@/hooks/use-search-params-helpers';
import { shufflePlaylist } from '@/lib/utils';

interface PlayNextContextType {
  initialized: boolean;
  setInitialized: (enabled: boolean) => void;
  loading: boolean;
  playlist: SongData[] | null;
  setPlaylist: (songs: SongData[] | null) => void;
  playNextList: SongData[] | null;
  setPlayNextList: (songs: SongData[] | null) => void;
  initializeQueue: (currentSong: SongData | null, reset?: boolean, playlistKey?: string, autoplay?: boolean, shuffle?: boolean) => Promise<void>;
  getNextSong: () => SongData | null;
  getPrevSong: () => SongData | null;
  addSong: (song: SongData) => void;
  removeSong: (songId: string) => void;
  playNextSong: (songOverride?: SongData) => void;
  playPrevSong: () => void;
  autoplayNext: boolean;
  setAutoplayNext: (enabled: boolean) => void;
  loopEnabled: boolean;
  setLoopEnabled: (enabled: boolean) => void;
  offlineAssets: OfflineAssets | null;
  playlistKey: string | null;
  setPlaylistKey: (value: string | null) => void;
  differentFromSaved: boolean;
  setDifferentFromSaved: (value: boolean) => void;
}

const PlaylistContext = createContext<PlayNextContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateSearchParam } = useSearchParamsHelpers();

  const { getSongsList } = useSongsListContext();

  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SongData[] | null>(null);
  const [playNextList, setPlayNextList] = useState<SongData[] | null>(null);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [playlistKey, setPlaylistKey] = useState<string | null>(null);
  const [differentFromSaved, setDifferentFromSaved] = useState(false);

  const online = useOnline();

  const { state: { currentSong }, setNextHandler, setPrevHandler, subscribe: subscribeToAudio, playSong } = useAudio();

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);
  const { loadAssets } = useOfflineAssets();

  const initializeQueue = useCallback(async (song: SongData | null = null, reset: boolean = false, playlistKey: string | null = null, autoplay: boolean = false, shuffle: boolean = false) => {
    setLoading(true);

    try {
      let lastSongId = null;
      let newPlaylist: SongData[] | null = null;

      if (reset || !playlist || playlist.length === 0) {
        if (playlistKey) {
          const songIds = getSongsList(playlistKey);
          const { songs, error } = await fetchSongsData(songIds)

          if (song && !songs.find((s) => s.id === song.id)) {
            newPlaylist = [...songs, song];
            if (shuffle) {
              newPlaylist = shufflePlaylist(newPlaylist);
            }
            setDifferentFromSaved(true);
            setPlaylist(newPlaylist);
            lastSongId = song.id;
          } else {
            newPlaylist = songs;
            if (shuffle) {
              newPlaylist = shufflePlaylist(newPlaylist);
              setDifferentFromSaved(true);
            } else {
              setDifferentFromSaved(false);
            }
            setPlaylist(newPlaylist);
            lastSongId = songs.length > 0 ? songs[songs.length - 1].id : null;
          }

          setPlaylistKey(error ? null : playlistKey);
          // console.log(`Initialized playlist with key: ${playlistKey}`, "songIds:", songIds, "songs:", songs, "error:", error);
        } else {
          setPlaylist(song ? [song] : []);
          setPlaylistKey(null);
          setDifferentFromSaved(true);
        }
      }

      const play = async () => {
        const autoplaySong = song ?? (newPlaylist ?? playlist)?.[0] ?? null;
        if (autoplay && autoplaySong) {
          const assets = await loadAssets(autoplaySong);
          if (!assets) return;
          setOfflineAssets(assets);
          playSong(assets.songUrl, autoplaySong);
          sessionStorage.setItem(`song_${autoplaySong.id}`, JSON.stringify(autoplaySong));
          router.push(`/watch?id=${autoplaySong.id}`);
        }
      }

      const loadPlayNext = async () => {
        if (!online) return;

        if (reset || !playNextList || playNextList.length < 5) {
          const currentPlaylist = newPlaylist ?? playlist;
          const suggestionsId = song?.id ?? lastSongId ?? playlist?.[playlist.length - 1]?.id ?? null;
          const suggestions = (
            suggestionsId
              ? await getPlayNextSuggestions(suggestionsId)
              : null
          )?.filter(
            (s) => !currentPlaylist || currentPlaylist.find((song) => song.id === s.id) === undefined
          );
          // console.log(`Fetched play next suggestions for song ID: ${suggestionsId}`);

          setPlayNextList((prev) => {
            return reset || !prev
              ? suggestions ?? []
              : [...prev, ...suggestions ?? []];
          });
        }
      }

      await Promise.all([play(), loadPlayNext()]);

      setInitialized(true);
    } catch (error) {
      console.error("Failed to load play next queue", error);
    } finally {
      setLoading(false);
    }
  }, [currentSong, playlist, playNextList, getPlayNextSuggestions]);

  const getNextSong = useCallback(() => {
    const playlistIndex = playlist?.findIndex((song) => song.id === currentSong?.id) ?? -1;
    const isLast = !playlist || playlist.length === 0 || playlistIndex === playlist?.length - 1;

    const next = isLast
      ? (autoplayNext ? playNextList?.[0] ?? null : null)
      : playlist[playlistIndex + 1];

    return next;
  }, []);

  const getPrevSong = useCallback(() => {
    const playlistIndex = playlist?.findIndex((song) => song.id === currentSong?.id) ?? -1;
    if (playlistIndex <= 0) {
      return null;
    }

    return playlist?.[playlistIndex - 1] ?? null;
  }, [playlist, currentSong]);

  const addSong = useCallback((song: SongData) => {
    setPlaylist((prev) => [...prev ?? [], song]);
    setDifferentFromSaved(true);
  }, []);

  const removeSong = useCallback((songId: string) => {
    if (songId === currentSong?.id) {
      return;
    }
    setPlaylist((prev) => prev?.filter((song) => song.id !== songId) ?? []);
    setDifferentFromSaved(true);
  }, [currentSong]);

  const playNextSong = useCallback(async (songOverride?: SongData) => {
    // console.log("Attempting to play next song...", { songOverride, currentSong, playlist, playNextList });

    const playlistIndex = playlist?.findIndex((song) => song.id === currentSong?.id) ?? -1;
    const isLast = !playlist || playlist.length === 0 || playlistIndex === playlist?.length - 1;

    let next = null;

    if (songOverride) {
      next = songOverride;
    } else if (isLast) {
      next = loopEnabled
        ? playlist?.[0] ?? null
        : playNextList?.[0] ?? null;
    } else {
      next = playlist[playlistIndex + 1];
    }

    if (!next) return;

    const currentSongId = currentSong?.id;

    if (isLast || songOverride) {
      if (!playlist || playlist.find((s) => s.id === next.id) === undefined) {
        setPlaylist((prev) => [...prev?.filter((song) => song.id !== next.id) ?? [], next])
        setDifferentFromSaved(true);
      }
      setPlayNextList((prev) => prev?.filter((song) => song.id !== next.id) ?? [])
    }

    if (currentSong && (!playNextList || playNextList.length < 5)) {
      initializeQueue(next);
    }


    try {
      revokeBlobUrls(offlineAssets?.songUrl, offlineAssets?.thumbnailUrl);

      const assets = await loadAssets(next);
      if (!assets) return;

      setOfflineAssets(assets);

      playSong(assets.songUrl, next);

      sessionStorage.setItem(`song_${next.id}`, JSON.stringify(next));

      const currentUrlId = searchParams.get('id');
      // console.log(`Current URL ID: ${currentUrlId}, Current Song ID: ${currentSongId}, Next Song ID: ${next.id}`);
      if (pathname === '/watch' && currentUrlId === currentSongId) {
        updateSearchParam('id', next.id);
      }

    } catch (error) {
      console.error("Failed to load offline assets for the next song:", error);
    }
  }, [playlist, currentSong, playNextList, initializeQueue, loadAssets, searchParams, loopEnabled]);

  const playPrevSong = useCallback(async () => {
    const prev = getPrevSong();
    if (!prev) return;

    try {
      const assets = await loadAssets(prev);
      if (!assets) return;

      playSong(assets.songUrl, prev);

      sessionStorage.setItem(`song_${prev.id}`, JSON.stringify(prev));
      if (pathname === '/watch') {
        updateSearchParam('id', prev.id);
      }
    } catch (error) {
      console.error("Failed to load offline assets for the next song:", error);
    }
  }, [getPrevSong, loadAssets, playSong]);

  useEffect(() => {
    setNextHandler(playNextSong);
    setPrevHandler(playPrevSong);

    return () => {
      setNextHandler(null);
      setPrevHandler(null);
    };
  }, [playNextSong, playPrevSong, setNextHandler, setPrevHandler]);

  const onSongEnded = useCallback(() => {
    if (autoplayNext) {
      // console.log("Song ended, autoplaying next song...");
      playNextSong();
    }
  }, [autoplayNext, playNextSong]);

  useEffect(() => {
    const unsubscribe = subscribeToAudio((state) => {
      if (state.ended && state.currentSong !== null) {
        onSongEnded();
      }
    })

    return () => {
      unsubscribe();
    };
  }, [onSongEnded]);

  return (
    <PlaylistContext.Provider value={{
      initialized, setInitialized,
      loading,
      playlist, setPlaylist,
      playNextList, setPlayNextList,
      initializeQueue,
      getNextSong, getPrevSong,
      addSong, removeSong,
      playNextSong, playPrevSong,
      autoplayNext, setAutoplayNext,
      loopEnabled, setLoopEnabled,
      offlineAssets,
      playlistKey, setPlaylistKey,
      differentFromSaved, setDifferentFromSaved
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
