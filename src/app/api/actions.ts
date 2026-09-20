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

export async function getPlayNextSuggestions(songId: string): Promise<SongData[] | null> {
  if (!songId) {
    return null;
  }

  try {
    const ytmusic = await getYTMusic();
    const rawSuggestions = await ytmusic.getUpNexts(songId);

    const formattedSuggestions: SongData[] = rawSuggestions.map((song) => {
      const thumbnailUrl = `https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`;

      const duration = song.duration as number | string;
      const artist = song.artists as { name: string } | string;

      const formatStringDuration = (str: string) => {
        const spl = str.split(":");
        let sum = 0;
        spl.reverse().forEach((s, i) => {
          sum += parseInt(s) * [1, 60, 3600][i];
        })
        return sum;
      }

      return {
        id: song.videoId,
        title: song.title,
        thumbnailUrl: thumbnailUrl,
        duration: typeof duration === "string" ? formatStringDuration(duration) : song.duration,
        artistName: typeof artist === "string" ? artist : artist.name,
      };
    });

    return formattedSuggestions;
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return null;
  }
}
