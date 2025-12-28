'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Store, Users, DollarSign, Headphones, Settings, LogOut } from 'lucide-react';

const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Merchants', href: '/admin/merchants', icon: Store },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Financials', href: '/admin/financials', icon: DollarSign },
    { name: 'Support Center', href: '/admin/support', icon: Headphones },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            console.log('🔍 Checking admin access...');
            const { data: { user } } = await supabase.auth.getUser();
            console.log('👤 User:', user?.email);

            if (!user) {
                router.push('/');
                return;
            }

            // Check if user is super admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            console.log('📋 Profile data:', profile);
            console.log('❌ Profile error:', profileError);

            if (!profile) {
                console.log('⚠️ No profile found');
                router.push('/403');
                return;
            }

            if (profile.role !== 'super_admin') {
                console.log('🚫 Role is:', profile.role);
                router.push('/403');
                return;
            }

            console.log('✅ Admin access granted!');

            setIsAuthorized(true);
        } catch (error) {
            console.error('Admin access check failed:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <p className="text-white">Loading...</p>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-white">
                        🔐 Admin Panel
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-rose-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                                `}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}
