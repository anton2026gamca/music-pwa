import { SongData } from "@/app/api/actions";
import { SongItem } from "./song-item";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAudio } from "@/context/audio-context";
import { useFetchSongsData } from "@/hooks/use-fetch-song-data";


interface SongPlaylistProps {
  title: string;
  songs: Array<string | SongData> | null;
}

export function SongPlaylist({ title, songs: mixedSongs }: SongPlaylistProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { state: audioState } = useAudio();

  const songIdsToFetch = (mixedSongs ?? [])
    .filter((song): song is string => typeof song === 'string');

  const { songs: fetchedSongs } = useFetchSongsData(songIdsToFetch);

  return (
    <div className="w-full">
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

      {isOpen && (
        <div>
          {mixedSongs && mixedSongs.map((raw, i) => {
            const song = typeof raw === 'string'
              ? (fetchedSongs.find((f) => f.id === raw) ?? null)
              : raw;

            const isPlaying = song?.id === audioState.currentTrack;
            const progress = isPlaying ? (audioState.currentTime / audioState.duration) * 100 : undefined;

            return (
              <SongItem song={song} key={i} progress={progress} />
            );
          })}
        </div>
      )}
    </div>
  );
}
