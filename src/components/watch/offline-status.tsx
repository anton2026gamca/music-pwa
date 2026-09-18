'use client';

import { Video, Music, Image as ImageIcon, Check, X, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { OfflineAssets } from '@/lib/watch/utils';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

interface OfflineStatusProps {
  offlineAssets: OfflineAssets;
  videoDownloading: boolean;
  lyricsDownloading: boolean;
  thumbnailDownloading: boolean;
  onDownloadClick?: () => void;
}

export function OfflineStatus({ offlineAssets, videoDownloading, lyricsDownloading, thumbnailDownloading, onDownloadClick }: OfflineStatusProps) {
  const hasVideo = offlineAssets.isOffline;
  const hasLyrics = offlineAssets.lyrics !== null && offlineAssets.lyrics.length > 0;
  const hasThumbnail = offlineAssets.thumbnailUrl !== null;
  const fileSize = offlineAssets.fileSize;

  const indicators = [
    {
      id: 'video',
      label: 'Audio/Video Track',
      status: hasVideo,
      downloading: videoDownloading,
      icon: Video,
      desc: hasVideo ? `Media saved locally (${offlineAssets.fileSize || 'Unknown size'})` : 'Media missing',
    },
    {
      id: 'lyrics',
      label: 'Synced Lyrics',
      status: hasLyrics,
      downloading: lyricsDownloading,
      icon: Music,
      desc: hasLyrics ? 'Timed lyrics synced offline' : 'Lyrics unavailable offline',
    },
    {
      id: 'thumbnail',
      label: 'Cover Artwork',
      status: hasThumbnail,
      downloading: thumbnailDownloading,
      icon: ImageIcon,
      desc: hasThumbnail ? 'Thumbnail cached for offline view' : 'Thumbnail missing',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase">
          Offline Data
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {fileSize || 'N/A'}
        </span>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        {indicators.map((item) => {
          const Icon = item.icon;
          return (
            <div className="flex justify-between items-center text-sm" key={item.id}>
              <span>{item.label}</span>
              <Badge
                variant={item.status ? "secondary" : "outline"}
                className={`text-xs
                    ${item.status
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
                    : 'text-muted-foreground'
                  }`}
              >
                <Icon className="h-3.5 w-3.5 stroke-[2.5]" />
                {item.downloading ? (
                  <>
                    <span className="ml-0.5">Downloading...</span>
                    <Loader2 className="h-3 w-3 ml-0.5 animate-spin text-primary" />
                  </>
                ) : (
                  item.status ? (
                    <>
                      <span>Available</span>
                      <Check className="h-3 w-3 ml-0.5 text-emerald-500" />
                    </>
                  ) : (
                    <>
                      <span>Not Available</span>
                      <X className="h-3 w-3 ml-0.5" />
                    </>
                  )
                )}
              </Badge>
            </div>
          );
        })}
      </div>

      {(!hasVideo || !hasLyrics || !hasThumbnail) && (
        <Button className="" onClick={onDownloadClick}>
          Download All
        </Button>
      )}
    </div>
  );
}
