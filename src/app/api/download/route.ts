import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache } from 'youtubei.js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // 1. Initialize standard client session using standard internal settings
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      retrieve_player: true,
    });

    // 2. Fetch the video information object first
    // This allows YouTube's backend to authorize the metadata structure correctly
    const videoInfo = await youtube.getInfo(videoId);

    // 3. Request download streaming on the resolved info structure
    // We target the native web environment profile to guarantee audio stream extraction
    const nodeStream = await videoInfo.download({
      type: 'audio',
      quality: 'best',
      format: 'any',
      client: 'WEB',
    });

    const reader = nodeStream.getReader();

    const webStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
      cancel() {
        reader.cancel();
      }
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${videoId}.m4a"`,
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('Streaming configuration issue:', error);
    return NextResponse.json({
      error: 'Streaming execution failed',
      details: error?.message || error
    }, { status: 500 });
  }
}
