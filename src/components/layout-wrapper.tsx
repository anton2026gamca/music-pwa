'use client';

import { SongPlaylist } from "@/components/playlist/song-playlist";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator"
import { useSongsList } from "@/context/songs-list-context";
import { Menu, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SearchBar = dynamic(() => import('@/components/search/search-bar'), { ssr: false });

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleInitialSearchSubmit = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { songsList: downloadedSongs } = useSongsList("downloaded_songs");

  return (
    <div className="bg-background text-foreground h-screen flex flex-col relative overflow-hidden">
      <div className="sticky top-0 z-20 bg-background">
        <header className="px-2 flex items-center justify-between text-nowrap gap-2">
          <span className="md:w-40 flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-input/50 hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="font-medium text-[18px]">Music PWA</Link>
          </span>
          <SearchBar onSearch={handleInitialSearchSubmit} loading={false} className="mx-0 flex-1 max-w-none lg:max-w-xl" />
          <span className="md:w-40 flex justify-end gap-2">
            <ThemeToggle />
          </span>
        </header>
        <Separator />
      </div>

      <main className="w-full flex-1 flex items-stretch relative overflow-hidden">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div className={`
          w-60 lg:w-80 h-full bg-background
          fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0 md:hidden' : '-translate-x-full md:block'}
          md:relative md:translate-x-0
        `}>
          <div className="flex px-2 md:hidden items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-input/50 hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
            <Link href="/" className="font-medium text-[18px]">Music PWA</Link>
          </div>

          <SongPlaylist title="Downloaded Songs" songs={downloadedSongs} />

          <Separator orientation="vertical" className="h-auto min-h-full absolute right-0 top-0" />
        </div>


        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </main>
    </div>
  )
}
