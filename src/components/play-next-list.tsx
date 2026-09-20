import { useState } from "react";
import { Switch } from "./ui/switch";
import { SongItem } from "./song-item";
import { Separator } from "./ui/separator";
import { usePlayNext } from "@/context/play-next-context";

export function PlayNextList() {
  const [enabled, setEnabled] = useState(true);

  const { playlist, playNextList, loading } = usePlayNext();

  return (
    <div className="flex flex-col border-b border-border">
      <div className="flex items-center justify-between p-4" onClick={() => setEnabled(!enabled)}>
        <label htmlFor="autoplay-switch" className="text-sm font-semibold uppercase select-none pointer-events-none">Play Next</label>
        <Switch id="autoplay-switch" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {(loading || enabled && playNextList && playNextList.length > 0) && (
        <Separator />
      )}

      {loading && [0, 1, 2, 3, 4].map((i) => (
        <SongItem key={i} song={null} />
      ))}

      {!loading && enabled && playNextList && playNextList.map((song, i) => (
        <SongItem key={i} song={song} />
      ))}
    </div>
  );
}
