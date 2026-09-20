import { SongData } from "@/app/api/actions";
import { SongItem } from "./song-item";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCachedSongs } from "@/hooks/use-cached-songs";
import { useDownloadedSongs } from "@/hooks/use-downloaded-songs";
import { useAudio } from "@/context/audio-context";


interface SongPlaylistProps {
  title: string;
  songs: Array<string | SongData> | null;
}

export function SongPlaylist({ title, songs }: SongPlaylistProps) {
  const { getSongData: getDownloadedSongData } = useDownloadedSongs();
  const { getSongData: getCachedSongData } = useCachedSongs();
  const [isOpen, setIsOpen] = useState(true);

  const { state: audioState } = useAudio();

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
          {songs && songs.map((raw, i) => {
            const song = typeof raw === 'string' ? (getDownloadedSongData(raw) ?? getCachedSongData(raw)) : raw;
            if (!song) return null;

            const isPlaying = song.id === audioState.currentTrack;
            const progress = isPlaying ? audioState.currentTime / audioState.duration * 100 : undefined;

            return (
              <SongItem song={song} key={song.id} progress={progress} />
            );
          })}
        </div>
      )}
    </div>
  );
}
