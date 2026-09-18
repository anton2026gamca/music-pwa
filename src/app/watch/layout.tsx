'use client';

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator"
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";


const SearchBar = dynamic(() => import('@/components/search/search-bar'), { ssr: false });

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleInitialSearchSubmit = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground lg:h-screen flex flex-col">
      <header className="py-2 px-4 flex items-center justify-between text-nowrap gap-2">
        <Link href="/" className="font-medium text-[18px] md:w-40">Music PWA</Link>
        <SearchBar onSearch={handleInitialSearchSubmit} loading={false} className="mx-0 flex-1 max-w-none lg:max-w-xl" />
        <span className="md:w-40 flex justify-end gap-2">
          <ThemeToggle />
        </span>
      </header>
      <Separator />
      <main className="w-full flex-1">{children}</main>
    </div>
  )
}
