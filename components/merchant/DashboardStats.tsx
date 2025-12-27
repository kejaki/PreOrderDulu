'use client';

import { DollarSign, Package, CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
    stats: {
        total_revenue: number;
        pending_orders: number;
        completed_today: number;
        avg_rating: number;
    } | null;
    isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm h-32 animate-pulse bg-gray-100" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'Omzet Hari Ini',
            value: `Rp ${stats.total_revenue.toLocaleString('id-ID')}`,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
            delay: 0
        },
        {
            label: 'Pesanan Masuk',
            value: stats.pending_orders,
            icon: Package,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            delay: 0.1
        },
        {
            label: 'Selesai Hari Ini',
            value: stats.completed_today,
            icon: CheckCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            delay: 0.2
        },
        {
            label: 'Rating Toko',
            value: stats.avg_rating ? Number(stats.avg_rating).toFixed(1) : '-',
            icon: Star,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50',
            delay: 0.3
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map((card, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between"
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-wide">{card.label}</span>
                        <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                            <card.icon size={18} />
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                        {card.value}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
