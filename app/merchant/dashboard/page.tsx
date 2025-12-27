'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Merchant } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { LogOut, Power, Calendar, Store } from 'lucide-react';
import { DashboardStats } from '@/components/merchant/DashboardStats';
import { RevenueChart } from '@/components/merchant/RevenueChart';
import { MenuPerformance } from '@/components/merchant/MenuPerformance';
import { OrderPipeline } from '@/components/merchant/OrderPipeline';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function MerchantDashboard() {
    const router = useRouter();
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState(new Date());

    // Data States
    const [stats, setStats] = useState(null);
    const [weeklyRevenue, setWeeklyRevenue] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/merchant/login');
            return;
        }

        const { data: merchantData } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .single();

        if (merchantData) {
            setMerchant(merchantData);
            loadDashboardData(merchantData.id);
            subscribeToOrders(merchantData.id);
        } else {
            router.push('/merchant/login');
        }
    };

    const loadDashboardData = async (merchantId: string) => {
        setIsLoading(true);
        try {
            // 1. Get Stats (RPC)
            const { data: statsData } = await supabase.rpc('get_merchant_stats', {
                p_merchant_id: merchantId,
                p_date: date.toISOString()
            });
            if (statsData) setStats(statsData[0]);

            // 2. Get Weekly Revenue (RPC)
            const { data: revenueData } = await supabase.rpc('get_weekly_revenue', {
                p_merchant_id: merchantId
            });
            if (revenueData) setWeeklyRevenue(revenueData);

            // 3. Get Top Products (RPC)
            const { data: productsData } = await supabase.rpc('get_top_products', {
                p_merchant_id: merchantId,
                p_limit: 3
            });
            if (productsData) setTopProducts(productsData);

            // 4. Get Active Orders (Table)
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .eq('merchant_id', merchantId)
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .neq('status', 'rejected')
                // We actually want ALL non-archived orders for the pipeline, or handle history differently
                // For pipeline we need pending -> processing -> ready
                // Let's just fetch everything recent or active
                .order('created_at', { ascending: false });

            // Refetch active + recent pending
            const { data: allActiveOrders } = await supabase
                .from('orders')
                .select(`*, order_items (*)`)
                .eq('merchant_id', merchantId)
                .in('status', ['pending', 'accepted', 'cooking', 'ready', 'delivering'])
                .order('created_at', { ascending: true }); // Oldest first for pipeline usually better?

            if (allActiveOrders) setOrders(allActiveOrders);

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const subscribeToOrders = (merchantId: string) => {
        const sub = supabase.channel('dashboard-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `merchant_id=eq.${merchantId}` },
                () => {
                    // Reload data on change
                    loadDashboardData(merchantId);
                })
            .subscribe();
        return () => sub.unsubscribe();
    };

    const toggleStatus = async () => {
        if (!merchant) return;
        const newStatus = !merchant.is_open;
        setMerchant({ ...merchant, is_open: newStatus });
        await supabase.from('merchants').update({ is_open: newStatus }).eq('id', merchant.id);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

        // If completed/rejected, remove from pipeline after delay or keep? 
        // For Kanban, moving to 'completed' usually removes it from 'Ready' column.

        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

        // Reload stats if completed to update revenue
        if (newStatus === 'completed' && merchant) {
            const { data: statsData } = await supabase.rpc('get_merchant_stats', {
                p_merchant_id: merchant.id,
                p_date: date.toISOString()
            });
            if (statsData) setStats(statsData[0]);
        }
    };

    if (!merchant) return null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary-600 p-2 rounded-xl text-white shadow-lg shadow-primary-200">
                                <Store size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-none">{merchant.merchant_name}</h1>
                                <p className="text-xs text-slate-500 mt-1">Merchant Dashboard</p>
                            </div>

                            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

                            {/* Status Toggle */}
                            <button
                                onClick={toggleStatus}
                                className={`
                                    hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                    ${merchant.is_open
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}
                                `}
                            >
                                <Power size={14} />
                                {merchant.is_open ? 'SHOP OPEN' : 'SHOP CLOSED'}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600">
                                <Calendar size={16} />
                                {format(date, 'd MMMM yyyy', { locale: id })}
                            </div>

                            <Button variant="secondary" size="sm" onClick={() => { supabase.auth.signOut(); router.push('/merchant/login'); }}>
                                <LogOut size={16} className="md:mr-2" />
                                <span className="hidden md:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 1. Key Metrics */}
                <DashboardStats stats={stats} isLoading={isLoading} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Order Pipeline (Takes up 2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Order Pipeline</h2>

                            {/* Mobile Status Toggle */}
                            <button
                                onClick={toggleStatus}
                                className={`
                                    md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                    ${merchant.is_open
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'}
                                `}
                            >
                                <Power size={14} />
                                {merchant.is_open ? 'OPEN' : 'CLOSED'}
                            </button>
                        </div>
                        <OrderPipeline orders={orders} onUpdateStatus={handleUpdateStatus} />
                    </div>

                    {/* 3. Right Column: Analytics */}
                    <div className="space-y-6">
                        <RevenueChart data={weeklyRevenue} isLoading={isLoading} />
                        <MenuPerformance topProducts={topProducts} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
    );
}
