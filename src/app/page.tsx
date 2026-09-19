'use client';

import { useRouter } from 'next/navigation';
import { Music4 } from "lucide-react";
import dynamic from 'next/dynamic';
import { CurrentlyPlaying } from '@/components/currently-playing';
import { Separator } from '@/components/ui/separator';

const SearchBar = dynamic(() => import('@/components/search/search-bar'), { ssr: false });

export default function Home() {
  const router = useRouter();

  const handleInitialSearchSubmit = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="h-full max-h-full bg-background text-foreground flex flex-col relative">
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-10 mt-20">
          <header className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-muted text-muted-foreground rounded-full">
              <Music4 className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Music PWA</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A hobby web-app to search, find, and download music!
            </p>
          </header>

          <SearchBar onSearch={handleInitialSearchSubmit} loading={false} />
        </div>
      </div>

      <Separator orientation="horizontal" />
      <CurrentlyPlaying />
    </div>
  );
}
