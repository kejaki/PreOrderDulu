'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueData {
    date: string;
    revenue: number;
    orders: number;
}

interface Transaction {
    id: string;
    order_id: string;
    merchant_name: string;
    customer_email: string;
    amount: number;
    platform_fee: number;
    created_at: string;
    status: string;
}

export default function AdminFinancialsPage() {
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalFees, setTotalFees] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        setIsLoading(true);

        // Get platform fee percentage from settings
        const { data: feeSettings } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'platform_fee_percent')
            .single();

        const feePercent = feeSettings?.value?.value || 5;

        // Get all completed orders
        const { data: orders } = await supabase
            .from('orders')
            .select(`
                id,
                total_price,
                created_at,
                status,
                customer_email,
                merchants!inner(business_name)
            `)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(50);

        if (orders) {
            // Calculate total revenue and fees
            const total = orders.reduce((sum, order) => sum + order.total_price, 0);
            const fees = total * (feePercent / 100);

            setTotalRevenue(total);
            setTotalFees(fees);

            // Calculate monthly revenue (current month)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyTotal = orders
                .filter(order => {
                    const orderDate = new Date(order.created_at);
                    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                })
                .reduce((sum, order) => sum + order.total_price, 0);

            setMonthlyRevenue(monthlyTotal);

            // Prepare revenue chart data (last 7 days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toISOString().split('T')[0];
            });

            const chartData = last7Days.map(date => {
                const dayOrders = orders.filter(order =>
                    order.created_at.split('T')[0] === date
                );
                return {
                    date: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    revenue: dayOrders.reduce((sum, order) => sum + order.total_price, 0),
                    orders: dayOrders.length
                };
            });

            setRevenueData(chartData);

            // Prepare transactions list
            const txList: Transaction[] = orders.map(order => ({
                id: order.id,
                order_id: order.id.substring(0, 8),
                merchant_name: (order.merchants as any).business_name,
                customer_email: order.customer_email,
                amount: order.total_price,
                platform_fee: order.total_price * (feePercent / 100),
                created_at: order.created_at,
                status: order.status
            }));

            setTransactions(txList);
        }

        setIsLoading(false);
    };

    const statCards = [
        { label: 'Total Revenue', value: `Rp${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Platform Fees', value: `Rp${totalFees.toLocaleString('id-ID')}`, icon: CreditCard, color: 'bg-blue-500' },
        { label: 'This Month', value: `Rp${monthlyRevenue.toLocaleString('id-ID')}`, icon: TrendingUp, color: 'bg-purple-500' },
        { label: 'Transactions', value: transactions.length, icon: Calendar, color: 'bg-yellow-500' },
    ];

    return (
        <div className="p-8 bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Platform Financials</h1>
                <p className="text-slate-400 mt-1">Track revenue, fees, and transactions</p>
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

            {/* Revenue Chart */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">Revenue Trend (Last 7 Days)</h2>
                {isLoading ? (
                    <div className="h-80 flex items-center justify-center">
                        <p className="text-slate-400">Loading chart...</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={revenueData}>
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
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue (Rp)" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Transactions Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Merchant
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Platform Fee
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-mono text-white">#{tx.order_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-300">{tx.merchant_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-300">{tx.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-green-400">
                                                Rp{tx.amount.toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-blue-400">
                                                Rp{tx.platform_fee.toLocaleString('id-ID')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-300">
                                                {new Date(tx.created_at).toLocaleDateString('id-ID')}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
