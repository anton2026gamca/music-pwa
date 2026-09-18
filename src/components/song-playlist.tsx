import { SongData } from "@/app/api/actions";
import { SongItem } from "./song-item";
import { useDownloadedSongs } from "@/hooks/use-downloaded-songs";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";


interface SongPlaylistProps {
  title: string;
  songs: Array<string | SongData>;
}

export function SongPlaylist({ title, songs }: SongPlaylistProps) {
  const { getDownloadedSong } = useDownloadedSongs();
  const [isOpen, setIsOpen] = useState(true);

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
          {songs.map((raw) => {
            const song = typeof raw === 'string' ? getDownloadedSong(raw) : raw;
            if (!song) return null;

            return (
              <SongItem song={song} key={song.id} />
            );
          })}
        </div>
      )}
    </div>
  );
}
