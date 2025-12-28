'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Store, ShoppingCart, DollarSign } from 'lucide-react';

interface PlatformStats {
    total_users: number;
    total_merchants: number;
    total_active_orders: number;
    total_revenue: number;
}

interface ChartData {
    date: string;
    users: number;
    orders: number;
}

export default function AdminOverview() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);

        // Fetch platform stats
        const { data: statsData } = await supabase.rpc('get_platform_stats');
        if (statsData) setStats(statsData);

        // Fetch registrations
        const { data: registrations } = await supabase.rpc('get_daily_registrations');

        // Fetch order volume
        const { data: orders } = await supabase.rpc('get_daily_order_volume');

        // Merge data
        if (registrations && orders) {
            const merged = registrations.map((reg: any) => {
                const orderData = orders.find((o: any) => o.date === reg.date);
                return {
                    date: new Date(reg.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    users: reg.count,
                    orders: orderData?.count || 0
                };
            });
            setChartData(merged);
        }

        setIsLoading(false);
    };

    const statCards = [
        { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
        { label: 'Total Merchants', value: stats?.total_merchants || 0, icon: Store, color: 'bg-green-500' },
        { label: 'Active Orders', value: stats?.total_active_orders || 0, icon: ShoppingCart, color: 'bg-yellow-500' },
        { label: 'Platform Revenue', value: `Rp${(stats?.total_revenue || 0).toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-rose-500' },
    ];

    return (
        <div className="p-8 bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-slate-400 mt-1">Platform statistics and analytics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6">User Growth vs Order Volume (Last 30 Days)</h2>
                {isLoading ? (
                    <div className="h-80 flex items-center justify-center">
                        <p className="text-slate-400">Loading chart...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                            <Line type="monotone" dataKey="orders" stroke="#f43f5e" strokeWidth={2} name="Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
