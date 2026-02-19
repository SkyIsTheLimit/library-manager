import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const body = await response.text();
    
    // Create a new response with the content
    const proxiedResponse = new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });

    // Strip security headers that prevent framing
    proxiedResponse.headers.delete('X-Frame-Options');
    proxiedResponse.headers.delete('Content-Security-Policy');
    proxiedResponse.headers.delete('X-Content-Security-Policy');
    proxiedResponse.headers.delete('X-WebKit-CSP');

    return proxiedResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Proxy failed', { status: 500 });
  }
}
