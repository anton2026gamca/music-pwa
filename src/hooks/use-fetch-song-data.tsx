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
