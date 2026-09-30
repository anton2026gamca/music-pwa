"use client";

import { SongData } from "@/app/api/actions";
import { SongItem } from "../song/song-item";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useFetchSongsData } from "@/hooks/use-fetch-song-data";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { SortableSongItem } from "../song/sortable-song-item";
import { SongDragPreview } from "../song/song-drag-preview";

interface SongPlaylistProps {
  title?: string;
  songs: Array<string | SongData> | null;
  enableReorder?: boolean;
  onReorder?: (newSongs: Array<string | SongData>) => void;
  onClickOverrides?: Array<(() => void) | null> | null;
  iconOverrides?: Array<React.JSX.Element | null> | null;
  buttons?: React.ReactNode;
}

function getSongKey(song: string | SongData, index: number) {
  return typeof song === "string" ? song : song.id ?? `idx-${index}`;
}

export function SongPlaylist({
  title,
  songs: mixedSongs,
  enableReorder = false,
  onReorder,
  onClickOverrides,
  iconOverrides,
  buttons,
}: SongPlaylistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { state: audioState } = useAudio();

  const [localSongs, setLocalSongs] = useState<Array<string | SongData>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (mixedSongs) setLocalSongs(mixedSongs);
  }, [mixedSongs]);

  const songIdsToFetch = useMemo(
    () => (localSongs ?? []).filter((song): song is string => typeof song === "string"),
    [localSongs]
  );

  const { songs: fetchedSongs } = useFetchSongsData(songIdsToFetch);

  const resolvedSongs = useMemo(
    () =>
      localSongs.map((raw) =>
        typeof raw === "string" ? fetchedSongs.find((f) => f.id === raw) ?? null : raw
      ),
    [localSongs, fetchedSongs]
  );

  const itemIds = useMemo(
    () => localSongs.map((song, i) => getSongKey(song, i)),
    [localSongs]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(localSongs, oldIndex, newIndex);
      setLocalSongs(reordered);
      onReorder?.(reordered);
    },
    [itemIds, localSongs, onReorder]
  );

  const activeIndex = activeId ? itemIds.indexOf(activeId) : -1;
  const activeSong = activeIndex !== -1 ? resolvedSongs[activeIndex] : null;

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center w-full hover:bg-neutral-100 dark:hover:bg-neutral-900 border-b border-border">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="flex justify-between items-center flex-1 px-3 py-2 text-sm font-semibold uppercase"
          >
            <span>{title}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>

          {buttons && (
            <div className="flex items-center gap-1 pr-3" onClick={(e) => e.stopPropagation()}>
              {buttons}
            </div>
          )}
        </div>
      )}

      {isOpen && !enableReorder && (
        <div>
          {resolvedSongs.map((song, i) => {
            const isPlaying = song?.id === audioState.currentSong?.id;
            const progress = isPlaying
              ? (audioState.currentTime / audioState.duration) * 100
              : undefined;
            return (
              <SongItem
                key={song?.id ?? i}
                song={song}
                progress={progress}
                isActive={!!progress}
                onClickOverride={onClickOverrides?.[i] ?? undefined}
                iconOverride={iconOverrides?.[i] ?? undefined}
              />
            );
          })}
        </div>
      )}

      {isOpen && enableReorder && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div>
              {resolvedSongs.map((song, i) => {
                const id = itemIds[i];
                const isPlaying = song?.id === audioState.currentSong?.id;
                const progress = isPlaying
                  ? (audioState.currentTime / audioState.duration) * 100
                  : undefined;
                return (
                  <SortableSongItem
                    key={id}
                    id={id}
                    song={song}
                    progress={progress}
                    isActive={!!progress}
                    onClickOverride={onClickOverrides?.[i] ?? undefined}
                    iconOverride={iconOverrides?.[i] ?? undefined}
                  />
                );
              })}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
            {activeSong ? <SongDragPreview song={activeSong} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
