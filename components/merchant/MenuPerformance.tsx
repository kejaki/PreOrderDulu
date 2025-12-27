'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Image as ImageIcon } from 'lucide-react';

interface MenuPerformanceProps {
    topProducts: {
        id: string;
        name: string;
        sold_count: number;
        image_url?: string;
    }[];
    isLoading: boolean;
}

export function MenuPerformance({ topProducts, isLoading }: MenuPerformanceProps) {
    if (isLoading) {
        return <div className="bg-white rounded-3xl p-6 h-[350px] shadow-sm animate-pulse bg-gray-50" />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[350px] flex flex-col"
        >
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Top Menu</h3>
                    <p className="text-slate-500 text-sm">Best sellers this month</p>
                </div>
                <div className="bg-green-50 p-2 rounded-xl text-green-600">
                    <TrendingUp size={20} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {topProducts.length > 0 ? (
                    topProducts.map((product, idx) => (
                        <div key={product.id} className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <ImageIcon size={16} />
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 bg-slate-900/80 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-br-lg font-bold">
                                    {idx + 1}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary-DEFAULT transition-colors">
                                    {product.name}
                                </h4>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-rose-500 to-orange-500 h-full rounded-full"
                                        style={{ width: `${Math.min((product.sold_count / (topProducts[0]?.sold_count || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-slate-900">{product.sold_count}</span>
                                <span className="text-[10px] text-slate-500">sold</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                        <TrendingDown size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">No sales data yet.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
