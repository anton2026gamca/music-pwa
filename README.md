# Music PWA

A music player progressive web application (PWA), for listening to music, downloading it, viewing the lyrics (with synced lyrics), listening to it with your phone screen off, and listening without an internet connection!

> [!NOTE]
> Why isn't this project hosted on Vercel or any other hosting platform?
> 
> **Downloads fail with `"Video is login required"`**
> This is YouTube's anti-bot protection denying requests from known datacenter IP ranges

## Features

- Search and play songs
- Synced lyrics
- Background playback (screen off)
- Download songs for offline playback
- Installable as a PWA (offline support, home screen icon)

## Try it out

```bash
git clone https://github.com/anton2026gamca/music-pwa
cd music-pwa
npm install
```

The service worker (offline support and PWA functionality) is **disabled in dev mode** — `npm run dev` is fine for trying the app out online, on a laptop, but to actually try the PWA/offline features you need a production build:

```bash
npm run build
npm run start
```

### Trying it out on your phone

A PWA needs to be hosted on HTTPS to be installable and for the service worker to work. The easiest way to do this with a locally running server, is a reverse tunnel:

```bash
npm run build
npm run start
```

In a second terminal:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Open the printed HTTPS URL on your phone (same Wi-Fi isn't required, since it's a public tunnel URL) and install it:

- **Android (Chrome):** you should see an "Install app" banner, or open the **⋮** menu → **Add to Home screen** / **Install app**.
- **iPhone (Safari):** tap the **Share** button → **Add to Home Screen**.

> [!NOTE]
> The PWA support doesn't work on firefox

Once installed, it opens full-screen from your home screen like a native app (no url bar, etc.)
