'use server';

import YTMusic from 'ytmusic-api';
import type { SongDetailed } from 'ytmusic-api';

export interface SongResult {
  id: string;
  title: string;
  thumbnailUrl: string;
  artistName: string;
  duration?: number;
}

export async function searchSongs(query: string): Promise<SongResult[]> {
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
