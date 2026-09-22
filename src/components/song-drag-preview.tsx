import { SongData } from "@/app/api/actions";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./ui/item";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";

interface SongDragPreviewProps {
  song: SongData;
}

export function SongDragPreview({ song }: SongDragPreviewProps) {
  const duration = song.duration ? formatDuration(song.duration) : null;

  return (
    <Item className="h-16 p-0 pr-3 border border-accent-foreground rounded-none overflow-hidden bg-background shadow-xl scale-[1.02]">
      <ItemMedia className="h-full translate-0! p-1.5">
        <div className="aspect-square relative h-full">
          <Image
            src={song.thumbnailUrl}
            alt={song.title}
            fill
            sizes="50px"
            className="object-cover"
          />
        </div>
      </ItemMedia>
      <ItemContent className="text-nowrap overflow-hidden">
        <ItemTitle className="text-[14px] font-medium">{song.title}</ItemTitle>
        <ItemDescription className="flex gap-2">
          <span className="text-muted-foreground font-medium">{song.artistName}</span>
        </ItemDescription>
      </ItemContent>
      {duration && (
        <span className="text-muted-foreground text-[14px] pr-1">{duration}</span>
      )}
    </Item>
  );
}
