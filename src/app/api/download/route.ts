import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import { access, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ffmpegInstaller from 'ffmpeg-static';

export const runtime = 'nodejs';

async function transcodeToFile(ytStream: ReadableStream, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    const ffmpegPath = ffmpegInstaller || 'ffmpeg';

    const ffmpeg = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'copy',
      '-f', 'ipod',
      '-y',
      outPath,
    ]);

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });

    const nodeStream = Readable.fromWeb(ytStream as any);

    nodeStream.pipe(ffmpeg.stdin);

    nodeStream.on('error', (err) => {
      ffmpeg.stdin.destroy();
      reject(err);
    });

    let stderrData = '';
    ffmpeg.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error('[ffmpeg error log]:', stderrData);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

let ytInstance: Innertube | null = null;
async function getYtInstance() {
  if (!ytInstance) {
    ytInstance = await Innertube.create();
  }
  return ytInstance;
}

const globalForDownloads = globalThis as unknown as {
  activeDownloads?: Map<string, Promise<void>>;
};

if (!globalForDownloads.activeDownloads) {
  globalForDownloads.activeDownloads = new Map<string, Promise<void>>();
}
const activeDownloads = globalForDownloads.activeDownloads;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const songId = searchParams.get('id') || searchParams.get('songId');

  if (!songId) {
    return NextResponse.json({ error: 'Missing songId parameter' }, { status: 400 });
  }

  const tmpPath = path.join(os.tmpdir(), `${songId}.m4a`);

  try {
    let downloadPromise = activeDownloads.get(songId);

    if (downloadPromise) {
      console.log(`[Lock] Request found an existing download task for ${songId}`);
      await downloadPromise;
    } else {
      const fileExists = await access(tmpPath).then(() => true).catch(() => false);

      if (!fileExists) {
        downloadPromise = (async () => {
          try {
            console.log(`Started transcoding for songId: ${songId}`);
            const yt = await getYtInstance();
            const ytStream = await yt.download(songId, { type: 'video+audio', quality: 'best', client: 'ANDROID' });
            await transcodeToFile(ytStream as any, tmpPath);
          } finally {
            activeDownloads.delete(songId);
          }
        })();

        activeDownloads.set(songId, downloadPromise);
        await downloadPromise;
      } else {
        console.log(`[Cache] File already exists at ${tmpPath}`);
      }
    }

    const { size } = await stat(tmpPath);
    const range = request.headers.get('range');

    const match = range ? range.match(/bytes=(\d+)-(\d*)/) : null;
    const start = match ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : size - 1;

    const isFullRequest = start === 0 && end === size - 1;

    if (range && !isFullRequest) {
      const nodeStream = createReadStream(tmpPath, { start, end });

      request.signal.addEventListener('abort', () => {
        nodeStream.destroy();
      });

      return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          'Content-Type': 'audio/mp4',
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Content-Length': String(end - start + 1),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const nodeStream = createReadStream(tmpPath);

    request.signal.addEventListener('abort', () => {
      nodeStream.destroy();
    });

    return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Length': String(size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    unlink(tmpPath).catch(() => { });
    return NextResponse.json({ error: error.message || 'Failed to stream video' }, { status: 500 });
  }
}
