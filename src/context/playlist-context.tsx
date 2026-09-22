"use client";

import { getPlayNextSuggestions, SongData } from '@/app/api/actions';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAudio } from './audio-context';
import { useRouter } from 'next/navigation';

interface PlayNextContextType {
  initialized: boolean;
  setInitialized: (enabled: boolean) => void;
  loading: boolean;
  playlist: SongData[] | null;
  setPlaylist: (songs: SongData[] | null) => void;
  playNextList: SongData[] | null;
  setPlayNextList: (songs: SongData[] | null) => void;
  initializeQueue: (currentSong: SongData, reset?: boolean) => Promise<void>;
  nextSong: (songOverride?: SongData) => SongData | null;
  prevSong: () => SongData | null;
  addSong: (song: SongData) => void;
  removeSong: (songId: string) => void;
}

const PlayNextContext = createContext<PlayNextContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SongData[] | null>(null);
  const [playNextList, setPlayNextList] = useState<SongData[] | null>(null);

  const { state: { currentTrack: currentSongId }, setNextHandler, setPrevHandler } = useAudio();
  const router = useRouter();

  const initializeQueue = useCallback(async (currentSong: SongData, reset: boolean = false) => {
    if (currentSong.id === currentSongId?.id) return;

    setLoading(true);

    try {
      const suggestions = await getPlayNextSuggestions(currentSong.id);

      if (reset || !playlist || playlist.length === 0) {
        setPlaylist([currentSong]);
      }

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
  }, [currentSongId, playlist, getPlayNextSuggestions]);

  const nextSong = useCallback((songOverride?: SongData) => {
    const playlistIndex = playlist?.findIndex((song) => song.id === currentSongId?.id) ?? -1;
    const isLast = !playlist || playlist.length === 0 || playlistIndex === playlist?.length - 1;

    const next = songOverride
      ? songOverride
      : (isLast ? playNextList?.[0] : playlist[playlistIndex + 1]);

    if (!next) {
      return null;
    }

    if (isLast || songOverride) {
      setPlaylist((prev) => [...prev ?? [], next])
      setPlayNextList((prev) => prev?.filter((song) => song.id !== next.id) ?? [])
    }

    if (currentSongId && (!playNextList || playNextList.length < 5)) {
      initializeQueue(next);
    }

    return next;
  }, [playNextList, playlist, currentSongId, initializeQueue]);

  const prevSong = useCallback(() => {
    const playlistIndex = playlist?.findIndex((song) => song.id === currentSongId?.id) ?? -1;
    if (playlistIndex <= 0) {
      return null;
    }

    return playlist?.[playlistIndex - 1] ?? null;
  }, [playlist, currentSongId]);

  const addSong = useCallback((song: SongData) => {
    setPlaylist((prev) => [...prev ?? [], song]);
  }, []);

  const removeSong = useCallback((songId: string) => {
    if (songId === currentSongId?.id) {
      return;
    }
    setPlaylist((prev) => prev?.filter((song) => song.id !== songId) ?? []);
  }, [currentSongId]);

  useEffect(() => {
    setNextHandler(() => {
      const next = nextSong();
      if (!next) return;

      sessionStorage.setItem(`song_${next.id}`, JSON.stringify(next));
      router.push(`/watch?id=${encodeURIComponent(next.id)}&autoplay=1`);
    });
    setPrevHandler(() => {
      const prev = prevSong();
      if (!prev) return;

      sessionStorage.setItem(`song_${prev.id}`, JSON.stringify(prev));
      router.push(`/watch?id=${encodeURIComponent(prev.id)}&autoplay=1`);
    });

    return () => {
      setNextHandler(null);
      setPrevHandler(null);
    };
  }, [nextSong, prevSong, setNextHandler, setPrevHandler]);

  return (
    <PlayNextContext.Provider value={{ initialized, setInitialized, loading, playlist, setPlaylist, playNextList, setPlayNextList, initializeQueue, nextSong, prevSong, addSong, removeSong }}>
      {children}
    </PlayNextContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlayNextContext);
  if (!context) {
    throw new Error('usePlayNext must be used within a PlayNextProvider');
  }
  return context;
}
