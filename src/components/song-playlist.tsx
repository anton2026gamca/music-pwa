import { SongData } from "@/app/api/actions";
import { SongItem } from "./song-item";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useFetchSongsData } from "@/hooks/use-fetch-song-data";

interface SongPlaylistProps {
  title?: string;
  songs: Array<string | SongData> | null;
  enableReorder?: boolean;
  onReorder?: (newSongs: Array<string | SongData>) => void;
  onClickOverrides?: Array<(() => void) | null> | null;
  iconOverrides?: Array<React.JSX.Element | null> | null;
}

export function SongPlaylist({ title, songs: mixedSongs, enableReorder = false, onReorder, onClickOverrides, iconOverrides }: SongPlaylistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { state: audioState } = useAudio();

  const [localSongs, setLocalSongs] = useState<Array<string | SongData>>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragEndResetTimeout, setDragEndResetTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mixedSongs) {
      setLocalSongs(mixedSongs);
      if (dragEndResetTimeout) {
        clearTimeout(dragEndResetTimeout);
        setDragEndResetTimeout(null);
      }
    }
  }, [mixedSongs, enableReorder]);

  const songIdsToFetch = (localSongs ?? [])
    .filter((song) => typeof song === 'string');

  const { songs: fetchedSongs } = useFetchSongsData(songIdsToFetch);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === hoverIndex) return;

    const updatedSongs = [...localSongs];
    const [draggedItem] = updatedSongs.splice(draggedIndex, 1);
    updatedSongs.splice(hoverIndex, 0, draggedItem);

    setDraggedIndex(hoverIndex);
    setLocalSongs(updatedSongs);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (onReorder) {
      onReorder(localSongs);
    }
    setDragEndResetTimeout(setTimeout(() => {
      if (mixedSongs) setLocalSongs(mixedSongs);
      setDragEndResetTimeout(null);
    }, 1000));
  };

  return (
    <div className="w-full">
      {title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex justify-between items-center w-full px-3 py-2 text-sm font-semibold uppercase hover:bg-neutral-100 dark:hover:bg-neutral-900 border-b border-border"
        >
          <span>{title}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          )}
        </button>
      )}

      {isOpen && (
        <div>
          {localSongs.map((raw, i) => {
            const song = typeof raw === 'string'
              ? (fetchedSongs.find((f) => f.id === raw) ?? null)
              : raw;

            const isPlaying = song?.id === audioState.currentTrack;
            const progress = isPlaying ? (audioState.currentTime / audioState.duration) * 100 : undefined;

            if (!enableReorder) {
              return (
                <SongItem
                  key={song?.id ?? i}
                  song={song}
                  progress={progress}
                  isActive={!!progress}
                  onClickOverride={onClickOverrides?.[i] ?? undefined}
                  iconOverride={iconOverrides?.[i] ?? undefined}
                />
              )
            }

            return (
              <div
                key={song?.id ?? i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`flex items-center group cursor-grab active:cursor-grabbing transition-opacity ${draggedIndex === i ? "opacity-40" : "opacity-100"
                  }`}
              >
                <div className="px-3 lg:px-1 text-neutral-400 lg:hidden lg:group-hover:block">
                  <GripVertical className="size-5 lg:size-4" />
                </div>

                <div className="flex-1 overflow-auto">
                  <SongItem
                    song={song}
                    progress={progress}
                    isActive={!!progress}
                    onClickOverride={onClickOverrides?.[i] ?? undefined}
                    iconOverride={iconOverrides?.[i] ?? undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
