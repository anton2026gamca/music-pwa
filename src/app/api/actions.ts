'use server';

import YTMusic from 'ytmusic-api';
import type { SongDetailed } from 'ytmusic-api';

export interface SongData {
  id: string;
  title: string;
  thumbnailUrl: string;
  artistName: string;
  duration?: number;
}

export async function searchSongs(query: string): Promise<SongData[]> {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();

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

export async function getSongDetails(videoId: string): Promise<SongData | null> {
  try {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    const song = await ytmusic.getSong(videoId);

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
