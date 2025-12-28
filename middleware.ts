import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    // Create Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
            },
        }
    );

    // Get session from cookies
    const sessionToken = request.cookies.get('sb-access-token')?.value;

    // Admin route protection
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!sessionToken) {
            // Not logged in, redirect to home
            return NextResponse.redirect(new URL('/', request.url));
        }

        try {
            // Verify session and check role
            const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

            if (error || !user) {
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Check if user is super admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'super_admin') {
                // Not authorized, show 403
                return NextResponse.redirect(new URL('/403', request.url));
            }
        } catch (error) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Check maintenance mode for public routes
    if (!request.nextUrl.pathname.startsWith('/admin') &&
        !request.nextUrl.pathname.startsWith('/maintenance') &&
        !request.nextUrl.pathname.startsWith('/403')) {

        try {
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
        } catch (error) {
            // If can't fetch settings, allow access
            console.error('Maintenance check failed:', error);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
