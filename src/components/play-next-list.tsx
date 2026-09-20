import { startTransition, useEffect, useState } from "react";
import { Switch } from "./ui/switch";
import { SongItem } from "./song-item";
import { Separator } from "./ui/separator";
import { usePlayNext } from "@/context/play-next-context";
import { SongData } from "@/app/api/actions";
import { useRouter } from "next/navigation";

export function PlayNextList() {
  const router = useRouter()

  const [enabled, setEnabled] = useState(true);
  const { playNextList, loading, nextSong } = usePlayNext();
  const [onClickOverrides, setOnClickOverrides] = useState<Array<(() => void) | null> | null>(null);

  const getSongOnClickOverride = (song: SongData) => (() => {
    nextSong(song);
    startTransition(() => {
      router.push(`/watch?id=${song.id}`)
    })
  })

  useEffect(() => {
    if (getSongOnClickOverride && playNextList) {
      const overrides = playNextList.map((song) => getSongOnClickOverride(song));
      setOnClickOverrides(overrides);
    }
  }, [playNextList])

  return (
    <div className="flex flex-col border-b border-border">
      <div className="flex items-center justify-between px-3 py-2" onClick={() => setEnabled(!enabled)}>
        <h3 className="text-sm font-semibold uppercase">Play Next</h3>
        <span className="flex items-center gap-3">
          <label htmlFor="autoplay-switch" className="text-sm select-none pointer-events-none">Autoplay</label>
          <Switch id="autoplay-switch" checked={enabled} onCheckedChange={setEnabled} />
        </span>
      </div>

      {(loading || enabled && playNextList && playNextList.length > 0) && (
        <Separator />
      )}

      {loading && [0, 1, 2, 3, 4].map((i) => (
        <SongItem key={i} song={null} />
      ))}

      {!loading && enabled && playNextList && playNextList.map((song, i) => (
        <SongItem key={i} song={song} onClickOverride={onClickOverrides?.[i] ?? undefined} />
      ))}
    </div>
  );
}
