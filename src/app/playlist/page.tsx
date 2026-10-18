"use client";

import { CurrentlyPlaying } from "@/components/currently-playing";
import { Separator } from "@/components/ui/separator";
import { useSongsListContext } from "@/context/songs-list-context";
import { getOfflineAssets, OfflineAssets, revokeBlobUrls } from "@/lib/download-utils";
import { createPlaylistKey, formatPlaylistKey, getPlaylistCustomIcon } from "@/lib/playlist-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Music, Play, Shuffle, TextCursor, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongPlaylist } from "@/components/playlist/song-playlist";
import { usePlaylist } from "@/context/playlist-context";
import { DialogButton } from "@/components/ui/dialog-button";

export default function PlaylistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistKey = searchParams.get("id") ?? "current_playlist";

  const { getSongsList, getSongData, saveList, removeSong, deleteList } = useSongsListContext();

  const [mounted, setMounted] = useState(false);
  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);

  const songIds = getSongsList(playlistKey) || [];
  const totalSongs = songIds.length;
  const songCountText = totalSongs === 1 ? '1 song' : `${totalSongs} songs`;

  const firstSongId = songIds[0] || null;
  const firstSongData = firstSongId ? getSongData(firstSongId) : null;

  const thumbnailUrl = offlineAssets?.thumbnailUrl ?? firstSongData?.thumbnailUrl ?? '';
  const displayName = formatPlaylistKey(playlistKey);
  const customIcon = getPlaylistCustomIcon(playlistKey, 16);
  const hasCustomIcon = !!customIcon;

  const { initializeQueue, playlistKey: contextPlaylistKey, setPlaylistKey: setContextPlaylistKey } = usePlaylist();

  useEffect(() => {
    if (!firstSongId || hasCustomIcon) {
      setMounted(true);
      return;
    }

    let activeThumbSrc: string | null = null;

    const loadMediaContext = async () => {
      try {
        const assets = await getOfflineAssets(firstSongId);
        setOfflineAssets(assets);
        activeThumbSrc = assets.thumbnailUrl;
      } catch (e) {
        console.error("Failed to load offline preview thumbnail", e);
      } finally {
        setMounted(true);
      }
    };

    loadMediaContext();

    return () => {
      if (activeThumbSrc) revokeBlobUrls(null, activeThumbSrc);
    };
  }, [firstSongId, hasCustomIcon]);

  const handlePlaylistReorder = (newSongs: Array<string | any>) => {
    const standardIds = newSongs.map((song) =>
      typeof song === "string" ? song : song.id
    );
    saveList(playlistKey, standardIds);
  };

  if (!mounted) return (
    <div>

    </div>
  )

  return (
    <div className="h-full max-h-full bg-background text-foreground flex flex-col relative">
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl m-auto p-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border">
            {hasCustomIcon && customIcon ? (
              customIcon
            ) : thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={displayName}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <Music className="size-16 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {displayName}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {songCountText}
            </p>
            {totalSongs > 0 ? (
              <div className="pt-2 flex gap-2">
                <Button
                  className="rounded-full gap-2" size="lg"
                  onClick={() => {
                    initializeQueue(null, true, playlistKey, true);
                  }}
                >
                  <Play className="size-5 fill-current stroke-none" /> Play
                </Button>
                <Button
                  className="rounded-full gap-2" size="lg" variant="secondary"
                  onClick={() => {
                    initializeQueue(null, true, playlistKey, true, true);
                  }}
                >
                  <Shuffle className="size-5" /> Shuffle
                </Button>
                <DialogButton
                  className="rounded-full gap-2" size="lg" variant="secondary"
                  dialogTitle={`Rename Playlist "${displayName}"`}
                  confirmText="Rename"
                  fields={[
                    {
                      id: "newName",
                      label: "New Name",
                      type: "text",
                      defaultValue: displayName
                    }
                  ]}
                  onConfirm={(formValues) => {
                    const key = createPlaylistKey(formValues.newName);

                    if (key === playlistKey) {
                      return;
                    }

                    if (getSongsList(key).length > 0) {
                      setTimeout(() => {
                        window.alert(`A playlist with the key "${key}" already exists. Please choose a different name.`);
                      }, 0);
                      return;
                    }

                    const songs = getSongsList(playlistKey);

                    deleteList(playlistKey);
                    saveList(key, songs);

                    router.push(`/playlist?id=${encodeURIComponent(key)}`);
                  }}
                >
                  <TextCursor className="size-4" /> Rename
                </DialogButton>
                {!["downloaded_songs", "current_playlist"].includes(playlistKey) && (
                  <DialogButton
                    className="rounded-full gap-2" size="lg"
                    variant="destructive"
                    onConfirm={() => {
                      deleteList(playlistKey);
                      if (playlistKey === contextPlaylistKey) {
                        setContextPlaylistKey(null);
                      }
                    }}
                    dialogDescription={`Are you sure you want to delete playlist "${displayName}"?`}
                    confirmText="Delete"
                  >
                    <Trash className="size-5" /> Delete Playlist
                  </DialogButton>
                )}
              </div>
            ) : (
              <div className="min-h-8"></div>
            )}
          </div>
        </div>

        <Separator orientation="horizontal" />

        <div className="w-full max-w-6xl m-auto">
          {totalSongs === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Music className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-medium">This playlist is empty</p>
            </div>
          ) : (
            <SongPlaylist
              songs={songIds}
              enableReorder={true}
              onReorder={handlePlaylistReorder}
              getMenu={(song) => {
                if (["current_playlist", "downloaded_songs"].includes(playlistKey)) {
                  return null;
                }

                return [
                  {
                    fields: [
                      {
                        label: "Remove from Playlist",
                        onClick: () => {
                          if (!song) return;
                          removeSong(playlistKey, song.id);
                        },
                      },
                    ],
                  },
                ];
              }}
            />
          )}
        </div>
      </div>

      <Separator orientation="horizontal" />
      <CurrentlyPlaying />
    </div>
  );
}
