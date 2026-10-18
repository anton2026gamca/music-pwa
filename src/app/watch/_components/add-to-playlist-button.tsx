import { SongData } from "@/app/api/actions";
import { PlaylistItem } from "@/components/playlist/playlist-item";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePlaylist } from "@/context/playlist-context";
import { useSongsListContext } from "@/context/songs-list-context";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";


export function AddToPlaylistButton({ song }: { song: SongData | null }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const {
    addSong: addSongToPlaylist,
    getSongsList: getPlaylistSongs,
    getSavedLists: getSavedPlaylists
  } = useSongsListContext();

  const {
    playlist: currentPlaylist,
    setPlaylist: setCurrentPlaylist
  } = usePlaylist();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <Button
            onClick={() => setOpen(true)}
            disabled={!song}
          >
            <Plus /> Add to playlist
          </Button>
        } />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add "{song?.title}" to Playlist</DialogTitle>
          </DialogHeader>

          <div className="border-t border-border">
            {["current_playlist", ...getSavedPlaylists()]
              .filter((playlistKey) => (
                !song ||
                (playlistKey === "current_playlist"
                  ? currentPlaylist?.find((s) => s.id === song.id) === undefined
                  : !getPlaylistSongs(playlistKey).includes(song.id)
                )
              ))
              .map((playlistKey) => (
                <PlaylistItem
                  playlistKey={playlistKey}
                  className="hover:bg-background"
                  iconOverride={<Plus />}
                  songCountTextOverride={
                    playlistKey === "current_playlist"
                      ? `${currentPlaylist?.length ?? 0} song${currentPlaylist?.length === 1 ? '' : 's'}`
                      : undefined
                  }
                  onClickOverride={() => {
                    if (song) {
                      if (playlistKey === "current_playlist") {
                        setCurrentPlaylist([...currentPlaylist?.filter((s) => s.id !== song.id) ?? [], song]);
                        setOpen(false);
                      } else {
                        addSongToPlaylist(playlistKey, song);
                        router.push(`/playlist?id=${encodeURIComponent(playlistKey)}`);
                      }
                    }
                  }}
                />
              ))
            }
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
