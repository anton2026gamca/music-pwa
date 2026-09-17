'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchSongs, SongResult } from '@/app/api/actions';
import SongCard from '@/components/search/song-item';

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Music4, SearchX } from "lucide-react";
import { ThemeToggle } from '@/components/theme/theme-toggle';
import dynamic from 'next/dynamic';

const SearchBar = dynamic(() => import('@/components/search/search-bar'), { ssr: false });

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetQuery = searchParams.get('q') || '';

  const [videos, setVideos] = useState<SongResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!targetQuery) return;

    const cachedData = sessionStorage.getItem(`search_cache_${targetQuery}`);

    if (cachedData) {
      setVideos(JSON.parse(cachedData));
      setHasSearched(true);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const results = await searchSongs(targetQuery);
        const validResults = results || [];
        setVideos(validResults);
        sessionStorage.setItem(`search_cache_${targetQuery}`, JSON.stringify(validResults));
      } catch (error) {
        console.error('Error fetching data:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [targetQuery]);

  const handleSearchSubmit = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-muted text-muted-foreground rounded-full">
            <Music4 className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Search Results</h1>
        </header>

        <div className='absolute top-4 right-4'>
          <ThemeToggle />
        </div>

        <SearchBar onSearch={handleSearchSubmit} loading={loading} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Searching...</p>
          </div>
        ) : (
          videos.length > 0 ? (
            <div className="flex flex-col">
              {videos.map((song) => (
                <SongCard key={song.id} video={song} />
              ))}
            </div>
          ) : (
            hasSearched && (
              <Card className="max-w-sm mx-auto border-dashed shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="p-3 bg-muted rounded-full text-muted-foreground">
                    <SearchX className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm tracking-tight">No search results</p>
                    <p className="text-xs text-muted-foreground">Try searching for something else</p>
                  </div>
                </CardContent>
              </Card>
            )
          )
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
