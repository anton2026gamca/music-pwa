"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, AlertCircle, Play, ArrowDownToLine, Check, X, Text, WifiOff, Repeat } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { PlayPauseOverlay } from "./_components/play-pause-overlay";
import { useAudio } from "@/context/audio-context";
import { useFetchSongData } from "@/hooks/use-fetch-song-data";
import { CurrentlyPlaying } from "@/components/currently-playing";
import { PlayNextList } from "@/components/playlist/play-next-list";
import { usePlaylist } from "@/context/playlist-context";
import { SongPlaylist } from "@/components/playlist/song-playlist";
import { ThreeDotMenu } from "@/components/ui/three-dot-menu";
import { SongData } from "../api/actions";
import { LyricsPlayer } from "./_components/lyrics-player";
import { Badge } from "@/components/ui/badge";
import { MobileSongControls } from "@/components/song/mobile-song-controls";
import { useOnline } from "@/hooks/use-online";
import { useOfflineAssets } from "@/hooks/use-offline-assets";
import { OfflineAssets, revokeBlobUrls } from "@/lib/download-utils";
import { Toggle } from "@/components/ui/toggle";
import { SavePlaylistButton } from "./_components/save-playlist-button";
import useSearchParamsHelpers from "@/hooks/use-search-params-helper";

export default function WatchPageContent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const online = useOnline();

  const searchParams = useSearchParams();
  const { updateSearchParam } = useSearchParamsHelpers();

  const songIdParam = searchParams.get("id");
  const playlistParam = searchParams.get("playlist");

  const { song, loading: songLoading, error: songError } = useFetchSongData(songIdParam);

  const {
    loading: offlineAssetsLoading,
    error: offlineAssetsError,
    loadAssets: loadOfflineAssets,
    download: downloadOfflineAssets,
    videoDownloading,
    setVideoDownloading,
    lyricsDownloading,
    thumbnailDownloading,
  } = useOfflineAssets();
  const thumbnailUrl = song?.thumbnailUrl ?? '';

  const { state: globalAudioState, togglePlay } = useAudio();
  const isPaused = !globalAudioState.isPlaying;
  const [playPauseTriggerCount, setPlayPauseTriggerCount] = useState(0);

  const {
    playlist: currentPlaylist,
    setPlaylist: setCurrentPlaylist,
    playNextSong, playPrevSong,
    initializeQueue: initializePlayNextQueue,
    addSong: addSongToPlaylist,
    removeSong: removeSongFromPlaylist,
    offlineAssets: playlistOfflineAssets,
    loopEnabled, setLoopEnabled,
    playlistKey,
    differentFromSaved, setDifferentFromSaved,
  } = usePlaylist();
  const [loadedOfflineAssets, setLoadedOfflineAssets] = useState<OfflineAssets | null>(null);
  const offlineAssets = loadedOfflineAssets ?? playlistOfflineAssets;

  const [audioReady, setAudioReady] = useState(false);

  const [showLyrics, setShowLyrics] = useState(false);

  const loading = songLoading || offlineAssetsLoading;
  const error = songError ?? offlineAssetsError;

  useEffect(() => {
    let songUrl: string | null = null;
    let thumbnailUrl: string | null = null;

    if (song) {
      if (playlistParam && playlistKey !== playlistParam) {
        initializePlayNextQueue(null, true, playlistParam);
      }

      const load = async () => {
        if (!song?.id) return;

        if (playlistOfflineAssets?.songId === song.id) {
          // console.log(`[watch/page] Using playlist offline assets for song: ${song?.title} by ${song?.artistName}`);
          setLoadedOfflineAssets(playlistOfflineAssets);
        } else {
          // console.log(`[watch/page] Loading offline assets for song: ${song?.title} by ${song?.artistName}`);

          const assets = await loadOfflineAssets(song);

          songUrl = assets?.songUrl ?? null;
          thumbnailUrl = assets?.thumbnailUrl ?? null;

          setLoadedOfflineAssets(assets);
        }
      }
      load();
    }

    return () => {
      revokeBlobUrls(songUrl, thumbnailUrl);
      setLoadedOfflineAssets(null);
    }
  }, [song?.id, playlistParam]);

  const handleDownload = async (song: SongData) => {
    await downloadOfflineAssets(song);

    const assets = await loadOfflineAssets(song);
    setLoadedOfflineAssets(assets);
  }

  const handlePlayPause = () => {
    if (song && globalAudioState.currentSong?.id !== song.id) {
      playNextSong(song);
    } else {
      togglePlay();
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handlePlayPause();
        setPlayPauseTriggerCount(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);

  useEffect(() => {
    const ready = (offlineAssets && (offlineAssets.isOffline || globalAudioState.currentSong?.id === song?.id && globalAudioState.currentTime > 0)) ?? false;
    setAudioReady(ready);
    if (ready) {
      setVideoDownloading(false);
    }
  }, [offlineAssets?.isOffline, globalAudioState.currentSong?.id, globalAudioState.currentTime, song?.id]);

  if (!isMounted) {
    return null;
  }

  if (!online && (offlineAssets && !offlineAssets.isOffline || !song)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <WifiOff className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold tracking-tight">No internet connection</h2>
        <p className="text-sm text-muted-foreground mb-4">Please connect to the internet.</p>
      </div>
    );
  }

  if (error) {
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
    <div className="flex flex-col w-full h-full items-stretch">
      <div className="flex-1 flex flex-col lg:flex-row w-full items-stretch lg:overflow-auto">
        <div className="w-full lg:w-2/3 space-y-4 pt-4">
          <div className="px-4 space-y-3">
            <div className="relative aspect-square md:aspect-video w-full bg-black rounded-lg overflow-hidden">
              {loading || !song
                ? (
                  <div className="relative aspect-square md:aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <Skeleton className="absolute inset-0 w-full h-full" />
                  </div>
                ) : (
                  audioReady
                    ? (
                      <>
                        <Image
                          src={thumbnailUrl} alt={song.title} fill
                          className="object-cover"
                          loading="eager"
                          onClick={() => {
                            handlePlayPause()
                            setPlayPauseTriggerCount(prev => prev + 1);
                          }}
                        />
                        {offlineAssets?.lyrics && offlineAssets.lyrics.length > 1 && globalAudioState.currentSong?.id === song.id && (
                          <LyricsPlayer lyrics={offlineAssets?.lyrics} visible={showLyrics} />
                        )}
                        <PlayPauseOverlay isPaused={isPaused} triggerCount={playPauseTriggerCount} />
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
                            onClick={() => {
                              handlePlayPause();
                              setVideoDownloading(true);
                            }}
                          >
                            <div className="rounded-full p-2 bg-muted text-foreground">
                              <Play className="h-8 w-8 fill-current stroke-none" />
                            </div>
                          </div>
                        )}
                      </>
                    )
                )}
            </div>

            <div className="px-1 flex items-center justify-between text-nowrap gap-2">
              {songLoading || !song ? (
                <div className="px-1">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </div>
              ) : (
                <>
                  <div className="overflow-hidden">
                    <h2 className="text-xl font-semibold tracking-tight">{song.title}</h2>
                    <p className="text-sm text-muted-foreground">{song.artistName}</p>
                  </div>
                  {!loading && offlineAssets?.songId === song.id && (
                    <div className="flex items-center gap-2">
                      {offlineAssets?.isOffline && (
                        <Badge className="hidden lg:flex"><ArrowDownToLine />Downloaded</Badge>
                      )}

                      {offlineAssets?.lyrics && offlineAssets.lyrics.length > 1 ? (
                        <Badge className="bg-green-400"><Check />Lyrics</Badge>
                      ) : (
                        <Badge className="bg-red-400"><X />Lyrics</Badge>
                      )}

                      <ThreeDotMenu groups={[
                        {
                          fields: [
                            {
                              label: "Add to playlist",
                              onClick: () => addSongToPlaylist(song),
                              disabled: currentPlaylist?.find((s) => s.id === song.id) !== undefined,
                            },
                            {
                              label: "Remove from playlist",
                              onClick: () => removeSongFromPlaylist(song.id),
                              disabled: currentPlaylist?.find((s) => s.id === song.id) === undefined || globalAudioState.currentSong?.id === song.id,
                            },
                            {
                              label: "Add to new playlist",
                              onClick: () => {
                                initializePlayNextQueue(song, true);
                                playNextSong(song);
                                updateSearchParam("playlist", null);
                              }
                            },
                          ],
                        },
                        {
                          fields: [
                            {
                              label: showLyrics ? "Hide Lyrics" : "Show Lyrics",
                              onClick: () => setShowLyrics((prev) => !prev),
                              disabled: !offlineAssets?.lyrics || offlineAssets.lyrics.length === 0 || globalAudioState.currentSong?.id !== song.id,
                            }
                          ],
                        },
                        {
                          fields: [
                            {
                              label: "Download",
                              onClick: () => handleDownload(song),
                              disabled: offlineAssets?.isOffline || videoDownloading || lyricsDownloading || thumbnailDownloading,
                            }
                          ],
                        },
                      ]} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="px-4 mb-4 space-y-4">
            <div className="flex items-center gap-2 overflow-auto scrollbar-none">
              <Button
                disabled={!song || offlineAssets?.songId !== song.id || offlineAssets?.isOffline || videoDownloading || lyricsDownloading || thumbnailDownloading}
                onClick={() => song && handleDownload(song)}
              >
                <ArrowDownToLine /> Download
              </Button>
              <Button
                onClick={() => setShowLyrics((prev) => !prev)}
                disabled={!song || !offlineAssets?.lyrics || offlineAssets.lyrics.length === 0 || globalAudioState.currentSong?.id !== song.id}
              >
                <Text /> {!song || !offlineAssets?.lyrics || offlineAssets.lyrics.length === 0 ? "No" : showLyrics && globalAudioState.currentSong?.id === song.id ? "Hide" : "Show"} Lyrics
              </Button>
              <Separator orientation="vertical" className="lg:hidden" />
              <Button
                onClick={() => song && addSongToPlaylist(song)}
                disabled={!song || currentPlaylist?.find((s) => s.id === song.id) !== undefined}
                className="lg:hidden"
              >
                Add to playlist
              </Button>
              <Button
                onClick={() => song && removeSongFromPlaylist(song.id)}
                disabled={!song || currentPlaylist?.find((s) => s.id === song.id) === undefined || globalAudioState.currentSong?.id === song.id}
                className="lg:hidden"
              >
                Remove from playlist
              </Button>
              <Button
                onClick={() => {
                  if (!song) return;
                  initializePlayNextQueue(song, true);
                  playNextSong(song);
                  updateSearchParam("playlist", null);
                }}
                className="lg:hidden"
              >
                Add to new playlist
              </Button>
            </div>
            <MobileSongControls
              song={song}
              handlePlayPause={handlePlayPause}
              handleNext={playNextSong}
              handlePrevious={playPrevSong}
            />
          </div>
        </div>

        <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
        <Separator orientation="horizontal" className="block lg:hidden" />

        <div className="w-full lg:w-1/3 flex flex-col overflow-auto">
          <SongPlaylist
            title={(playlistParam ?? "Current playlist") + (differentFromSaved ? " *" : "")}
            titleClassName={differentFromSaved ? "italic" : ""}
            songs={currentPlaylist}
            enableReorder={true}
            onReorder={(newSongs) => setCurrentPlaylist(newSongs as SongData[])}
            buttons={
              <>
                <SavePlaylistButton
                  playlistParam={playlistParam}
                  onSave={(playlistName, _) => {
                    updateSearchParam("playlist", playlistName);
                    setDifferentFromSaved(false);
                  }}
                  className={playlistParam && !differentFromSaved ? "hidden" : ""}
                />
                <Toggle pressed={loopEnabled} onPressedChange={(pressed) => setLoopEnabled(pressed)} className="aria-pressed:bg-foreground aria-pressed:text-background">
                  <Repeat />
                </Toggle>
              </>
            }
          />
          <PlayNextList />
        </div>
      </div>

      {song && song.id !== globalAudioState.currentSong?.id && (
        <>
          <Separator orientation="horizontal" />
          <CurrentlyPlaying />
        </>
      )}
    </div>
  )
}
