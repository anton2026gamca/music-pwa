'use client';

import { SongData } from '@/app/api/actions';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '../ui/item';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDuration } from '@/lib/utils';
import { memo, useEffect, useState } from 'react';
import { getOfflineAssets, OfflineAssets, revokeBlobUrls } from '@/lib/download-utils';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';
import { useSearchParamsHelpers } from '@/hooks/use-search-params-helpers';
import { ThreeDotMenu } from '../ui/three-dot-menu';

interface SongItemProps {
  song: SongData | null;
  progress?: number | null;
  isActive?: boolean | null;
  onClickOverride?: () => void;
  iconOverride?: React.JSX.Element;
  menu?: Array<{
    label?: string;
    fields: Array<{
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }>
  }>
}

function SongItemImpl({ song, progress = null, isActive = null, onClickOverride, iconOverride, menu }: SongItemProps) {
  if (song === null) return (
    <Item className="h-16 p-0 pr-3 border border-b-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative">
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Skeleton className="w-full h-full" />
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden">
        <ItemTitle className="text-[14px] font-medium group-hover:underline">
          <Skeleton className="w-32 h-4 my-1" />
        </ItemTitle>
        <ItemDescription className="flex gap-2">
          <Skeleton className="w-32 h-3 my-1" />
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Skeleton />
      </ItemActions>
    </Item>
  )

  const pathname = usePathname();
  const { getUpdatedSearchParams } = useSearchParamsHelpers();

  const [mounted, setMounted] = useState(false);

  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);

  const songId = song.id;
  const title = song.title;
  const artistName = song.artistName;
  const duration = song.duration ? formatDuration(song.duration) : null;
  const thumbnailUrl = offlineAssets?.thumbnailUrl ?? song.thumbnailUrl;

  useEffect(() => {
    if (!song?.id) return;

    let activeSongSrc: string | null = null;
    let activeThumbSrc: string | null = null;

    const loadMediaContext = async () => {
      const assets = await getOfflineAssets(song.id);

      setOfflineAssets(assets);

      activeSongSrc = assets.songUrl;
      activeThumbSrc = assets.thumbnailUrl;

      setMounted(true);
    };

    loadMediaContext();

    return () => {
      revokeBlobUrls(activeSongSrc, activeThumbSrc);
    };
  }, [song?.id]);

  const href = pathname === "/watch" ? `?${getUpdatedSearchParams("id", songId)}` : `/watch?id=${songId}`;

  if (!mounted) return (
    <Item className="h-16 p-0 pr-3 border border-b-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative">
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Skeleton className="w-full h-full rounded-none" />
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
      <Link href={href} className="absolute inset-0 z-10 opacity-0">
        Play
      </Link>
    </Item>
  )

  return (
    <Item className={`h-16 p-0 pr-3 ${isActive ? "border border-accent-foreground" : "border-b-border"} rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative`}
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
            sizes="50px"
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
        <span className="hidden group-hover:block">
          {iconOverride ? iconOverride : <ArrowRight />}
        </span>
        {menu && <ThreeDotMenu groups={menu} className="z-20 hover:bg-input!" />}
      </ItemActions>
      <Link
        href={href}
        className="absolute inset-0 z-10 opacity-0"
        onClick={(e) => {
          if (onClickOverride) {
            e.preventDefault()
            onClickOverride();
          }
        }}
      >
        Play
      </Link>
    </Item>
  );
}

export const SongItem = memo(SongItemImpl);
