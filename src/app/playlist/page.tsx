"use client";

import { useSearchParams } from "next/navigation";

export default function PlaylistPage() {
  const searchParams = useSearchParams();
  const playlistId = searchParams.get("id");

  return (
    <div>{playlistId}</div>
  );
}
