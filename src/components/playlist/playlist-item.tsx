'use client';

import { Item, ItemActions, ItemContent, ItemTitle, ItemMedia } from '../ui/item';
import { ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { memo, useEffect, useState } from 'react';
import { getOfflineAssets, OfflineAssets, revokeBlobUrls } from '@/lib/download-utils';
import { Skeleton } from '../ui/skeleton';
import { useSongsListContext } from '@/context/songs-list-context';
import { formatPlaylistKey, getPlaylistCustomIcon } from '@/lib/playlist-utils';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface PlaylistItemProps {
  playlistKey: string;
  isActive?: boolean | null;
  onClickOverride?: () => void;
  iconOverride?: React.JSX.Element;
  className?: string;
  songCountTextOverride?: string;
}

function PlaylistItemImpl({ playlistKey, isActive = null, onClickOverride, iconOverride, className, songCountTextOverride }: PlaylistItemProps) {
  const { getSongsList, getSongData } = useSongsListContext();

  const [mounted, setMounted] = useState(false);
  const [offlineAssets, setOfflineAssets] = useState<OfflineAssets | null>(null);

  const songIds = getSongsList(playlistKey) || [];
  const totalSongs = songIds.length;
  const songCountText = songCountTextOverride ? songCountTextOverride : totalSongs === 1 ? '1 song' : `${totalSongs} songs`;

  const firstSongId = songIds[0] || null;
  const firstSongData = firstSongId ? getSongData(firstSongId) : null;

  const thumbnailUrl = offlineAssets?.thumbnailUrl ?? firstSongData?.thumbnailUrl ?? '';
  const displayName = formatPlaylistKey(playlistKey);
  const customIcon = getPlaylistCustomIcon(playlistKey);
  const hasCustomIcon = !!customIcon;

  useEffect(() => {
    if (!firstSongId || hasCustomIcon) {
      setMounted(true);
      return;
    }

    let activeThumbSrc: string | null = null;

    const loadMediaContext = async () => {
      try {
        const assets = await getOfflineAssets(firstSongId);
        setOfflineAssets(assets);
        activeThumbSrc = assets.thumbnailUrl;
      } catch (e) {
        console.error("Failed to load offline preview thumbnail", e);
      } finally {
        setMounted(true);
      }
    };

    loadMediaContext();

    return () => {
      if (activeThumbSrc) revokeBlobUrls(null, activeThumbSrc);
    };
  }, [firstSongId, hasCustomIcon]);

  const href = `/playlist?id=${encodeURIComponent(playlistKey)}`;

  if (!mounted) return (
    <Item className={cn("h-16 p-0 pr-3 border border-b-border rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative", className)}>
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden flex flex-col justify-center">
        <ItemTitle className="text-[14px] font-medium">
          {displayName}
        </ItemTitle>
      </ItemContent>
      <ItemActions>
        <ArrowRight className="hidden group-hover:block" />
      </ItemActions>
      <Link href={href} className="absolute inset-0 z-10 opacity-0">
        View
      </Link>
    </Item>
  )

  return (
    <Item
      className={cn(`h-16 p-0 pr-3 ${isActive ? "border border-accent-foreground" : "border-b-border"} rounded-none overflow-hidden group hover:bg-card hover:cursor-pointer relative`, className)}
    >
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full bg-muted flex items-center justify-center">
          {hasCustomIcon ? (
            customIcon
          ) : thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={displayName}
              fill
              sizes="50px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
          )}
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden flex flex-col justify-center">
        <ItemTitle className="text-[14px] font-medium group-hover:underline">
          {displayName}
        </ItemTitle>
      </ItemContent>
      <ItemActions className="flex items-center gap-3">
        <span className="text-muted-foreground text-[13px] group-hover:hidden">
          {songCountText}
        </span>
        <span className="hidden group-hover:block">
          {iconOverride ? iconOverride : <ArrowRight />}
        </span>
      </ItemActions>
      {onClickOverride ? (
        <Button
          className="absolute inset-0 z-10 opacity-0"
          onClick={onClickOverride}
        >
          Action
        </Button>
      ) : (
        <Link
          href={href}
          className="absolute inset-0 z-10 opacity-0"
        >
          View
        </Link>
      )}
    </Item>
  );
}

export const PlaylistItem = memo(PlaylistItemImpl);
