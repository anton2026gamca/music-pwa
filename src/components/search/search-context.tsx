'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SongData } from '@/app/api/actions';

interface SearchContextType {
  cachedQuery: string;
  cachedVideos: SongData[];
  setCache: (query: string, videos: SongData[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [cachedQuery, setCachedQuery] = useState('');
  const [cachedVideos, setCachedVideos] = useState<SongData[]>([]);

  const setCache = (query: string, videos: SongData[]) => {
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
