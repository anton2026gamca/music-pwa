"use client";

import { getPlayNextSuggestions, SongData } from '@/app/api/actions';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAudio } from './audio-context';
import { useOnline } from '@/hooks/use-online';
import { useOfflineAssets } from '@/hooks/use-offline-assets';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OfflineAssets, revokeBlobUrls } from '@/lib/download-utils';

interface PlayNextContextType {
  initialized: boolean;
  setInitialized: (enabled: boolean) => void;
  loading: boolean;
  playlist: SongData[] | null;
  setPlaylist: (songs: SongData[] | null) => void;
  playNextList: SongData[] | null;
  setPlayNextList: (songs: SongData[] | null) => void;
  initializeQueue: (currentSong: SongData, reset?: boolean) => Promise<void>;
  getNextSong: () => SongData | null;
  getPrevSong: () => SongData | null;
  addSong: (song: SongData) => void;
  removeSong: (songId: string) => void;
  playNextSong: (songOverride?: SongData) => void;
  playPrevSong: () => void;
  autoplayNext: boolean;
  setAutoplayNext: (enabled: boolean) => void;
  offlineAssets: OfflineAssets | null;
}

const PlaylistContext = createContext<PlayNextContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SongData[] | null>(null);
  const [playNextList, setPlayNextList] = useState<SongData[] | null>(null);
  const [autoplayNext, setAutoplayNext] = useState(true);

  const online = useOnline();

  const { state: { currentSong }, setNextHandler, setPrevHandler, subscribe: subscribeToAudio, playSong } = useAudio();

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);
  const { loadAssets } = useOfflineAssets();

  const initializeQueue = useCallback(async (song: SongData, reset: boolean = false) => {
    setLoading(true);

    try {
      if (reset || !playlist || playlist.length === 0) {
        setPlaylist([song]);
      }

      if (!online) return;

      const suggestions = await getPlayNextSuggestions(song.id);

      setPlayNextList((prev) => {
        return reset || !prev
          ? suggestions ?? []
          : [...prev, ...suggestions ?? []];
      });
      setInitialized(true);
    } catch (error) {
      console.error("Failed to load play next queue", error);
    } finally {
      setLoading(false);
    }
  }, [currentSong, playlist, getPlayNextSuggestions]);

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
  }, []);

  const removeSong = useCallback((songId: string) => {
    if (songId === currentSong?.id) {
      return;
    }
    setPlaylist((prev) => prev?.filter((song) => song.id !== songId) ?? []);
  }, [currentSong]);

  const playNextSong = useCallback(async (songOverride?: SongData) => {
    const playlistIndex = playlist?.findIndex((song) => song.id === currentSong?.id) ?? -1;
    const isLast = !playlist || playlist.length === 0 || playlistIndex === playlist?.length - 1;

    const next = songOverride
      ? songOverride
      : (isLast
        ? (autoplayNext ? playNextList?.[0] : null)
        : playlist[playlistIndex + 1]);

    if (!next) return;

    const currentSongId = currentSong?.id;

    if (isLast || songOverride) {
      setPlaylist((prev) => [...prev?.filter((song) => song.id !== next.id) ?? [], next])
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
      console.log(`Current URL ID: ${currentUrlId}, Current Song ID: ${currentSongId}, Next Song ID: ${next.id}`);
      if (pathname === '/watch' && currentUrlId === currentSongId) {
        router.push(`?id=${encodeURIComponent(next.id)}`);
      }

    } catch (error) {
      console.error("Failed to load offline assets for the next song:", error);
    }
  }, [playlist, currentSong, playNextList, initializeQueue, loadAssets, searchParams]);

  const playPrevSong = useCallback(async () => {
    const prev = getPrevSong();
    if (!prev) return;

    try {
      const assets = await loadAssets(prev);
      if (!assets) return;

      playSong(assets.songUrl, prev);

      sessionStorage.setItem(`song_${prev.id}`, JSON.stringify(prev));
      router.push(`/watch?id=${encodeURIComponent(prev.id)}`);

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
      console.log("Song ended, autoplaying next song...");
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
      offlineAssets,
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
