'use client';

import { SongData } from '@/app/api/actions';
import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';

export interface AudioState {
  currentSong: SongData | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  ended?: boolean;
  error: MediaError | null;
}

interface AudioControls {
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

const AudioStateContext = createContext<AudioState | undefined>(undefined);
const AudioControlsContext = createContext<AudioControls | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef<Set<(state: AudioState) => void>>(new Set());
  const nextTrackHandlerRef = useRef<(() => void) | null>(null);
  const prevTrackHandlerRef = useRef<(() => void) | null>(null);

  const [state, setState] = useState<AudioState>({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,
  });

  const emitChange = useCallback((updates: Partial<AudioState> = {}) => {
    setState((prev) => ({ ...prev, ended: false, ...updates }));
  }, []);

  useEffect(() => {
    listenersRef.current.forEach((callback) => callback(state));
  }, [state]);

  useEffect(() => {
    const audio = new Audio();
    audio.style.display = "none";
    document.body.appendChild(audio);
    audioRef.current = audio;

    audio.onplay = () => emitChange({ isPlaying: true });
    audio.onpause = () => emitChange({ isPlaying: false });
    audio.onvolumechange = () => emitChange({ volume: audio.volume });
    audio.onloadedmetadata = () => emitChange({ duration: audio.duration });
    audio.ontimeupdate = () => emitChange({ currentTime: audio.currentTime });
    audio.onended = () => emitChange({ isPlaying: false, currentTime: 0, ended: true });
    audio.onerror = () => {
      console.error("Audio playback error:", audio.error);
      emitChange({ isPlaying: false, currentTime: 0, error: audio.error });
    };

    return () => {
      audio.pause();
      audio.remove();
      audioRef.current = null;
    };
  }, [emitChange]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !state.currentSong) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentSong.title,
      artist: state.currentSong.artistName,
    });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play().catch(() => { }));
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekto', (d) => { if (d.seekTime !== undefined) seek(d.seekTime); });
    navigator.mediaSession.setActionHandler('nexttrack', nextTrackHandlerRef.current ? () => nextTrackHandlerRef.current?.() : null);
    navigator.mediaSession.setActionHandler('previoustrack', prevTrackHandlerRef.current ? () => prevTrackHandlerRef.current?.() : null);
    navigator.mediaSession.setActionHandler('stop', () => { audioRef.current?.pause(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSong]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
  }, [state.isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !audioRef.current || state.duration <= 0) return;
    const id = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      const { duration, currentTime, playbackRate } = audio;
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (!Number.isFinite(currentTime)) return;
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: Number.isFinite(playbackRate) && playbackRate > 0 ? playbackRate : 1,
        position: Math.min(currentTime, duration),
      });
    }, 500);
    return () => clearInterval(id);
  }, [state.duration]);

  const setNextHandler = useCallback((handler: (() => void) | null) => { nextTrackHandlerRef.current = handler; }, []);
  const setPrevHandler = useCallback((handler: (() => void) | null) => { prevTrackHandlerRef.current = handler; }, []);

  const loadSong = useCallback((src: string, songData: SongData) => {
    if (!audioRef.current || !src) return;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
      emitChange({ currentSong: songData, currentTime: 0, duration: 0, error: null });
    }
  }, [emitChange]);

  const playSong = useCallback((src: string, songData: SongData) => {
    if (!audioRef.current) return;
    if (audioRef.current.src !== src && src) {
      audioRef.current.src = src;
    }
    emitChange({ currentSong: songData, isPlaying: true, error: null });
    audioRef.current.play().catch((err) => console.warn("Playback blocked:", err));
  }, [emitChange]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioRef.current.src) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    emitChange({ currentTime: seconds });
  }, [emitChange]);

  const setVolume = useCallback((level: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, level));
    audioRef.current.volume = clamped;
    emitChange({ volume: clamped });
  }, [emitChange]);

  const subscribe = useCallback((callback: (state: AudioState) => void) => {
    listenersRef.current.add(callback);
    return () => { listenersRef.current.delete(callback); };
  }, []);

  const controls = useMemo<AudioControls>(() => ({
    loadSong, playSong, pause, togglePlay, seek, setVolume, subscribe, setNextHandler, setPrevHandler,
  }), [loadSong, playSong, pause, togglePlay, seek, setVolume, subscribe, setNextHandler, setPrevHandler]);

  return (
    <AudioControlsContext.Provider value={controls}>
      <AudioStateContext.Provider value={state}>
        {children}
      </AudioStateContext.Provider>
    </AudioControlsContext.Provider>
  );
};

export const useAudio = () => {
  const state = useContext(AudioStateContext);
  const controls = useContext(AudioControlsContext);
  if (!state || !controls) throw new Error('useAudio must be executed inside a valid AudioProvider hierarchy.');
  return { state, ...controls };
};

export const useAudioControls = () => {
  const controls = useContext(AudioControlsContext);
  if (!controls) throw new Error('useAudioControls must be executed inside a valid AudioProvider hierarchy.');
  return controls;
};
