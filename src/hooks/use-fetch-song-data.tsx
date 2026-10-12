import { getSongDetails, SongData } from '@/app/api/actions';
import { useState, useEffect } from 'react';


export function useFetchSongData(songId: string | null) {
  const [song, setSong] = useState<SongData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSong(null);
    setError(null);

    if (!songId) {
      setError("No song ID provided.");
      setLoading(false);
      return;
    }

    const forwardedSong = sessionStorage.getItem(`song_${songId}`) ?? localStorage.getItem(`song_${songId}`);
    if (forwardedSong) {
      setSong(JSON.parse(forwardedSong));
      setLoading(false);
      return;
    }

    setLoading(true);
    getSongDetails(songId)
      .then((songData) => {
        if (songData) {
          setSong(songData);
        } else {
          setError("Could not retrieve song details.");
        }
      })
      .catch(() => setError("An unexpected server error occurred."))
      .finally(() => setLoading(false));
  }, [songId]);

  return { song, loading, error };
}

export function useFetchSongsData(songIds: string[]) {
  const [songs, setSongs] = useState<SongData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idsDependency = JSON.stringify(songIds);

  useEffect(() => {
    setSongs([]);
    setError(null);

    if (!songIds || songIds.length === 0) {
      setError("No song IDs provided.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchPromises = songIds.map(async (id) => {
      const cached = sessionStorage.getItem(`song_${id}`) ?? localStorage.getItem(`song_${id}`);
      if (cached) {
        return JSON.parse(cached) as SongData;
      }

      return getSongDetails(id);
    });

    Promise.all(fetchPromises)
      .then((results) => {
        const validSongs = results.filter((song): song is SongData => song !== null);

        if (validSongs.length > 0) {
          setSongs(validSongs);
        } else {
          setError("Could not retrieve any song details.");
        }
      })
      .catch(() => setError("An unexpected server error occurred."))
      .finally(() => setLoading(false));

  }, [idsDependency]);

  return { songs, loading, error };
}

export async function fetchSongsData(songIds: string[]) {
  let songs: SongData[] = [];
  let error: string | null = null;

  const load = async () => {
    if (!songIds || songIds.length === 0) {
      error = "No song IDs provided.";
      return;
    }

    const fetchPromises = songIds.map(async (id) => {
      const cached = sessionStorage.getItem(`song_${id}`) ?? localStorage.getItem(`song_${id}`);
      if (cached) {
        return JSON.parse(cached) as SongData;
      }

      return getSongDetails(id);
    });

    await Promise.all(fetchPromises)
      .then((results) => {
        const validSongs = results.filter((song): song is SongData => song !== null);

        if (validSongs.length > 0) {
          songs = validSongs;
        } else {
          error = "Could not retrieve any song details.";
        }
      })
      .catch(() => error = "An unexpected server error occurred.")
  }

  await load();

  return { songs, error };
}
