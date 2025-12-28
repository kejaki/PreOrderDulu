'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Ban, UserX, Search, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    role: string;
    is_banned: boolean;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);

        const { data } = await supabase
            .from('profiles')
            .select('id, role, is_banned, created_at')
            .eq('role', 'user')
            .order('created_at', { ascending: false });

        if (data) {
            // Fetch auth data for each user
            const usersWithAuth = await Promise.all(
                data.map(async (profile) => {
                    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
                    return {
                        ...profile,
                        email: user?.email || 'N/A',
                        last_sign_in_at: user?.last_sign_in_at || profile.created_at
                    };
                })
            );
            setUsers(usersWithAuth as User[]);
        }

        setIsLoading(false);
    };

    const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
        if (!confirm(`Yakin ingin ${currentBanStatus ? 'unban' : 'ban'} user ini?`)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: !currentBanStatus })
            .eq('id', userId);

        if (error) {
            toast.error('Gagal update status ban');
        } else {
            toast.success(`User ${!currentBanStatus ? 'dibanned' : 'di-unbanned'}`);
            fetchUsers();
        }
    };

    const handleSendPasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            toast.error('Gagal mengirim email reset password');
        } else {
            toast.success('Email reset password terkirim');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <p className="text-slate-400 mt-1">Manage platform users and their access</p>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
            </div>

            {/* Users Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Registered
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Last Sign In
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-white">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300">
                                            {new Date(user.created_at).toLocaleDateString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300">
                                            {new Date(user.last_sign_in_at).toLocaleDateString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={user.is_banned ? 'danger' : 'success'}>
                                            {user.is_banned ? 'Banned' : 'Active'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleBanUser(user.id, user.is_banned)}
                                                size="sm"
                                                variant={user.is_banned ? 'primary' : 'danger'}
                                            >
                                                <UserX size={14} className="mr-1" />
                                                {user.is_banned ? 'Unban' : 'Ban'}
                                            </Button>
                                            <Button
                                                onClick={() => handleSendPasswordReset(user.email)}
                                                size="sm"
                                                variant="secondary"
                                            >
                                                <Mail size={14} className="mr-1" />
                                                Reset PW
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
