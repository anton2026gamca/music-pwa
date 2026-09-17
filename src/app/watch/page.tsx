"use client";

import { useSearchParams } from "next/navigation";
import { getSongDetails, SongData } from "../api/actions";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function formatDuration(seconds?: number): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<SongData | null>(null);

  useEffect(() => {
    if (!videoId) {
      setError("No song ID provided.");
      setLoading(false);
      return;
    }

    const forwardedSong = sessionStorage.getItem(`song_${videoId}`);
    if (forwardedSong) {
      setSong(JSON.parse(forwardedSong));
      setLoading(false);
      return;
    }

    setLoading(true);
    getSongDetails(videoId)
      .then((songData) => {
        if (songData) setSong(songData);
        else setError("Could not retrieve song details.");
      })
      .catch(() => setError("An unexpected server error occurred."))
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row w-full min-h-screen mx-auto items-stretch lg:max-h-screen">
        <div className="w-full lg:w-2/3 space-y-3 p-4">
          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
            <Skeleton className="absolute inset-0 w-full h-full" />
          </div>
          <div className="px-1">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </div>
        </div>

        <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
        <Separator orientation="horizontal" className="block lg:hidden my-2" />

        <div className="w-full lg:w-1/3 flex flex-col overflow-auto p-4">
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-semibold tracking-tight">Failed to load track</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>

        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Return to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-full items-stretch">
      <div className="w-full lg:w-2/3 space-y-3 p-4">
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
          <Image src={song.thumbnailUrl} alt={song.title} fill className="object-cover" />
        </div>
        <div className="px-1">
          <h2 className="text-xl font-semibold tracking-tight">{song.title}</h2>
          <p className="text-sm text-muted-foreground">{song.artistName}</p>
        </div>
      </div>

      <Separator orientation="vertical" className="hidden lg:block h-auto min-h-full" />
      <Separator orientation="horizontal" className="block lg:hidden my-2" />

      <div className="w-full lg:w-1/3 flex flex-col overflow-auto p-4">
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  );
}
