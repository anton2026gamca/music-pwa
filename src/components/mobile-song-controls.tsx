'use client';

import { SongData } from '@/app/api/actions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio, AudioState } from '@/context/audio-context';
import { cn, formatDuration } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MobileSongControlsProps {
  src?: string | null;
  song?: SongData | null;
  className?: string;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

export function MobileSongControls({
  src = null,
  song = null,
  className = '',
  handlePlayPause,
  handleNext,
  handlePrevious
}: MobileSongControlsProps) {
  const { state, loadSong, seek, subscribe } = useAudio();

  const [localTime, setLocalTime] = useState(0);
  const isUserScrubbing = useRef(false);

  const songData = song;
  const currentTrack = state.currentTrack;
  const isCurrent = src && songData ? currentTrack?.id === songData.id : !!currentTrack;

  useEffect(() => {
    if (src && songData && !state.currentTrack) {
      loadSong(src, songData);
    }
  }, [src, songData, currentTrack, loadSong]);

  useEffect(() => {
    const unsubscribe = subscribe((globalState: AudioState) => {
      if (isCurrent && !isUserScrubbing.current) {
        setLocalTime(globalState.currentTime);
      } else if (!isCurrent) {
        setLocalTime(0);
      }
    });
    return () => unsubscribe();
  }, [subscribe, isCurrent]);

  const extractValue = (val: number | readonly number[]): number => {
    if (Array.isArray(val)) return val[0] || 0;
    return val as number;
  };

  const handleTimelineCommit = (value: number | readonly number[]) => {
    isUserScrubbing.current = false;
    const targetVal = extractValue(value);
    setLocalTime(targetVal);
    if (isCurrent) seek(targetVal);
  };

  const handleTimelineChange = (value: number | readonly number[]) => {
    isUserScrubbing.current = true;
    setLocalTime(extractValue(value));
  };

  return (
    <div className={cn("flex flex-col w-full px-6 py-4 text-white select-none", className)}>
      <div className="w-full mb-2">
        <Slider
          min={0}
          max={isCurrent ? state.duration || 100 : 100}
          value={isCurrent ? localTime : 0}
          disabled={!isCurrent && !!src}
          onValueCommitted={handleTimelineCommit}
          onValueChange={handleTimelineChange}
          className="w-full cursor-pointer touch-none"
        />
      </div>

      <div className="flex justify-between items-center w-full text-xs text-[#aaa] font-medium tracking-wider mb-4">
        <span>{isCurrent ? formatDuration(localTime) : '0:00'}</span>
        <span>{isCurrent ? formatDuration(state.duration) : formatDuration(song?.duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-8 w-full">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handlePrevious}
          className="size-12 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
        >
          <SkipBack className="size-6 fill-current stroke-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handlePlayPause}
          className="size-16 bg-white text-black hover:bg-white/90 active:scale-95 rounded-full shadow-lg transition-all flex items-center justify-center"
        >
          {isCurrent && state.isPlaying ? (
            <Pause className="size-7 fill-current stroke-none" />
          ) : (
            <Play className="size-7 fill-current stroke-none translate-x-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handleNext}
          className="size-12 text-white hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
        >
          <SkipForward className="size-6 fill-current stroke-3" />
        </Button>
      </div>
    </div>
  );
}
