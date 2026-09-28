"use client";

import { downloadThumbnailAsset, downloadVideoAsset, fetchLyricsData, getOfflineAssets, OfflineAssets, revokeBlobUrls, storeLyricsAsset } from "@/lib/download-utils";
import { useCallback, useEffect, useState } from "react";
import { useDownloadedSongs } from "@/hooks/use-downloaded-songs";
import { SongData } from "@/app/api/actions";

export function useOfflineAssets(initialSong: SongData | null = null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);

  const {
    addSong: addDownloadedSong,
    removeSong: removeDownloadedSong,
    includesSong: isSongDownloaded
  } = useDownloadedSongs();

  const [videoDownloading, setVideoDownloading] = useState(false);
  const [lyricsDownloading, setLyricsDownloading] = useState(false);
  const [thumbnailDownloading, setThumbnailDownloading] = useState(false);

  const loadAssets = useCallback(async (song: SongData) => {
    setLoading(true);
    console.log(`Loading offline assets for song: ${song.title} by ${song.artistName}`);
    try {
      const assets = await getOfflineAssets(song.id);

      if (!assets.lyrics || assets.lyrics.length === 0) {
        assets.lyrics = await fetchLyricsData(song.artistName, song.title, song.duration);
      }

      setOfflineAssets(assets);

      if (!assets.isOffline && isSongDownloaded(song.id)) {
        removeDownloadedSong(song.id);
      }
      if (assets.isOffline && !isSongDownloaded(song.id)) {
        addDownloadedSong(song);
      }

      return assets;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
      return null;
    } finally {
      setLoading(false);
    }
  }, [isSongDownloaded, removeDownloadedSong]);

  useEffect(() => {
    if (!initialSong?.id || loading) return;

    let activeSongUrl: string | null = null;
    let activeThumbUrl: string | null = null;

    const run = async () => {
      const assets = await loadAssets(initialSong);
      if (assets) {
        activeSongUrl = assets.songUrl;
        activeThumbUrl = assets.thumbnailUrl;
      }
    };

    run();

    return () => {
      revokeBlobUrls(activeSongUrl, activeThumbUrl);
    };
  }, [initialSong?.id, loadAssets, videoDownloading, lyricsDownloading, thumbnailDownloading]);

  const download = async (song: SongData | null) => {
    if (!song?.id) {
      setError("No song available to download.");
      return;
    }

    if (!offlineAssets) {
      throw new Error("Offline assets not initialized.");
    }

    setError(null);

    try {
      if (typeof window !== "undefined" && navigator.storage?.persist) {
        await navigator.storage.persist();
      }

      const cache = await caches.open("offline-media-vault");

      if (!offlineAssets.isOffline) {
        setVideoDownloading(true);
        await downloadVideoAsset(cache, song.id);
        setVideoDownloading(false);
      }

      addDownloadedSong(song);

      if (!offlineAssets.thumbnailUrl) {
        setThumbnailDownloading(true);
        await downloadThumbnailAsset(cache, song.id, song.thumbnailUrl);
        setThumbnailDownloading(false);
      }

      if (!offlineAssets.lyrics || offlineAssets.lyrics.length === 0) {
        setLyricsDownloading(true);
        offlineAssets.lyrics = await fetchLyricsData(song.artistName, song.title, song.duration);
        setLyricsDownloading(false);
      }
      storeLyricsAsset(cache, song.id, offlineAssets.lyrics)

      console.log("Track, artwork, and syncing lyrics saved offline successfully!");
    } catch (err) {
      console.error("Storage error:", err);
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setVideoDownloading(false);
      setLyricsDownloading(false);
      setThumbnailDownloading(false);
    }
  };

  return {
    loading,
    error,
    offlineAssets,
    download,
    loadAssets,
    videoDownloading,
    setVideoDownloading,
    lyricsDownloading,
    setLyricsDownloading,
    thumbnailDownloading,
    setThumbnailDownloading
  };
}
