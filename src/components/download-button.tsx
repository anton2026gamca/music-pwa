'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Check, Download, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  videoId: string;
  onStatusChange?: (saved: boolean) => void;
}

export default function DownloadButton({ videoId, onStatusChange }: DownloadButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const CACHE_NAME = 'hobby-app-video-cache';
  const requestUrl = `/api/download?id=${videoId}`;

  useEffect(() => {
    async function checkCache() {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const matched = await cache.match(requestUrl);
        setIsSaved(!!matched);
      }
    }
    checkCache();
  }, [videoId]);

  const toggleOfflineSave = async () => {
    if (!('caches' in window)) return alert('Your browser does not support Cache storage!');

    setLoading(true);
    const cache = await caches.open(CACHE_NAME);

    if (isSaved) {
      await cache.delete(requestUrl);
      setIsSaved(false);
      if (onStatusChange) onStatusChange(false);
    } else {
      try {
        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error('Download failed');

        await cache.put(requestUrl, response);
        setIsSaved(true);
        if (onStatusChange) onStatusChange(true);
      } catch (err) {
        console.error('Failed caching video:', err);
        alert('Could not download video.');
      }
    }
    setLoading(false);
  };

  return (
    <Button
      onClick={toggleOfflineSave}
      disabled={loading}
      size="sm"
      // Swaps the look dynamically based on whether it is already saved
      variant={isSaved ? "secondary" : "default"}
      className="w-full mt-2"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Downloading Chunks...
        </>
      ) : isSaved ? (
        <>
          <Check className="mr-2 h-3 w-3" />
          Saved Offline
        </>
      ) : (
        <>
          <Download className="mr-2 h-3 w-3" />
          Save Offline
        </>
      )}
    </Button>
  );
}
