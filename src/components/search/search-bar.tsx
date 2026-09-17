'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') || '';
  const [input, setInput] = useState(currentQuery);

  useEffect(() => {
    setInput(currentQuery);
  }, [currentQuery]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl mx-auto items-center gap-2 mb-12">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search for music..."
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !input.trim()}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </>
        ) : (
          'Search'
        )}
      </Button>
    </form>
  );
}
