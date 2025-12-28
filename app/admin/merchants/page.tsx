'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, Ban, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Merchant {
    id: string;
    business_name: string;
    email: string;
    phone: string;
    address: string;
    is_active: boolean;
    is_approved: boolean;
    created_at: string;
}

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMerchants();
    }, [activeTab]);

    const fetchMerchants = async () => {
        setIsLoading(true);

        let query = supabase
            .from('merchants')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('is_approved', false);
        }

        const { data } = await query;
        if (data) setMerchants(data);

        setIsLoading(false);
    };

    const handleApprove = async (merchantId: string) => {
        const { error } = await supabase
            .from('merchants')
            .update({ is_approved: true, is_active: true })
            .eq('id', merchantId);

        if (error) {
            toast.error('Gagal menyetujui merchant');
        } else {
            toast.success('Merchant disetujui dan diaktifkan');
            fetchMerchants();
        }
    };

    const handleReject = async (merchantId: string) => {
        if (!confirm('Yakin ingin menolak merchant ini?')) return;

        const { error } = await supabase
            .from('merchants')
            .delete()
            .eq('id', merchantId);

        if (error) {
            toast.error('Gagal menolak merchant');
        } else {
            toast.success('Merchant ditolak dan dihapus');
            fetchMerchants();
        }
    };

    const handleToggleActive = async (merchant: Merchant) => {
        const { error } = await supabase
            .from('merchants')
            .update({ is_active: !merchant.is_active })
            .eq('id', merchant.id);

        if (error) {
            toast.error('Gagal mengupdate status');
        } else {
            toast.success(`Toko ${!merchant.is_active ? 'diaktifkan' : 'disuspend'}`);
            fetchMerchants();
        }
    };

    const filteredMerchants = merchants.filter(m =>
        (m.business_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (m.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Merchant Management</h1>
                <p className="text-slate-400 mt-1">Approve, manage, and monitor all merchants</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'pending'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    Needs Approval
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'all'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    All Merchants
                </button>
            </div>

            {/* Search */}
            {activeTab === 'all' && (
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                </div>
            )}

            {/* Merchants Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Business Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                Address
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
                        ) : filteredMerchants.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    No merchants found
                                </td>
                            </tr>
                        ) : (
                            filteredMerchants.map((merchant) => (
                                <tr key={merchant.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-white">{merchant.business_name}</div>
                                        <div className="text-xs text-slate-400">
                                            Registered: {new Date(merchant.created_at).toLocaleDateString('id-ID')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300">{merchant.email}</div>
                                        <div className="text-xs text-slate-400">{merchant.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-300 max-w-xs truncate">{merchant.address}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={merchant.is_approved ? 'success' : 'warning'}>
                                                {merchant.is_approved ? 'Approved' : 'Pending'}
                                            </Badge>
                                            {merchant.is_approved && (
                                                <Badge variant={merchant.is_active ? 'success' : 'danger'}>
                                                    {merchant.is_active ? 'Active' : 'Suspended'}
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {!merchant.is_approved ? (
                                                <>
                                                    <Button onClick={() => handleApprove(merchant.id)} size="sm" variant="primary">
                                                        <CheckCircle size={14} className="mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button onClick={() => handleReject(merchant.id)} size="sm" variant="danger">
                                                        <XCircle size={14} className="mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handleToggleActive(merchant)}
                                                    size="sm"
                                                    variant={merchant.is_active ? 'danger' : 'primary'}
                                                >
                                                    <Ban size={14} className="mr-1" />
                                                    {merchant.is_active ? 'Suspend' : 'Activate'}
                                                </Button>
                                            )}
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
