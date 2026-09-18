'use client';

import { SongData } from '@/app/api/actions';
import { useState, useEffect } from 'react';

export function useDownloadedSongs() {
  const storageKey = 'downloaded_songs';
  const [downloadedSongs, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setKeys(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse storage key:", e);
      }
    }
  }, [storageKey]);

  const saveDownloadedSongs = (newKeys: string[]) => {
    setKeys(newKeys);
    localStorage.setItem(storageKey, JSON.stringify(newKeys));
  };

  const addDownloadedSong = (song: SongData) => {
    const updated = Array.from(new Set([...downloadedSongs, song.id]));
    saveDownloadedSongs(updated);

    localStorage.setItem(`song_${song.id}`, JSON.stringify(song));

    console.log(`Added song ${song.id} to downloaded songs.`);
  };

  const removeDownloadedSong = (id: string) => {
    const updated = downloadedSongs.filter((k) => k !== id);
    saveDownloadedSongs(updated);

    console.log(`Removed song ${id} from downloaded songs.`);
  };

  const getDownloadedSong = (id: string): SongData | null => {
    const raw = localStorage.getItem(`song_${id}`);
    const song = raw ? JSON.parse(raw) : null;
    return song;
  }

  const isSongDownloaded = (key: string) => downloadedSongs.includes(key);

  return { downloadedSongs, addDownloadedSong, removeDownloadedSong, isSongDownloaded, getDownloadedSong };
}
