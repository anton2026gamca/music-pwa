import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePlaylist } from "@/context/playlist-context"
import { useSongsListContext } from "@/context/songs-list-context"

interface SavePlaylistButtonProps {
  playlistParam?: string | null
  onSave?: (playlistName: string, songIds: string[]) => void
  className?: string
}

export function SavePlaylistButton({ playlistParam = null, onSave, className }: SavePlaylistButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")

  const {
    playlist: currentPlaylist,
  } = usePlaylist()

  const { saveList: createPlaylist } = useSongsListContext();

  const handleSaveClick = () => {
    const ids = currentPlaylist?.map((song) => song.id)
    if (!ids || ids.length === 0) return

    if (playlistParam) {
      console.log(`Saving playlist ${playlistParam} with songs:`, ids)
      onSave?.(playlistParam, ids)
      createPlaylist(playlistParam, ids)
    } else {
      setIsOpen(true)
    }
  }

  const handleConfirmSave = () => {
    const ids = currentPlaylist?.map((song) => song.id)
    const name = newPlaylistName.trim().toLowerCase().replace(" ", "_")

    if (ids && name) {
      console.log(`Saving new playlist ${name} with songs:`, ids)
      onSave?.(name, ids)
      createPlaylist(name, ids)

      setIsOpen(false)
      setNewPlaylistName(playlistParam ?? "")
    }
  }

  return (
    <>
      <Button onClick={handleSaveClick} className={className}>
        Save
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Playlist Name</DialogTitle>
          </DialogHeader>

          <div>
            <Input
              id="playlist-name"
              placeholder="Playlist Name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={!newPlaylistName.trim()}
            >
              Save Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
