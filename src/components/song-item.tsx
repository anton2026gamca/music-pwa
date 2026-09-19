'use client';

import { SongData } from '@/app/api/actions';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from './ui/item';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDuration } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { getOfflineAssets, OfflineAssets, revokeBlobUrls } from '@/app/watch/_lib/download-utils';
import { Skeleton } from './ui/skeleton';

interface SongItemProps {
  song: SongData;
  progress?: number | null;
}

export function SongItem({ song, progress = null }: SongItemProps) {
  const [mounted, setMounted] = useState(false);

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);

  const songId = song.id;
  const title = song.title;
  const artistName = song.artistName;
  const duration = song.duration ? formatDuration(song.duration) : null;
  const thumbnailUrl = offlineAssets?.thumbnailUrl ?? song.thumbnailUrl;

  useEffect(() => {
    if (!song?.id) return;

    let activeVideoSrc: string | null = null;
    let activeThumbSrc: string | null = null;

    const loadMediaContext = async () => {
      const assets = await getOfflineAssets(song.id);

      setOfflineAssets(assets);

      activeVideoSrc = assets.videoUrl;
      activeThumbSrc = assets.thumbnailUrl;

      setMounted(true);
    };

    loadMediaContext();

    return () => {
      revokeBlobUrls(activeVideoSrc, activeThumbSrc);
    };
  }, [song?.id]);

  if (!mounted) return (
    <Item className="h-16 p-0 pr-3 border border-b-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative">
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Skeleton />
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden">
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
      <Link href={`/watch?id=${songId}`} className="absolute inset-0 z-10 opacity-0">
        Play
      </Link>
    </Item>
  )

  return (
    <Item className="h-16 p-0 pr-3 border border-b-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative"
      style={{
        background: progress !== null ? `linear-gradient(to right, var(--border) ${progress}%, var(--background) ${progress}%)` : undefined,
      }}
    >
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden">
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
      <Link href={`/watch?id=${songId}`} className="absolute inset-0 z-10 opacity-0">
        Play
      </Link>
    </Item>
  );
}
