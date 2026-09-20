import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const songId = searchParams.get('id') || searchParams.get('songId');

  if (!songId) {
    return NextResponse.json({ error: 'Missing songId parameter' }, { status: 400 });
  }

  try {
    const yt = await Innertube.create();

    const stream = await yt.download(songId, {
      type: 'video+audio',
      quality: 'best',
      client: 'ANDROID',
    });

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="video_${songId}.mp4"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message || 'Failed to stream video' }, { status: 500 });
  }
}
