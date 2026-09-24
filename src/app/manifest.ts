import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Music PWA',
    short_name: 'Music PWA',
    description: 'A music player progressive web application (PWA), for listening to music, downloading it, viewing the lyrics (with synced lyrics), listening to it with your phone screen off, and listening without an internet connection!',
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
