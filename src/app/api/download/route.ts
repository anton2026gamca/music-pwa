import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id') || searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
  }

  try {
    const yt = await Innertube.create();

    const stream = await yt.download(videoId, {
      type: 'video+audio',
      quality: 'best',
      client: 'ANDROID',
    });

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="video_${videoId}.mp4"`,
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message || 'Failed to stream video' }, { status: 500 });
  }
}
