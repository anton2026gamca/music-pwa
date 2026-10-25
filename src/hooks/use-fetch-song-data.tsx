import { getSongDetails, SongData } from '@/app/api/actions';
import { useState, useEffect } from 'react';


function readCachedSong(id: string): SongData | null {
  const raw = sessionStorage.getItem(`song_${id}`) ?? localStorage.getItem(`song_${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SongData;
  } catch {
    return null;
  }
}

function cacheSong(song: SongData) {
  try {
    sessionStorage.setItem(`song_${song.id}`, JSON.stringify(song));
  } catch { }
}

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

    const cached = readCachedSong(songId);
    if (cached) {
      setSong(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    getSongDetails(songId)
      .then((songData) => {
        if (songData) {
          cacheSong(songData);
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
    if (!songIds || songIds.length === 0) {
      setSongs([]);
      setError("No song IDs provided.");
      setLoading(false);
      return;
    }

    setError(null);

    const cached: SongData[] = [];
    const missingIds: string[] = [];
    for (const id of songIds) {
      const song = readCachedSong(id);
      if (song) cached.push(song);
      else missingIds.push(id);
    }

    setSongs(cached);
    setLoading(missingIds.length > 0);

    if (missingIds.length === 0) return;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setLoading(false);
      if (cached.length === 0) setError("You're offline and these songs aren't available offline.");
      return;
    }

    let cancelled = false;

    Promise.allSettled(missingIds.map((id) => getSongDetails(id))).then((results) => {
      if (cancelled) return;

      const fetched = results
        .filter((r): r is PromiseFulfilledResult<SongData | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((song): song is SongData => song !== null);

      fetched.forEach(cacheSong);

      setSongs((prev) => [...prev, ...fetched]);
      if (fetched.length === 0 && cached.length === 0) {
        setError("Could not retrieve any song details.");
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
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
      const cached = readCachedSong(id);
      if (cached) return cached;

      const fetched = await getSongDetails(id);
      if (fetched) cacheSong(fetched);
      return fetched;
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
      .catch(() => error = "An unexpected server error occurred.");
  };

  await load();

  return { songs, error };
}
