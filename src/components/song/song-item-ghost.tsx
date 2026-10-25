import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../ui/item";
import { Skeleton } from "../ui/skeleton";

export function SongItemGhost() {
  return (
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
}
