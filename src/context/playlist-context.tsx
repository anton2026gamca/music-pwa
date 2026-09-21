"use client";

import { getPlayNextSuggestions, SongData } from '@/app/api/actions';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAudio } from './audio-context';

interface PlayNextContextType {
  initialized: boolean;
  setInitialized: (enabled: boolean) => void;
  loading: boolean;
  playlist: SongData[] | null;
  playNextList: SongData[] | null;
  currentSongId: string | null;
  initializeQueue: (currentSong: SongData, reset?: boolean) => Promise<void>;
  nextSong: (songOverride?: SongData) => SongData | null;
  addSong: (song: SongData) => void;
}

const PlayNextContext = createContext<PlayNextContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState<SongData[] | null>(null);
  const [playNextList, setPlayNextList] = useState<SongData[] | null>(null);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);

  const initializeQueue = useCallback(async (currentSong: SongData, reset: boolean = false) => {
    if (currentSong.id === currentSongId) return;

    setLoading(true);
    setCurrentSongId(currentSong.id);

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
  }, [playNextList, playlist, currentSongId, initializeQueue]);

  const addSong = useCallback((song: SongData) => {
    setPlaylist((prev) => [...prev ?? [], song]);
  }, []);

  return (
    <PlayNextContext.Provider value={{ initialized, setInitialized, loading, playlist, playNextList, currentSongId, initializeQueue, nextSong, addSong }}>
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
