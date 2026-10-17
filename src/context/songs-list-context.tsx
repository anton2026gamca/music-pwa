'use client';

import { SongData } from '@/app/api/actions';
import { useState, createContext, useContext } from 'react';

type SongsState = Record<string, string[] | undefined>;

interface SongsContextType {
  saveList: (listKey: string, newKeys: string[]) => void;
  deleteList: (listKey: string) => void;
  getSongsList: (listKey: string) => string[];
  addSong: (listKey: string, song: SongData) => void;
  removeSong: (listKey: string, id: string) => void;
  includesSong: (listKey: string, key: string) => boolean;
  getSongData: (id: string) => SongData | null;
  getSavedLists: () => string[];
}

const SongsContext = createContext<SongsContextType | undefined>(undefined);

export function SongsListProvider({ children }: { children: React.ReactNode }) {
  const getPlaylistKey = (key: string) => {
    return key === "downloaded_songs" ? "downloaded_songs" : `playlist_${key}`;
  }

  const [state, setState] = useState<SongsState>(() => {
    if (typeof window === "undefined") return {};

    const loadedState: SongsState = {};
    try {
      const lists: Array<string> = JSON.parse(localStorage.getItem('playlists') || "[]");
      lists.forEach((listKey) => {
        const stored = localStorage.getItem(getPlaylistKey(listKey));
        if (stored) {
          loadedState[listKey] = JSON.parse(stored);
        }
      });
    } catch (e) {
      console.error("Failed to parse initial storage", e);
    }

    return loadedState;
  });

  const saveList = (listKey: string, newKeys: string[]) => {
    setState((prev) => ({ ...prev, [listKey]: newKeys }));
    (listKey === "current_playlist" ? sessionStorage : localStorage).setItem(getPlaylistKey(listKey), JSON.stringify(newKeys));
    localStorage.setItem('playlists', JSON.stringify(Object.keys({ ...state, [listKey]: newKeys.length > 0 ? newKeys : undefined }).filter((key) => key !== "current_playlist")));
  };

  const deleteList = (listKey: string) => {
    setState((prev) => ({ ...prev, [listKey]: undefined }));
    (listKey === "current_playlist" ? sessionStorage : localStorage).removeItem(getPlaylistKey(listKey));
    localStorage.setItem('playlists', JSON.stringify(Object.keys({ ...state, [listKey]: undefined }).filter((key) => key !== "current_playlist")));
  };

  const addSong = (listKey: string, song: SongData) => {
    const currentList = state[listKey] ?? [];
    const updated = Array.from(new Set([...currentList, song.id]));
    saveList(listKey, updated);

    localStorage.setItem(`song_${song.id}`, JSON.stringify(song));
  };

  const removeSong = (listKey: string, id: string) => {
    const updated = state[listKey]?.filter((k) => k !== id) ?? [];
    saveList(listKey, updated);
  };

  const getSongData = (id: string): SongData | null => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`song_${id}`) ?? localStorage.getItem(`song_${id}`);
    return raw ? JSON.parse(raw) : null;
  };

  const getSongsList = (listKey: string) => state[listKey] ?? [];

  const includesSong = (listKey: string, key: string) => state[listKey]?.includes(key) ?? false;

  const getSavedLists = () => {
    return Object.keys(state).filter((key) => !["current_playlist", "downloaded_songs"].includes(key) && (state[key]?.length ?? 0) > 0);
  };

  return (
    <SongsContext.Provider value={{ saveList, deleteList, getSongsList, addSong, removeSong, includesSong, getSongData, getSavedLists }}>
      {children}
    </SongsContext.Provider>
  );
}

export function useSongsList(listKey: string) {
  const context = useContext(SongsContext);

  if (!context) {
    throw new Error("useSongs must be used within a SongsProvider");
  }

  return {
    songsList: context.getSongsList(listKey),
    addSong: (song: SongData) => context.addSong(listKey, song),
    removeSong: (id: string) => context.removeSong(listKey, id),
    includesSong: (id: string) => context.includesSong(listKey, id),
    getSongData: context.getSongData,
  };
}

export function useSongsListContext() {
  const context = useContext(SongsContext);

  if (!context) {
    throw new Error("useSongs must be used within a SongsProvider");
  }

  return context;
}
