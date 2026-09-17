"use client";

import { useSearchParams } from "next/navigation";


export default function WatchPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('id');

  return (
    <div>
    </div>
  );
}

