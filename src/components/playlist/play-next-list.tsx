import { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import { SongItem } from "../song/song-item";
import { Separator } from "../ui/separator";
import { usePlaylist } from "@/context/playlist-context";
import { SongData } from "@/app/api/actions";
import { SongPlaylist } from "./song-playlist";
import { Plus } from "lucide-react";

export function PlayNextList() {
  const { playNextList, setPlayNextList, loading, playNextSong, autoplayNext: enabled, setAutoplayNext: setEnabled } = usePlaylist();
  const [onClickOverrides, setOnClickOverrides] = useState<Array<(() => void) | null> | null>(null);

  const getSongOnClickOverride = (song: SongData) => (() => {
    playNextSong(song);
  })

  useEffect(() => {
    if (playNextList) {
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

      {!loading && enabled && playNextList && (
        <SongPlaylist
          songs={playNextList}
          onClickOverrides={onClickOverrides}
          iconOverrides={onClickOverrides?.map(() => <Plus />) ?? null}
          enableReorder={true}
          onReorder={(newSongs) => setPlayNextList(newSongs as SongData[])}
        />
      )}
    </div>
  );
}
