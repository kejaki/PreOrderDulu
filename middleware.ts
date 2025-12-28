import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // For now, just allow access - we'll check role in the client component
        // This is a temporary solution until we properly implement server-side auth
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
