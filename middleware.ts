import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!session) {
            // Not logged in, redirect to home
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check if user is super admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            // Not authorized, show 403
            return NextResponse.redirect(new URL('/403', request.url));
        }
    }

    // Check maintenance mode for public routes
    if (!request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/maintenance')) {
        const { data: maintenanceSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

        if (maintenanceSetting?.value?.enabled === true) {
            // Only allow access to login pages during maintenance
            if (!request.nextUrl.pathname.startsWith('/merchant/login') &&
                !request.nextUrl.pathname.startsWith('/api')) {
                return NextResponse.redirect(new URL('/maintenance', request.url));
            }
        }
    }

    return res;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
