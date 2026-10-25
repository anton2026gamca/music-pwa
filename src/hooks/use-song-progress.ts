import { useEffect, useState } from "react";
import { useAudioControls, type AudioState } from "@/context/audio-context";

interface SongProgress {
  isActive: boolean;
  progress: number | undefined;
}

const INACTIVE: SongProgress = { isActive: false, progress: undefined };

export function useSongProgress(songId: string | null | undefined): SongProgress {
  const { subscribe } = useAudioControls();
  const [progress, setProgress] = useState<SongProgress>(INACTIVE);

  useEffect(() => {
    return subscribe((state: AudioState) => {
      const isActive = !!songId && state.currentSong?.id === songId;
      const next: SongProgress = isActive && state.duration > 0
        ? { isActive: true, progress: (state.currentTime / state.duration) * 100 }
        : INACTIVE;

      setProgress((prev) =>
        prev.isActive === next.isActive && prev.progress === next.progress ? prev : next
      );
    });
  }, [songId, subscribe]);

  return progress;
}
