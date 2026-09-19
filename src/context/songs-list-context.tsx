'use client';

import { SongData } from '@/app/api/actions';
import { useState, useEffect, createContext, useContext } from 'react';

export enum SongListKey {
  Downloaded = 'downloaded_songs',
  Cached = 'cached_songs',
}

type SongsState = Record<SongListKey, string[]>;

interface SongsContextType {
  getSongsList: (listKey: SongListKey) => string[];
  addSong: (listKey: SongListKey, song: SongData) => void;
  removeSong: (listKey: SongListKey, id: string) => void;
  includesSong: (listKey: SongListKey, key: string) => boolean;
  getSongData: (id: string) => SongData | null;
}

const SongsContext = createContext<SongsContextType | undefined>(undefined);

const initialEmptyState: SongsState = {
  [SongListKey.Downloaded]: [],
  [SongListKey.Cached]: [],
};

export function SongsListProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SongsState>(initialEmptyState);

  useEffect(() => {
    const loadedState = { ...initialEmptyState };

    Object.values(SongListKey).forEach((listKey) => {
      const stored = localStorage.getItem(listKey);
      if (stored) {
        try {
          loadedState[listKey] = JSON.parse(stored);
        } catch (e) {
          console.error(`Failed to parse storage key ${listKey}:`, e);
        }
      }
    });

    setState(loadedState);
  }, []);

  const saveList = (listKey: SongListKey, newKeys: string[]) => {
    setState((prev) => ({ ...prev, [listKey]: newKeys }));
    localStorage.setItem(listKey, JSON.stringify(newKeys));
  };

  const addSong = (listKey: SongListKey, song: SongData) => {
    const currentList = state[listKey];
    const updated = Array.from(new Set([...currentList, song.id]));
    saveList(listKey, updated);

    localStorage.setItem(`song_${song.id}`, JSON.stringify(song));
  };

  const removeSong = (listKey: SongListKey, id: string) => {
    const updated = state[listKey].filter((k) => k !== id);
    saveList(listKey, updated);
  };

  const getSongData = (id: string): SongData | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(`song_${id}`);
    return raw ? JSON.parse(raw) : null;
  };

  const getSongsList = (listKey: SongListKey) => state[listKey];

  const includesSong = (listKey: SongListKey, key: string) => state[listKey].includes(key);

  return (
    <SongsContext.Provider value={{ getSongsList, addSong, removeSong, includesSong, getSongData }}>
      {children}
    </SongsContext.Provider>
  );
}

export function useSongsList() {
  const context = useContext(SongsContext);
  if (!context) {
    throw new Error("useSongs must be used within a SongsProvider");
  }
  return context;
}
