"use client";

import { getPlayNextSuggestions, SongData } from '@/app/api/actions';
import { createContext, useContext, useState, ReactNode } from 'react';

interface PlayNextContextType {
  initialized: boolean;
  setInitialized: (enabled: boolean) => void;
  loading: boolean;
  playlist: SongData[] | null;
  playNextList: SongData[] | null;
  currentSongId: string | null;
  initializeQueue: (currentSong: SongData, reset?: boolean) => Promise<void>;
  nextSong: (songOverride?: SongData) => SongData | null;
}

const PlayNextContext = createContext<PlayNextContextType | undefined>(undefined);

export function PlayNextProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SongData[] | null>(null);
  const [playNextList, setPlayNextList] = useState<SongData[] | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);

  const initializeQueue = async (currentSong: SongData, reset: boolean = false) => {
    if (currentSong.id === currentSongId) return;

    setLoading(true);
    setCurrentSongId(currentSong.id);

    try {
      const suggestions = await getPlayNextSuggestions(currentSong.id);
      if (reset || !playlist || playlist.length === 0) {
        setPlaylist([currentSong])
      }
      setPlayNextList((prev) => {
        return reset || !prev
          ? suggestions ?? []
          : [...prev, ...suggestions ?? []];
      })
      setInitialized(true);
    } catch (error) {
      console.error("Failed to load play next queue", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSong = (songOverride?: SongData) => {
    if (!playNextList || playNextList.length === 0)
      return null;

    const playlistIndex = playlist?.findIndex((song) => song.id === currentSongId) ?? -1;
    const isLast = !playlist || playlist.length === 0 || playlistIndex === playlist?.length - 1;

    const next = songOverride
      ? songOverride
      : (isLast ? playNextList[0] : playlist[playlistIndex + 1]);

    if (isLast || songOverride) {
      setPlaylist((prev) => [...prev ?? [], next])
      setPlayNextList((prev) => prev?.filter((song) => song.id !== next.id) ?? [])
    }

    setCurrentSongId(next.id);

    if (currentSongId && playNextList.length < 5) {
      initializeQueue(next);
    }

    return next;
  };

  return (
    <PlayNextContext.Provider value={{ initialized, setInitialized, loading, playlist, playNextList, currentSongId, initializeQueue, nextSong }}>
      {children}
    </PlayNextContext.Provider>
  );
}

export function usePlayNext() {
  const context = useContext(PlayNextContext);
  if (!context) {
    throw new Error('usePlayNext must be used within a PlayNextProvider');
  }
  return context;
}
