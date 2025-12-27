'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Package, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface OrderResult {
    id: string;
    tracking_token: string;
    status: string;
    total_amount: number;
    created_at: string;
    merchants: {
        merchant_name: string;
    } | null;
}

export default function OrderLookupPage() {
    const [phone, setPhone] = useState('');
    const [orders, setOrders] = useState<OrderResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!phone.trim()) {
            toast.error('Please enter your WhatsApp number');
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, tracking_token, status, total_amount, created_at, merchants(merchant_name)')
                .eq('guest_whatsapp', phone.trim())
                .not('status', 'in', '(completed,cancelled)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            setOrders(data as OrderResult[]);

            if (data.length === 0) {
                toast('No active orders found for this number');
            } else {
                toast.success(`Found ${data.length} order(s)`);
            }
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to search orders. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            accepted: 'bg-blue-100 text-blue-700',
            cooking: 'bg-orange-100 text-orange-700',
            ready: 'bg-green-100 text-green-700',
            delivering: 'bg-purple-100 text-purple-700',
        };

        const statusLabels: Record<string, string> = {
            pending: 'Menunggu',
            accepted: 'Diterima',
            cooking: 'Dimasak',
            ready: 'Siap',
            delivering: 'Dikirim',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 py-12 px-4"
        >
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="bg-primary-DEFAULT w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-200">
                        <Search size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Cari Pesanan Kamu</h1>
                    <p className="text-gray-600">Masukkan nomor WhatsApp untuk menemukan pesanan aktif</p>
                </div>

                {/* Search Card */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Phone size={16} className="text-primary-DEFAULT" />
                            Nomor WhatsApp
                        </label>
                        <input
                            type="tel"
                            placeholder="08123456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-DEFAULT transition-all text-gray-900 placeholder:text-gray-400"
                        />
                        <p className="text-xs text-gray-500">Nomor yang kamu gunakan saat pesan</p>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="w-full py-3 bg-primary-DEFAULT text-white font-bold rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Mencari...
                            </>
                        ) : (
                            <>
                                <Search size={20} />
                                Cari Pesanan Saya
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {hasSearched && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {orders.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="font-bold text-gray-700 mb-1">Tidak ada pesanan aktif</h3>
                                <p className="text-sm text-gray-500">Coba periksa nomor atau buat pesanan baru</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-lg font-bold text-gray-900">Pesanan Aktif ({orders.length})</h2>
                                {orders.map((order) => (
                                    <Link key={order.id} href={`/order/${order.tracking_token}`}>
                                        <motion.div
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">{order.merchants?.merchant_name || 'Unknown Merchant'}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                                <ArrowRight size={20} className="text-gray-400" />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                <span className="text-lg font-bold text-primary-DEFAULT">
                                                    Rp {order.total_amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </>
                        )}
                    </motion.div>
                )}

                {/* Back Link */}
                <Link
                    href="/"
                    className="block text-center text-gray-500 hover:text-primary-DEFAULT transition-colors text-sm font-medium"
                >
                    ← Kembali ke Beranda
                </Link>
            </div>
        </motion.div>
    );
}
