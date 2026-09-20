'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { SongData } from '@/app/api/actions';

interface SearchContextType {
  cachedQuery: string;
  cachedSongs: SongData[];
  setCache: (query: string, songs: SongData[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [cachedQuery, setCachedQuery] = useState('');
  const [cachedSongs, setCachedSongs] = useState<SongData[]>([]);

  const setCache = (query: string, songs: SongData[]) => {
    setCachedQuery(query);
    setCachedSongs(songs);
  };

  return (
    <SearchContext.Provider value={{ cachedQuery, cachedSongs, setCache }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchCache() {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearchCache must be used within a SearchProvider');
  return context;
}
