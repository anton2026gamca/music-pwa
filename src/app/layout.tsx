import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SearchProvider } from "@/context/search-context";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { AudioProvider } from "@/context/audio-context";
import { SongsListProvider } from "@/context/songs-list-context";
import { PlaylistProvider } from "@/context/playlist-context";
import { Suspense } from "react";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Music PWA",
  description: "A music player progressive web application (PWA), for listening to music, downloading it, viewing the lyrics (with synced lyrics), listening to it with your phone screen off, and listening without an internet connection!",
  manifest: "/manifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SongsListProvider>
            <SearchProvider>
              <AudioProvider>
                <Suspense fallback={<div>Loading playlist...</div>}>
                  <PlaylistProvider>
                    <LayoutWrapper>
                      {children}
                    </LayoutWrapper>
                  </PlaylistProvider>
                </Suspense>
              </AudioProvider>
            </SearchProvider>
          </SongsListProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
