'use client';

import { SongData } from '@/app/api/actions';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface AudioState {
  currentTrack: SongData | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  ended?: boolean;
}

interface AudioContextType {
  state: AudioState;
  loadSong: (src: string, songData: SongData) => void;
  playSong: (src: string, songData: SongData) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (level: number) => void;
  subscribe: (callback: (state: AudioState) => void) => () => void;
  setNextHandler: (handler: (() => void) | null) => void;
  setPrevHandler: (handler: (() => void) | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef<Set<(state: AudioState) => void>>(new Set());

  const nextTrackHandlerRef = useRef<(() => void) | null>(null);
  const prevTrackHandlerRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<AudioState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
  });

  const emitChange = (updates: Partial<AudioState> = {}) => {
    setState((prev) => ({ ...prev, ended: false, ...updates }));
  };

  useEffect(() => {
    if (state.ended) {
      console.log("Song ended: ", state);
      console.log("Listeners count:", listenersRef.current.size);
    }

    listenersRef.current.forEach((callback) => callback(state));
  }, [state]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.onplay = () => emitChange({ isPlaying: true });
    audio.onpause = () => emitChange({ isPlaying: false });
    audio.onvolumechange = () => emitChange({ volume: audio.volume });
    audio.onloadedmetadata = () => emitChange({ duration: audio.duration });
    audio.ontimeupdate = () => emitChange({ currentTime: audio.currentTime });
    audio.onended = () => emitChange({ isPlaying: false, currentTime: 0, ended: true });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !audioRef.current) return;

    const audio = audioRef.current;

    navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';

    if (state.currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.currentTrack.title,
        artist: state.currentTrack.artistName,
      });
    }

    if (state.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: audio.playbackRate || 1.0,
        position: state.currentTime
      });
    }

    navigator.mediaSession.setActionHandler('play', () => audio.play().catch(() => { }));
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seek(details.seekTime);
    });

    navigator.mediaSession.setActionHandler('nexttrack', nextTrackHandlerRef.current ? () => nextTrackHandlerRef.current?.() : null);
    navigator.mediaSession.setActionHandler('previoustrack', prevTrackHandlerRef.current ? () => prevTrackHandlerRef.current?.() : null);

  }, [state.currentTrack, state.isPlaying, state.currentTime, state.duration]);

  const setNextHandler = (handler: (() => void) | null) => { nextTrackHandlerRef.current = handler; };
  const setPrevHandler = (handler: (() => void) | null) => { prevTrackHandlerRef.current = handler; };

  const loadSong = (src: string, songData: SongData) => {
    if (!audioRef.current || !src) return;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
      emitChange({ currentTrack: songData, currentTime: 0, duration: 0 });
    }
  };

  const playSong = (src: string, songData: SongData) => {
    if (!audioRef.current) return;
    if (audioRef.current.src !== src && src) {
      audioRef.current.src = src;
    }
    emitChange({ currentTrack: songData, isPlaying: true });
    audioRef.current.play().catch((err) => console.warn("Playback blocked:", err));
  };

  const pause = () => {
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
    <AudioContext.Provider value={{ state, loadSong, playSong, pause, togglePlay, seek, setVolume, subscribe, setNextHandler, setPrevHandler }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be executed inside a valid AudioProvider hierarchy.');
  return context;
};
