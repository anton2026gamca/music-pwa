"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, Play } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { downloadLyricsAsset, downloadThumbnailAsset, downloadVideoAsset, getOfflineAssets, OfflineAssets, revokeBlobUrls } from "./_lib/download-utils";
import { OfflineStatus } from "./_components/offline-status";
import { PlayPauseOverlay } from "./_components/play-pause-overlay";
import { SongControls } from "@/components/song-controls";
import { useAudio } from "@/context/audio-context";
import { useFetchSongData } from "@/hooks/use-fetch-song-data";
import { CurrentlyPlaying } from "@/components/currently-playing";
import { useDownloadedSongs } from "@/hooks/use-downloaded-songs";
import { PlayNextList } from "@/components/play-next-list";
import { usePlaylist } from "@/context/playlist-context";
import { SongPlaylist } from "@/components/song-playlist";
import { ThreeDotMenu } from "@/components/ui/three-dot-menu";
import { SongData } from "../api/actions";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const songIdParam = searchParams.get("id");
  const autoplay = ["true", "1"].includes(searchParams.get("autoplay") ?? "false");

  const { song, loading, error: songError } = useFetchSongData(songIdParam);
  const [error, setError] = useState<string | null>(null);

  const [videoDownloading, setVideoDownloading] = useState(false);
  const [lyricsDownloading, setLyricsDownloading] = useState(false);
  const [thumbnailDownloading, setThumbnailDownloading] = useState(false);

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);
  const thumbnailUrl = offlineAssets?.thumbnailUrl ?? song?.thumbnailUrl ?? '';

  const { state: globalAudioState, togglePlay, playTrack, subscribe: subscribeToAudio } = useAudio();
  const isPaused = !globalAudioState.isPlaying;
  const [triggerCount, setTriggerCount] = useState(0);

  const {
    addSong: addDownloadedSong,
    removeSong: removeDownloadedSong,
    includesSong: isSongDownloaded
  } = useDownloadedSongs();

  const {
    playlist: currentPlaylist,
    setPlaylist: setCurrentPlaylist,
    nextSong: playNextSong,
    initializeQueue: initializePlayNextQueue,
    initialized: playNextQueueInitialized,
    addSong: addSongToPlaylist,
    removeSong: removeSongFromPlaylist
  } = usePlaylist();

  const [autoPlayNext, setAutoPlayNext] = useState(true);

  const onAutoplayEnabledChanged = useCallback((enabled: boolean) => {
    setAutoPlayNext(enabled);
  }, []);

  const handlePlayPause = () => {
    if (song && globalAudioState.currentTrack !== song.id && offlineAssets) {
      if (!currentPlaylist?.find((s) => s.id === song.id)) {
        initializePlayNextQueue(song, true);
      }
      playTrack(offlineAssets.songUrl, song.id);
    } else {
      togglePlay();
      setTriggerCount(prev => prev + 1);
    }
  }

  const onSongEnded = useCallback((id: string) => {
    if (!autoPlayNext) {
      return;
    }

    const nextSong = playNextSong();
    if (nextSong === null) {
      return;
    }

    sessionStorage.setItem(`song_${nextSong.id}`, JSON.stringify(nextSong))
    router.push(`/watch?id=${encodeURIComponent(nextSong.id)}&autoplay=1`)
  }, [autoPlayNext, playNextSong]);

  useEffect(() => {
    if (!playNextQueueInitialized && song !== null) {
      initializePlayNextQueue(song, true);
    }
  }, [song?.id]);

  useEffect(() => {
    const unsubscribe = subscribeToAudio((state) => {
      if (state.ended && state.currentTrack !== null) {
        onSongEnded(state.currentTrack);
      }
    })

    return () => {
      unsubscribe();
    };
  }, [onSongEnded]);

  useEffect(() => {
    if (!song?.id) return;

    let activeSongUrl: string | null = null;
    let activeThumbUrl: string | null = null;

    const loadMediaContext = async () => {
      const assets = await getOfflineAssets(song.id);

      setOfflineAssets(assets);

      activeSongUrl = assets.songUrl;
      activeThumbUrl = assets.thumbnailUrl;

      if (!assets.isOffline && isSongDownloaded(song.id)) {
        removeDownloadedSong(song.id);
      }
    };

    loadMediaContext();

    return () => {
      revokeBlobUrls(activeSongUrl, activeThumbUrl);
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
  }, [handlePlayPause]);

  const handleDownload = async () => {
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

  useEffect(() => {
    if (autoplay && song && globalAudioState.currentTrack !== song.id && offlineAssets?.songId === song.id) {
      playTrack(offlineAssets.songUrl, song.id);
    }
  }, [song?.id, offlineAssets?.songUrl]);

  if (loading) {
    return (
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
    );
  }

  if (error || songError || !song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold tracking-tight">Error!</h2>
        <p className="text-sm text-muted-foreground mb-4">{error ?? songError}</p>

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
    <div className="flex flex-col w-full h-full items-stretch">
      <div className="flex-1 flex flex-col lg:flex-row w-full items-stretch lg:overflow-auto">
        <div className="w-full lg:w-2/3 space-y-4 pt-4">
          <div className="px-4 space-y-3">
            <div className="relative aspect-square md:aspect-video w-full bg-black rounded-lg overflow-hidden">
              {offlineAssets && (offlineAssets.isOffline || autoplay || globalAudioState.currentTrack === song.id)
                ? (
                  <>
                    <Image
                      src={thumbnailUrl} alt={song.title} fill
                      className="object-cover"
                      loading="eager"
                      onClick={() => handlePlayPause()}
                    />
                    <PlayPauseOverlay isPaused={isPaused} triggerCount={triggerCount} />
                    <SongControls
                      src={offlineAssets.songUrl}
                      song={song}
                      className="w-full absolute bottom-0"
                    />
                  </>
                ) : (
                  <>
                    <Image
                      src={thumbnailUrl} alt={song.title} fill
                      className="object-cover"
                      loading="eager"
                    />

                    {videoDownloading ? (
                      <div className="absolute inset-0 transition-opacity bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="rounded-full p-2 bg-muted">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/30 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => handlePlayPause()}
                      >
                        <div className="rounded-full p-2 bg-muted text-foreground">
                          <Play className="h-8 w-8 fill-current stroke-none" />
                        </div>
                      </div>
                    )}
                  </>
                )}
            </div>

            <div className="px-1 flex items-center text-nowrap gap-2">
              <div className="flex-1 overflow-hidden">
                <h2 className="text-xl font-semibold tracking-tight">{song.title}</h2>
                <p className="text-sm text-muted-foreground">{song.artistName}</p>
              </div>
              <div>
                <ThreeDotMenu groups={[{
                  fields: [
                    {
                      label: "Add to Playlist",
                      onClick: () => addSongToPlaylist(song),
                      disabled: currentPlaylist?.find((s) => s.id === song.id) !== undefined
                    },
                    {
                      label: "Remove from Playlist",
                      onClick: () => removeSongFromPlaylist(song.id),
                      disabled: currentPlaylist?.find((s) => s.id === song.id) === undefined || globalAudioState.currentTrack === song.id
                    },
                  ]
                }]} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="px-4 mb-4">
            {offlineAssets && (
              <OfflineStatus
                offlineAssets={offlineAssets}
                videoDownloading={videoDownloading}
                lyricsDownloading={lyricsDownloading}
                thumbnailDownloading={thumbnailDownloading}
                onDownloadClick={() => handleDownload()}
              />
            )}
          </div>
        </div>

        <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
        <Separator orientation="horizontal" className="block lg:hidden" />

        <div className="w-full lg:w-1/3 flex flex-col overflow-auto">
          <SongPlaylist
            title="Current Playlist"
            songs={currentPlaylist}
            enableReorder={true}
            onReorder={(newSongs) => setCurrentPlaylist(newSongs as SongData[])}
          />
          <PlayNextList onEnabledChanged={onAutoplayEnabledChanged} />
        </div>
      </div>

      {song.id !== globalAudioState.currentTrack && (
        <>
          <Separator orientation="horizontal" />
          <CurrentlyPlaying />
        </>
      )}
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
