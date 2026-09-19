export interface OfflineAssets {
  isOffline: boolean;
  fileSize: string | null;
  songUrl: string;
  thumbnailUrl: string | null;
  lyrics: Array<{ time: number; text: string }> | null;
}

/**
 * Checks cache storage and reads offline media assets for a given song ID.
 */
export async function getOfflineAssets(
  songId: string,
): Promise<OfflineAssets> {
  const cacheName = "offline-media-vault";
  const downloadUrl = `/api/download?id=${encodeURIComponent(songId)}`;

  try {
    const cache = await caches.open(cacheName);
    const mediaResponse = await cache.match(downloadUrl);

    if (mediaResponse) {
      const lengthHeader = mediaResponse.headers.get("content-length");
      let bytes = lengthHeader ? parseInt(lengthHeader, 10) : 0;

      const mediaBlob = await mediaResponse.blob();
      if (!bytes) bytes = mediaBlob.size;

      const fileSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

      const songUrl = URL.createObjectURL(mediaBlob);

      let thumbnailUrl: string | null = null;
      const cachedImg = await cache.match(`/api/offline/thumbnail?id=${songId}`);
      if (cachedImg) {
        const imgBlob = await cachedImg.blob();
        thumbnailUrl = URL.createObjectURL(imgBlob);
      }

      let lyrics = null;
      const cachedLyrics = await cache.match(`/api/offline/lyrics?id=${songId}`);
      if (cachedLyrics) {
        const lyricsJson = await cachedLyrics.json();
        if (lyricsJson.syncedLyrics) {
          lyrics = parseLrcString(lyricsJson.syncedLyrics);
        }
      }

      return {
        isOffline: true,
        songUrl: songUrl,
        fileSize,
        thumbnailUrl,
        lyrics,
      };
    }
  } catch (err) {
    console.error("Error unpacking offline assets:", err);
  }

  return {
    isOffline: false,
    songUrl: downloadUrl,
    fileSize: null,
    thumbnailUrl: null,
    lyrics: [],
  };
}

/**
 * Safe utility to revoke generated object URLs to prevent memory leaks.
 */
export function revokeBlobUrls(...urls: (string | null | undefined)[]) {
  urls.forEach((url) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * Parse the LRC string from lrclib
 */
export function parseLrcString(lrcText: string): Array<{ time: number; text: string }> {
  const lines = lrcText.split('\n');
  const result: Array<{ time: number; text: string }> = [];
  const timeRegex = /\[(\d+):(\d+)\.(\d+)\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);

      const timeInSeconds = minutes * 60 + seconds + milliseconds / 100;
      const text = line.replace(timeRegex, '').trim();

      result.push({ time: timeInSeconds, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Downloads and caches the main video/audio stream.
 */
export async function downloadVideoAsset(cache: Cache, songId: string): Promise<void> {
  const mediaUrl = `/api/download?id=${encodeURIComponent(songId)}`;
  const response = await fetch(mediaUrl);
  if (!response.ok) throw new Error("Failed to download media track.");

  await cache.put(mediaUrl, response.clone());
}

/**
 * Downloads and caches the thumbnail image asset.
 */
export async function downloadThumbnailAsset(cache: Cache, songId: string, thumbnailUrl?: string): Promise<void> {
  if (!thumbnailUrl) return;

  try {
    const response = await fetch(thumbnailUrl, { mode: "cors" });
    if (response.ok) {
      await cache.put(`/api/offline/thumbnail?id=${songId}`, response);
    }
  } catch (err) {
    console.warn("Failed to download thumbnail", err);
  }
}

/**
 * Fetches lyrics from LRCLIB and transforms them into a cacheable API response format.
 */
export async function downloadLyricsAsset(cache: Cache, songId: string, artistName: string, title: string): Promise<void> {
  try {
    const lrclibUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(lrclibUrl);

    if (response.ok) {
      const lyricsData = await response.json();
      const jsonResponse = new Response(JSON.stringify(lyricsData), {
        headers: { "Content-Type": "application/json" }
      });

      await cache.put(`/api/offline/lyrics?id=${songId}`, jsonResponse);
    }
  } catch (err) {
    console.warn("LRCLIB matching lyrics not found or failed.", err);
  }
}
