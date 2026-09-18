"use client";

import { useSearchParams } from "next/navigation";
import { getSongDetails, SongData } from "../api/actions";
import { useEffect, useState, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowDownToLine } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { downloadLyricsAsset, downloadThumbnailAsset, downloadVideoAsset, getOfflineAssets, OfflineAssets, revokeBlobUrls } from "./_lib/download-utils";
import { OfflineStatus } from "./_components/offline-status";
import { PlayPauseOverlay } from "./_components/play-pause-overlay";
import { useDownloadedSongs } from "@/hooks/use-downloaded-songs";
import { SongItem } from "@/components/song-item";
import { SongPlaylist } from "@/components/song-playlist";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const songIdParam = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<SongData | null>(null);

  const [videoDownloading, setVideoDownloading] = useState(false);
  const [lyricsDownloading, setLyricsDownloading] = useState(false);
  const [thumbnailDownloading, setThumbnailDownloading] = useState(false);

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets>({
    isOffline: false,
    videoUrl: '',
    fileSize: null,
    thumbnailUrl: null,
    lyrics: null,
  });
  const thumbnailUrl = offlineAssets.thumbnailUrl ?? song?.thumbnailUrl ?? '';

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPaused, setIsPaused] = useState(true);
  const [triggerCount, setTriggerCount] = useState(0);

  const { downloadedSongs, addDownloadedSong, removeDownloadedSong, isSongDownloaded, getDownloadedSong } = useDownloadedSongs();

  useEffect(() => {
    if (!songIdParam) {
      setError("No song ID provided.");
      setLoading(false);
      return;
    }

    const forwardedSong = sessionStorage.getItem(`song_${songIdParam}`) ?? localStorage.getItem(`song_${songIdParam}`);
    if (forwardedSong) {
      setSong(JSON.parse(forwardedSong));
      setLoading(false);
      return;
    }

    setLoading(true);
    getSongDetails(songIdParam)
      .then((songData) => {
        if (songData) setSong(songData);
        else setError("Could not retrieve song details.");
      })
      .catch(() => setError("An unexpected server error occurred."))
      .finally(() => setLoading(false));
  }, [songIdParam]);

  useEffect(() => {
    if (!song?.id) return;

    let activeVideoSrc: string | null = null;
    let activeThumbSrc: string | null = null;

    const loadMediaContext = async () => {
      const assets = await getOfflineAssets(song.id);

      setOfflineAssets(assets);

      activeVideoSrc = assets.videoUrl;
      activeThumbSrc = assets.thumbnailUrl;

      console.log("Offline assets loaded:", assets);
      if (assets.isOffline && !isSongDownloaded(song.id)) {
        addDownloadedSong(song);
      } else if (!assets.isOffline && isSongDownloaded(song.id)) {
        removeDownloadedSong(song.id);
      }
    };

    loadMediaContext();

    return () => {
      revokeBlobUrls(activeVideoSrc, activeThumbSrc);
    };
  }, [song?.id, videoDownloading, lyricsDownloading, thumbnailDownloading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDownload = async () => {
    if (!song?.id) {
      setError("No song available to download.");
      return;
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

      if (!offlineAssets.thumbnailUrl) {
        setThumbnailDownloading(true);
        await downloadThumbnailAsset(cache, song.id, song.thumbnailUrl);
        setThumbnailDownloading(false);
      }

      if (!offlineAssets.lyrics || offlineAssets.lyrics.length === 0) {
        setLyricsDownloading(true);
        await downloadLyricsAsset(cache, song.id, song.artistName || "", song.title || "");
        setLyricsDownloading(false);
      }

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

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.pause();
      setIsPaused(true);
    }

    setTriggerCount(prev => prev + 1);
  }

  if (loading) {
    return (
      <div className="flex w-full h-full items-stretch">
        <div className="w-80 hidden md:block">
        </div>

        <Separator orientation="vertical" className="hidden md:block h-auto min-h-full" />

        <div className="flex flex-col lg:flex-row w-full min-h-screen mx-auto items-stretch lg:max-h-screen">
          <div className="w-full lg:w-2/3 space-y-3 p-4">
            <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
              <Skeleton className="absolute inset-0 w-full h-full" />
            </div>
            <div className="px-1">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </div>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
          <Separator orientation="horizontal" className="block lg:hidden my-2" />

          <div className="w-full lg:w-1/3 flex flex-col overflow-auto p-4">
          </div>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold tracking-tight">Error!</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>

        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full items-stretch">
      <div className="w-80 hidden md:block">
        <SongPlaylist title="Downloaded Songs" songs={downloadedSongs} />
      </div>

      <Separator orientation="vertical" className="hidden md:block h-auto min-h-full" />

      <div className="flex flex-col lg:flex-row w-full h-full items-stretch">
        <div className="w-full lg:w-2/3 space-y-3 p-4">
          <div className="relative aspect-square md:aspect-video w-full bg-black rounded-lg overflow-hidden">
            {offlineAssets.isOffline
              ? (
                <>
                  <Image
                    src={thumbnailUrl} alt={song.title} fill
                    className="object-cover"
                    onClick={() => handlePlayPause()}
                  />
                  <PlayPauseOverlay isPaused={isPaused} triggerCount={triggerCount} />
                  <audio
                    ref={audioRef}
                    src={offlineAssets.videoUrl}
                    controls
                    className="w-full absolute bottom-0"
                    preload="auto"
                  />
                </>
              ) : (
                <>
                  <Image src={thumbnailUrl} alt={song.title} fill className="object-cover" />

                  {videoDownloading ? (
                    <div className="absolute inset-0 transition-opacity bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="rounded-full p-2 bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/30 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => handleDownload()}
                    >
                      <div className="rounded-full p-2 bg-muted text-foreground">
                        <ArrowDownToLine className="h-8 w-8" />
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>

          <div className="px-1 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{song.title}</h2>
              <p className="text-sm text-muted-foreground">{song.artistName}</p>
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
        <Separator orientation="horizontal" className="block lg:hidden my-2" />

        <div className="w-full lg:w-1/3 flex flex-col overflow-auto p-4">
          <OfflineStatus
            offlineAssets={offlineAssets}
            videoDownloading={videoDownloading}
            lyricsDownloading={lyricsDownloading}
            thumbnailDownloading={thumbnailDownloading}
            onDownloadClick={() => handleDownload()}
          />
        </div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  );
}
