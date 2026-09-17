'use client';

import { useState, useEffect } from 'react';

import { SongData } from '@/app/api/actions';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDuration } from '@/lib/utils';

interface VideoCardProps {
  video: SongData;
}

export default function SongCard({ video: song }: VideoCardProps) {
  const videoId = song.id;
  const title = song.title;
  const artistName = song.artistName;
  const duration = song.duration ? formatDuration(song.duration) : null;
  const thumbnailUrl = song.thumbnailUrl;

  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const CACHE_NAME = 'download-cache';
  const downloadUrl = `/api/download?id=${videoId}`;

  useEffect(() => {
    async function verifyOfflineStatus() {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const matched = await cache.match(downloadUrl);
        setIsSavedOffline(!!matched);
      }
    }

    verifyOfflineStatus();

    const handleCacheUpdate = () => verifyOfflineStatus();
    window.addEventListener('cache-updated', handleCacheUpdate);
    return () => window.removeEventListener('cache-updated', handleCacheUpdate);
  }, [downloadUrl]);

  return (
    <Item className="h-17.5 border border-t-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative">
      <ItemMedia className="h-full pb-1">
        <div className="h-full aspect-square">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-[14px] font-medium group-hover:underline">
          {title}
        </ItemTitle>
        <ItemDescription className="flex gap-2">
          <span className="text-muted-foreground font-medium">{artistName}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        {duration && (<span className="text-muted-foreground text-[14px] group-hover:hidden">{duration}</span>)}
        <ArrowRight className="hidden group-hover:block" />
      </ItemActions>
      <Link href={`/watch?id=${videoId}`} className="absolute inset-0 z-10 opacity-0">
        Play
      </Link>
    </Item>
  );
}
