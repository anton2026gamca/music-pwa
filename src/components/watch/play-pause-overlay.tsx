import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface OverlayProps {
  isPaused: boolean;
  triggerCount: number;
}

export function PlayPauseOverlay({ isPaused, triggerCount }: OverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggerCount === 0) return;

    setIsVisible(true);
    const timeout = setTimeout(() => setIsVisible(false), 500);

    return () => clearTimeout(timeout);
  }, [triggerCount]);

  return (
    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity pointer-events-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="rounded-full p-2 bg-muted text-white">
        {isPaused ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
      </div>
    </div>
  );
}
