'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SongResult } from '@/app/api/actions';

interface SearchContextType {
  cachedQuery: string;
  cachedVideos: SongResult[];
  setCache: (query: string, videos: SongResult[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [cachedQuery, setCachedQuery] = useState('');
  const [cachedVideos, setCachedVideos] = useState<SongResult[]>([]);

  const setCache = (query: string, videos: SongResult[]) => {
    setCachedQuery(query);
    setCachedVideos(videos);
  };

  return (
    <SearchContext.Provider value={{ cachedQuery, cachedVideos, setCache }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchCache() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearchCache must be used within a SearchProvider');
  return context;
}
