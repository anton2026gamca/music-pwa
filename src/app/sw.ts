import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

// All of these pages are "use client" with no server-rendered data, so the
// RSC payload for /watch is identical no matter what ?id= is in the URL.
// Serwist's defaultCache keys the RSC cache by the full URL (query string
// included), so a never-before-visited ?id= is a guaranteed miss offline,
// and Next's router falls back to a full reload, losing all app state.
// This rule caches the RSC response per *pathname* instead.
const APP_SHELL_ROUTES = new Set(["/", "/watch", "/search", "/playlist"]);

const ignoreSearchPlugin = {
  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    url.search = "";
    return url.href;
  },
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: [/.*/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/download"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url, sameOrigin }) =>
        sameOrigin &&
        request.headers.get("RSC") === "1" &&
        APP_SHELL_ROUTES.has(url.pathname),
      handler: new NetworkFirst({
        cacheName: "app-shell-rsc",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: APP_SHELL_ROUTES.size,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
          ignoreSearchPlugin,
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
