import { useAudio } from '@/context/audio-context';
import { useEffect, useState, useMemo, useRef } from 'react';

interface LyricsPlayerProps {
  lyrics: Array<{ time: number; text: string }>;
  visible?: boolean;
}

export function LyricsPlayer({ lyrics, visible }: LyricsPlayerProps) {
  const { state } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTime = state.currentTime + 0.5;

  const lyricRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  const sortedLyrics = useMemo(() => {
    return [...lyrics].sort((a, b) => a.time - b.time);
  }, [lyrics]);

  const activeIndex = useMemo(() => {
    for (let i = sortedLyrics.length - 1; i >= 0; i--) {
      if (sortedLyrics[i].time <= currentTime) {
        return i;
      }
    }
    return -1;
  }, [sortedLyrics, state.currentTime]);

  useEffect(() => {
    if (activeIndex !== -1 && lyricRefs.current[activeIndex]) {
      lyricRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 bg-linear-to-b from-black/50 to-zinc-900/50 px-8 overflow-y-auto scrollbar-none snap-y select-none backdrop-blur-xl transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="max-w-xl mx-auto flex flex-col gap-6 text-left md:text-3xl my-[25%] text-xl font-bold tracking-tight">
        {sortedLyrics.map((lyric, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <p
              key={index}
              ref={(el) => { lyricRefs.current[index] = el; }}
              className={`transition-all duration-500 origin-left transform snap-center
                ${isActive
                  ? 'text-white scale-100 opacity-100 blur-none'
                  : isPast
                    ? 'text-white/40 scale-95 opacity-50'
                    : 'text-white/60 scale-95 opacity-30'
                }`}
            >
              {lyric.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
