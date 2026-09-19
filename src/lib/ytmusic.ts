import YTMusic from 'ytmusic-api';

const ytmusicInstance = new YTMusic();
let initPromise: Promise<YTMusic | undefined> | null = null;

export async function getYTMusic(): Promise<YTMusic> {
  if (!initPromise) {
    initPromise = ytmusicInstance.initialize();
  }

  await initPromise;

  return ytmusicInstance;
}
