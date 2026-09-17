'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
  className?: string;
}

export default function SearchBar({ onSearch, loading, className }: SearchBarProps) {
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
    <form onSubmit={handleSubmit} className={cn('flex w-full max-w-xl items-center gap-2 mx-auto', className)}>
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search for music..."
        disabled={loading}
        className="rounded-full"
      />
      <Button type="submit" disabled={loading || !input.trim()} className="rounded-full">
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
