import { Download } from "lucide-react";
import React from "react";

export function formatPlaylistKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const playlistCustomIconMap: Record<string, React.JSX.Element> = {
  downloaded_songs: (<Download className="size-6 text-muted-foreground" />),
};

export function getPlaylistCustomIcon(playlistKey: string, size?: number): React.JSX.Element | null {
  const icon = playlistCustomIconMap[playlistKey];
  if (!icon) return null;

  if (size !== undefined) {
    return React.cloneElement(icon, { className: `size-${size} text-muted-foreground` });
  }

  return icon;
}
