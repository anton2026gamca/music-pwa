"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { SongData } from "@/app/api/actions";
import { SongItem } from "./song-item";

interface SortableSongItemProps {
  id: string;
  song: SongData;
  progress?: number;
  isActive?: boolean;
  onClickOverride?: () => void;
  iconOverride?: React.JSX.Element;
  menu?: Array<{
    label?: string;
    fields: Array<{
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }>
  }>;
}

function SortableSongItemImpl({
  id,
  song,
  progress,
  isActive,
  onClickOverride,
  iconOverride,
  menu,
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group relative">
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="px-3 py-4 lg:px-1 text-neutral-400 lg:hidden lg:group-hover:flex items-center justify-center cursor-grab active:cursor-grabbing touch-none shrink-0 outline-none"
      >
        <GripVertical className="size-5 lg:size-4" />
      </button>

      <div className="flex-1 min-w-0">
        <SongItem
          song={song}
          progress={progress}
          isActive={isActive}
          onClickOverride={onClickOverride}
          iconOverride={iconOverride}
          menu={menu}
        />
      </div>
    </div>
  );
}

export const SortableSongItem = memo(SortableSongItemImpl);
