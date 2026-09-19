'use server';

import { getYTMusic } from '@/lib/ytmusic';
import type { SongDetailed } from 'ytmusic-api';

export interface SongData {
  id: string;
  title: string;
  thumbnailUrl: string;
  artistName: string;
  duration?: number;
}

export async function searchSongs(query: string): Promise<SongData[]> {
  const ytmusic = await getYTMusic();

  const songResults: SongDetailed[] = await ytmusic.searchSongs(query);

  return songResults.map((song) => {
    const thumbnailUrl = `https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`;

    console.log(song);

    return {
      id: song.videoId,
      title: song.name,
      thumbnailUrl: thumbnailUrl,
      duration: song.duration ?? undefined,
      artistName: song.artist.name,
    };
  });
}

export async function getSongDetails(songId: string): Promise<SongData | null> {
  try {
    const ytmusic = await getYTMusic();

    const song = await ytmusic.getSong(songId);

    if (!song) return null;

    const thumbnailUrl = `https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`;

    return {
      id: song.videoId,
      title: song.name,
      thumbnailUrl: thumbnailUrl,
      duration: song.duration ?? undefined,
      artistName: song.artist.name,
    };
  } catch (error) {
    console.error("Failed to fetch song details:", error);
    return null;
  }
}
