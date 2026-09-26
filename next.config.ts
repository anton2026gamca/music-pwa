import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [
    { url: "/", revision: Date.now().toString() },
    { url: "/watch", revision: Date.now().toString() },
    { url: "/search", revision: Date.now().toString() },
  ],
});

export default withSerwist({
  serverExternalPackages: ['ffmpeg-static'],
  images: {
    remotePatterns: [
      new URL('https://i.ytimg.com/vi/**'),
    ],
  },
});
