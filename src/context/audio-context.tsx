'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface AudioState {
  currentTrack: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface AudioContextType {
  state: AudioState;
  loadTrack: (src: string, songId: string) => void;
  playTrack: (src: string, songId: string) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  subscribe: (callback: (state: AudioState) => void) => () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef<Set<(state: AudioState) => void>>(new Set());

  const [state, setState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  const emitChange = (updates: Partial<AudioState> = {}) => {
    setState((prev) => {
      const nextState = { ...prev, ...updates };
      setTimeout(() => {
        listenersRef.current.forEach((callback) => callback(nextState));
      }, 0);
      return nextState;
    });
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.onplay = () => emitChange({ isPlaying: true });
    audio.onpause = () => emitChange({ isPlaying: false });
    audio.onvolumechange = () => emitChange({ volume: audio.volume });
    audio.onloadedmetadata = () => emitChange({ duration: audio.duration });
    audio.ontimeupdate = () => emitChange({ currentTime: audio.currentTime });
    audio.onended = () => emitChange({ isPlaying: false, currentTime: 0 });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const loadTrack = (src: string, songId: string) => {
    if (!audioRef.current || !src) return;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
      emitChange({ currentTrack: songId, currentTime: 0, duration: 0 });
    }
  };

  const playTrack = (src: string, songId: string) => {
    if (!audioRef.current) return;
    if (audioRef.current.src !== src && src) {
      audioRef.current.src = src;
    }
    emitChange({ currentTrack: songId, isPlaying: true });
    audioRef.current.play().catch((err) => console.warn("Playback blocked:", err));
  };

  const pauseTrack = () => {
    audioRef.current?.pause();
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    emitChange({ currentTime: seconds });
  };

  const setVolume = (level: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, level));
    audioRef.current.volume = clamped;
    emitChange({ volume: clamped });
  };

  const subscribe = (callback: (state: AudioState) => void) => {
    listenersRef.current.add(callback);

    const timeoutId = setTimeout(() => {
      if (listenersRef.current.has(callback)) {
        callback(state);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      listenersRef.current.delete(callback);
    };
  };

  return (
    <AudioContext.Provider value={{ state, loadTrack, playTrack, pauseTrack, togglePlay, seek, setVolume, subscribe }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be executed inside a valid AudioProvider hierarchy.');
  return context;
};
