'use client';

import { SongData } from '@/app/api/actions';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudio, AudioState } from '@/context/audio-context';
import { formatDuration } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SongControlsProps {
  src?: string | null;
  song?: SongData | null;
  className?: string;
}

export function SongControls({ src = null, song = null, className = '' }: SongControlsProps) {
  const { state, loadSong: loadTrack, playSong: playTrack, togglePlay, seek, setVolume, subscribe } = useAudio();

  const [localTime, setLocalTime] = useState(0);
  const isUserScrubbing = useRef(false);

  const songData = song;

  const currentTrack = state.currentTrack;
  const isCurrent = src && songData ? currentTrack?.id === songData.id : !!currentTrack;

  useEffect(() => {
    if (src && songData && !state.currentTrack) {
      loadTrack(src, songData);
    }
  }, [src, songData, currentTrack, loadTrack]);

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

  const handlePlayPause = () => {
    if (src && songData && state.currentTrack?.id !== src) {
      playTrack(src, songData);
    } else {
      togglePlay();
    }
  };

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
    <div className={`flex items-center gap-3 w-full h-10 px-3 bg-[#1a1a1a]/95 text-[#f9f9fb] antialiased select-none ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={handlePlayPause}
        className="w-7 h-7 text-[#f9f9fb] hover:bg-[#2b2a33] hover:text-[#f9f9fb] active:bg-[#3b3a45] rounded-full shrink-0 p-0"
      >
        {isCurrent && state.isPlaying ? (
          <Pause className="w-4 h-4 fill-current stroke-none" />
        ) : (
          <Play className="w-4 h-4 fill-current stroke-none translate-x-px" />
        )}
      </Button>

      <div className="flex items-center gap-1 text-[13px] text-[#f9f9fb] font-normal tracking-wide shrink-0">
        <span className="min-w-7 text-right">{isCurrent ? formatDuration(localTime) : '0:00'}</span>
        <span className="text-[#a4a4a4]">/</span>
        <span className="min-w-7">{isCurrent ? formatDuration(state.duration) : formatDuration(song?.duration)}</span>
      </div>

      <Slider
        min={0}
        max={isCurrent ? state.duration || 100 : 100}
        value={isCurrent ? localTime : 0}
        disabled={!isCurrent && !!src}
        onValueCommitted={handleTimelineCommit}
        onValueChange={handleTimelineChange}
        className="flex-1 cursor-pointer py-3"
      />

      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => setVolume(state.volume === 0 ? 0.7 : 0)}
        className="w-7 h-7 text-[#f9f9fb] hover:bg-[#2b2a33] hover:text-[#f9f9fb] active:bg-[#3b3a45] rounded-full shrink-0 p-0"
      >
        {state.volume === 0 ? <VolumeX className="w-4.5 h-4.5" /> : <Volume2 className="w-4.5 h-4.5" />}
      </Button>

      <Slider
        min={0}
        max={1}
        step={0.05}
        value={state.volume}
        onValueChange={(val) => setVolume(extractValue(val))}
        className="w-16! md:w-20! cursor-pointer py-3 shrink-0"
      />
    </div>
  );
}
